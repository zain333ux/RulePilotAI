import type { ApiError, ProcessResponse } from "@/types/api";
import type { PolicyDocument } from "@/types/contracts";
import { EmbeddingGenerationError, EmbeddingNotConfiguredError } from "@/lib/embeddings/generator";
import { PdfExtractionError, UnreadablePdfError } from "@/lib/rag/pdf-parser";
import type { ProcessPolicyPdfResult } from "@/lib/rag/processor";
import { RepositoryNotFoundError, type DocumentChunkInput, type DocumentRecord } from "@/lib/repositories/repositories";

export interface ProcessDocumentDependencies {
  getDocumentById(id: string): Promise<DocumentRecord>;
  updateDocumentProcessingStatus(id: string, status: PolicyDocument["status"], pageCount?: number): Promise<DocumentRecord>;
  downloadPolicyPdf(storagePath: string): Promise<Uint8Array>;
  processPolicyPdf(pdfBytes: Uint8Array): Promise<ProcessPolicyPdfResult>;
  replaceDocumentChunks(documentId: string, chunks: DocumentChunkInput[]): Promise<unknown[]>;
}

interface HandlerOptions { logger?: Pick<Console, "error"> }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function apiError(status: number, code: string, error: string): Response {
  const body: ApiError = { success: false, code, error };
  return Response.json(body, { status });
}

function providerStatus(error: unknown): number | undefined {
  if (error instanceof EmbeddingNotConfiguredError) return 503;
  if (error instanceof EmbeddingGenerationError) {
    return /status\s+429|quota|rate.?limit/i.test(error.message) ? 429 : 502;
  }
  return undefined;
}

export async function handleProcessDocument(
  request: Request,
  dependencies: ProcessDocumentDependencies,
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
    return apiError(500, "PERSISTENCE_FAILED", "The document could not be processed.");
  }
  if (document.status === "processing") {
    return apiError(409, "PROCESSING_IN_PROGRESS", "Document processing is already in progress.");
  }
  if (!document.storagePath) {
    return apiError(409, "DOCUMENT_NOT_READY", "Document storage is not ready for processing.");
  }

  let processingStarted = false;
  try {
    await dependencies.updateDocumentProcessingStatus(documentId, "processing");
    processingStarted = true;
    const pdfBytes = await dependencies.downloadPolicyPdf(document.storagePath);
    const result = await dependencies.processPolicyPdf(pdfBytes);
    const storedChunks = await dependencies.replaceDocumentChunks(documentId, result.chunks);
    await dependencies.updateDocumentProcessingStatus(documentId, "processed", result.pageCount);
    const response: ProcessResponse = {
      success: true,
      documentId,
      status: "processed",
      pageCount: result.pageCount,
      chunkCount: storedChunks.length,
    };
    return Response.json(response, { status: 200 });
  } catch (error) {
    if (processingStarted) {
      try { await dependencies.updateDocumentProcessingStatus(documentId, "failed"); }
      catch (statusError) { logger.error("Document failure status update failed.", statusError); }
    }
    if (error instanceof UnreadablePdfError || error instanceof PdfExtractionError) {
      return apiError(422, "UNREADABLE_PDF", "The PDF does not contain readable digital text.");
    }
    const upstreamStatus = providerStatus(error);
    if (upstreamStatus === 503) return apiError(503, "PROVIDER_NOT_CONFIGURED", "The embedding provider is not configured.");
    if (upstreamStatus === 429) return apiError(429, "PROVIDER_RATE_LIMITED", "The embedding provider rate limit was reached.");
    if (upstreamStatus === 502) return apiError(502, "PROVIDER_FAILED", "The embedding provider request failed.");
    logger.error("Document processing failed.", error);
    return apiError(500, "PROCESSING_FAILED", "The document could not be processed.");
  }
}
