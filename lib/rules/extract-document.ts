import type { ApiError, ExtractRulesResponse } from "@/types/api";
import type { PolicyRule } from "@/types/contracts";
import { CitationGroundingError, GeminiExtractionError, GeminiNotConfiguredError } from "@/lib/ai/gemini";
import { PdfExtractionError, UnreadablePdfError, type ExtractedPolicyPage } from "@/lib/rag/pdf-parser";
import { RepositoryNotFoundError, type DocumentRecord } from "@/lib/repositories/repositories";

export interface ExtractRulesDependencies {
  getDocumentById(id: string): Promise<DocumentRecord>;
  downloadPolicyPdf(storagePath: string): Promise<Uint8Array>;
  extractPdfPages(pdfBytes: Uint8Array): Promise<ExtractedPolicyPage[]>;
  extractPolicyRulesFromPages(pages: ExtractedPolicyPage[]): Promise<PolicyRule[]>;
  replacePolicyRules(documentId: string, rules: PolicyRule[]): Promise<PolicyRule[]>;
}
interface HandlerOptions { logger?: Pick<Console, "error"> }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function apiError(status: number, code: string, error: string): Response {
  const body: ApiError = { success: false, code, error };
  return Response.json(body, { status });
}

export async function handleExtractRules(
  request: Request,
  dependencies: ExtractRulesDependencies,
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
    return apiError(500, "PERSISTENCE_FAILED", "Policy rules could not be extracted.");
  }
  if (document.status !== "processed" || !document.storagePath) {
    return apiError(409, "DOCUMENT_NOT_PROCESSED", "Document processing must complete before rule extraction.");
  }

  try {
    const pdfBytes = await dependencies.downloadPolicyPdf(document.storagePath);
    const pages = await dependencies.extractPdfPages(pdfBytes);
    const rules = await dependencies.extractPolicyRulesFromPages(pages);
    if (rules.length === 0) {
      return apiError(422, "RULE_EXTRACTION_FAILED", "No grounded policy rules were extracted.");
    }
    const persistedRules = await dependencies.replacePolicyRules(documentId, rules);
    const response: ExtractRulesResponse = { success: true, documentId, rules: persistedRules };
    return Response.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof GeminiNotConfiguredError) {
      return apiError(503, "PROVIDER_NOT_CONFIGURED", "The policy extraction provider is not configured.");
    }
    if (error instanceof GeminiExtractionError) {
      if (/status\s+429|quota|rate.?limit/i.test(error.message)) {
        return apiError(429, "PROVIDER_RATE_LIMITED", "The policy extraction provider rate limit was reached.");
      }
      return apiError(502, "PROVIDER_FAILED", "The policy extraction provider request failed.");
    }
    if (error instanceof CitationGroundingError || error instanceof UnreadablePdfError || error instanceof PdfExtractionError) {
      return apiError(422, "UNVERIFIABLE_POLICY", "Policy rules could not be verified against the source PDF.");
    }
    logger.error("Policy rule extraction failed.", error);
    return apiError(500, "PERSISTENCE_FAILED", "Policy rules could not be saved.");
  }
}
