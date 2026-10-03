import type { ApiError, GenerateActionResponse } from "@/types/api";
import { generateNextAction } from "@/lib/rules/engine";
import {
  RepositoryNotFoundError,
  type CaseRecord,
  type CaseResultRecord,
} from "@/lib/repositories/repositories";

export interface ActionGenerationDependencies {
  getCaseById(id: string): Promise<CaseRecord>;
  getCaseResultByCaseId(caseId: string): Promise<CaseResultRecord>;
}

interface HandlerOptions {
  logger?: Pick<Console, "error">;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(status: number, code: string, error: string): Response {
  const body: ApiError = { success: false, code, error };
  return Response.json(body, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function handleGenerateAction(
  request: Request,
  dependencies: ActionGenerationDependencies,
  options: HandlerOptions = {}
): Promise<Response> {
  const logger = options.logger ?? console;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "Expected a JSON request body.");
  }
  if (!isRecord(body) || typeof body.caseId !== "string" || !UUID_PATTERN.test(body.caseId)) {
    return errorResponse(400, "INVALID_REQUEST", "caseId must be a valid UUID.");
  }

  let storedCase: CaseRecord;
  try {
    storedCase = await dependencies.getCaseById(body.caseId);
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) {
      return errorResponse(404, "CASE_NOT_FOUND", "Case was not found.");
    }
    logger.error("Case repository read failed.", error);
    return errorResponse(500, "PERSISTENCE_FAILED", "The case could not be read.");
  }

  let storedResult: CaseResultRecord;
  try {
    storedResult = await dependencies.getCaseResultByCaseId(storedCase.id);
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) {
      return errorResponse(409, "RESULT_NOT_READY", "The case result is not ready.");
    }
    logger.error("Case result repository read failed.", error);
    return errorResponse(500, "PERSISTENCE_FAILED", "The case result could not be read.");
  }

  const generated = generateNextAction(storedResult.result, storedCase.expenseCase);
  const response: GenerateActionResponse = {
    success: true,
    caseId: storedCase.id,
    action: generated.action,
    template: generated.template,
    webhookTriggered: false,
  };
  return Response.json(response, { status: 200 });
}
