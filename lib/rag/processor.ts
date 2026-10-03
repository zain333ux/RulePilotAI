import "server-only";
import { extractPdfPages } from "./pdf-parser";
import { chunkPolicyPages } from "./chunker";
import { generateEmbedding, EmbeddingGenerationError } from "@/lib/embeddings/generator";

export interface EmbeddedPolicyChunk {
  pageNumber: number;
  section?: string;
  content: string;
  embedding: number[];
}

export interface ProcessPolicyPdfResult {
  pageCount: number;
  chunks: EmbeddedPolicyChunk[];
}

/**
 * Pure domain-level policy document processor.
 * Accepts raw PDF binary bytes and produces page-aware, embedded chunks.
 *
 * Pipeline:
 * 1. Extract digital text pages with exact 1-based page numbers (no OCR).
 * 2. Generate page-aware chunks that never cross page boundaries.
 * 3. Generate 768-dimensional vector embeddings for each chunk via text-embedding-004.
 * 4. Strictly validate embedding dimensions (must equal 768).
 *
 * Owned by Member 2. Does NOT persist to database or alter document status.
 * Ready for Member 1 to call from POST /api/documents/process.
 */
export async function processPolicyPdf(
  pdfBytes: Uint8Array
): Promise<ProcessPolicyPdfResult> {
  const pages = await extractPdfPages(pdfBytes);
  const textChunks = chunkPolicyPages(pages);

  const embeddedChunks: EmbeddedPolicyChunk[] = [];

  for (const chunk of textChunks) {
    const embedding = await generateEmbedding(chunk.content);

    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new EmbeddingGenerationError(
        `Embedding validation failed: expected 768 dimensions for chunk on page ${chunk.pageNumber}, got ${embedding?.length ?? 0}.`
      );
    }

    embeddedChunks.push({
      pageNumber: chunk.pageNumber,
      section: chunk.section,
      content: chunk.content,
      embedding,
    });
  }

  return {
    pageCount: pages.length,
    chunks: embeddedChunks,
  };
}
