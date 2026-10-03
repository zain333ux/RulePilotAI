import type { ApiError, GenerateWorkflowResponse } from "@/types/api";
import type { PolicyRule, WorkflowDefinition } from "@/types/contracts";
import { RepositoryNotFoundError, type DocumentRecord, type SaveWorkflowInput, type WorkflowRecord } from "@/lib/repositories/repositories";
import { WorkflowGenerationError } from "@/lib/rules/workflow";

export interface GenerateWorkflowDependencies {
  getDocumentById(id: string): Promise<DocumentRecord>;
  getPolicyRulesByDocumentId(documentId: string): Promise<PolicyRule[]>;
  generateWorkflowFromRules(rules: PolicyRule[]): WorkflowDefinition;
  saveWorkflow(input: SaveWorkflowInput): Promise<WorkflowRecord>;
}
interface HandlerOptions { logger?: Pick<Console, "error"> }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function apiError(status: number, code: string, error: string): Response {
  const body: ApiError = { success: false, code, error };
  return Response.json(body, { status });
}

export async function handleGenerateWorkflow(
  request: Request,
  dependencies: GenerateWorkflowDependencies,
  options: HandlerOptions = {}
): Promise<Response> {
  const logger = options.logger ?? console;
  let body: unknown;
  try { body = await request.json(); }
  catch { return apiError(400, "INVALID_REQUEST", "Expected a JSON request body."); }
  const documentId = typeof body === "object" && body !== null && "documentId" in body
    ? (body as { documentId?: unknown }).documentId : undefined;
  if (typeof documentId !== "string" || !UUID_PATTERN.test(documentId)) {
    return apiError(400, "INVALID_REQUEST", "documentId must be a valid UUID.");
  }

  let document: DocumentRecord;
  try { document = await dependencies.getDocumentById(documentId); }
  catch (error) {
    if (error instanceof RepositoryNotFoundError) return apiError(404, "DOCUMENT_NOT_FOUND", "Document was not found.");
    logger.error("Document repository read failed.", error);
    return apiError(500, "PERSISTENCE_FAILED", "The workflow could not be generated.");
  }

  let rules: PolicyRule[];
  try { rules = await dependencies.getPolicyRulesByDocumentId(documentId); }
  catch (error) {
    logger.error("Policy rule repository read failed.", error);
    return apiError(500, "PERSISTENCE_FAILED", "The workflow could not be generated.");
  }
  if (rules.length === 0) return apiError(409, "RULES_NOT_READY", "Policy rules are not ready for this document.");

  try {
    const workflow = dependencies.generateWorkflowFromRules(rules);
    const saved = await dependencies.saveWorkflow({
      documentId,
      name: `${document.name} workflow`,
      workflow,
    });
    const response: GenerateWorkflowResponse = {
      success: true,
      documentId,
      workflowId: saved.id,
      workflow: saved.workflow,
    };
    return Response.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof WorkflowGenerationError) {
      return apiError(422, "WORKFLOW_GENERATION_FAILED", "The stored rules could not produce a valid workflow.");
    }
    logger.error("Workflow persistence failed.", error);
    return apiError(500, "PERSISTENCE_FAILED", "The workflow could not be saved.");
  }
}
