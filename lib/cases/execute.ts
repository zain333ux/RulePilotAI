import type { ExecuteCaseResponse, ApiError } from "@/types/api";
import type { ExpenseCase, PolicyRule } from "@/types/contracts";
import { evaluateExpenseCase } from "@/lib/rules/engine";
import {
  RepositoryNotFoundError,
  type CaseRecord,
  type CaseResultRecord,
  type CreateCaseInput,
  type SaveCaseResultInput,
  type WorkflowRecord,
} from "@/lib/repositories/repositories";

export interface CaseExecutionDependencies {
  getWorkflowById(id: string): Promise<WorkflowRecord>;
  getPolicyRulesByDocumentId(documentId: string): Promise<PolicyRule[]>;
  createCase(input: CreateCaseInput): Promise<CaseRecord>;
  saveCaseResult(input: SaveCaseResultInput): Promise<CaseResultRecord>;
}

interface HandlerOptions {
  logger?: Pick<Console, "error">;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOOLEAN_FIELDS = [
  "receipt",
  "managerApproval",
  "financeApproval",
  "internationalTravel",
  "preApproval",
] as const;

function errorResponse(status: number, code: string, error: string): Response {
  const body: ApiError = { success: false, code, error };
  return Response.json(body, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function validateExpenseCase(value: unknown): value is ExpenseCase {
  if (!isRecord(value)) return false;
  if (typeof value.employeeName !== "string" || value.employeeName.trim() === "") return false;
  if (typeof value.category !== "string" || value.category.trim() === "") return false;
  if (typeof value.amount !== "number" || !Number.isFinite(value.amount) || value.amount < 0) return false;
  if (BOOLEAN_FIELDS.some((field) => typeof value[field] !== "boolean")) return false;
  if (!validDate(value.expenseDate) || !validDate(value.submissionDate)) return false;
  if (value.submissionDate < value.expenseDate) return false;
  if (value.hotelNightlyRate !== undefined
    && (typeof value.hotelNightlyRate !== "number"
      || !Number.isFinite(value.hotelNightlyRate)
      || value.hotelNightlyRate < 0)) return false;
  if (value.hotelNights !== undefined
    && (typeof value.hotelNights !== "number"
      || !Number.isInteger(value.hotelNights)
      || value.hotelNights <= 0)) return false;
  if (/\b(hotel|lodging)\b/i.test(value.category) && value.hotelNightlyRate === undefined) return false;
  return true;
}

export async function handleExecuteCase(
  request: Request,
  dependencies: CaseExecutionDependencies,
  options: HandlerOptions = {}
): Promise<Response> {
  const logger = options.logger ?? console;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "Expected a JSON request body.");
  }

  if (!isRecord(body) || typeof body.workflowId !== "string" || !UUID_PATTERN.test(body.workflowId)) {
    return errorResponse(400, "INVALID_REQUEST", "workflowId must be a valid UUID.");
  }
  if (!validateExpenseCase(body.expenseCase)) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid expense case.");
  }

  let workflow: WorkflowRecord;
  try {
    workflow = await dependencies.getWorkflowById(body.workflowId);
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) {
      return errorResponse(404, "WORKFLOW_NOT_FOUND", "Workflow was not found.");
    }
    logger.error("Workflow repository read failed.", error);
    return errorResponse(500, "PERSISTENCE_FAILED", "The case could not be evaluated.");
  }

  let rules: PolicyRule[];
  try {
    rules = await dependencies.getPolicyRulesByDocumentId(workflow.documentId);
  } catch (error) {
    logger.error("Policy rule repository read failed.", error);
    return errorResponse(500, "PERSISTENCE_FAILED", "The case could not be evaluated.");
  }
  if (rules.length === 0) {
    return errorResponse(409, "RULES_NOT_READY", "Policy rules are not ready for this workflow.");
  }

  let storedCase: CaseRecord;
  try {
    storedCase = await dependencies.createCase({
      workflowId: workflow.id,
      expenseCase: body.expenseCase,
    });
  } catch (error) {
    logger.error("Case repository insert failed.", error);
    return errorResponse(500, "PERSISTENCE_FAILED", "The case could not be saved.");
  }

  const evaluatedResult = evaluateExpenseCase(body.expenseCase, rules);
  try {
    const savedResult = await dependencies.saveCaseResult({
      caseId: storedCase.id,
      result: evaluatedResult,
      reason: evaluatedResult.violations.length === 0
        ? "All structured policy rules passed."
        : evaluatedResult.violations.map((violation) => violation.message).join(" "),
      evidence: evaluatedResult.violations.map((violation) => violation.citation),
    });
    const response: ExecuteCaseResponse = {
      success: true,
      caseId: storedCase.id,
      caseResult: savedResult.result,
    };
    return Response.json(response, { status: 200 });
  } catch (error) {
    logger.error("Case result insert failed after case creation.", { caseId: storedCase.id, error });
    return errorResponse(500, "PERSISTENCE_FAILED", "The case result could not be saved.");
  }
}
