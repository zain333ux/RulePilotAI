/**
 * Policy Evidence Retriever (RAG) Starter
 * Owned by Member 2 (AI / RAG / Rule Engine).
 *
 * Performs semantic similarity search against document_chunks via Supabase pgvector RPC.
 * Never fabricate citations or page numbers.
 */
import { Citation } from "@/types/contracts";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  section?: string;
  content: string;
  similarity: number;
}

export class RagNotImplementedError extends Error {
  constructor(message = "RAG retrieval is not implemented yet (Member 2).") {
    super(message);
    this.name = "RagNotImplementedError";
  }
}

/**
 * Retrieve grounded policy citations for a query.
 * Throws until Member 2 wires match_document_chunks + embeddings.
 * Do not invent Citation objects for missing evidence.
 */
export async function retrievePolicyEvidence(
  query: string,
  documentId?: string
): Promise<Citation[]> {
  void query;
  void documentId;
  throw new RagNotImplementedError(
    "RAG retrieval not implemented. Member 2: call generateEmbedding + Supabase RPC match_document_chunks. Return only real retrieved chunks as Citation[]."
  );
}
