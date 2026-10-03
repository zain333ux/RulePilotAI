import "server-only";
import { Citation } from "@/types/contracts";
import { generateEmbedding } from "@/lib/embeddings/generator";
import { getAdminSupabase, isServerSupabaseConfigured } from "@/lib/supabase/server";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  section?: string;
  content: string;
  similarity: number;
}

export class RagConfigurationError extends Error {
  constructor(message = "Supabase or Gemini is not configured for RAG retrieval.") {
    super(message);
    this.name = "RagConfigurationError";
  }
}

export class RagRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RagRetrievalError";
  }
}

/**
 * Retrieve grounded policy citations for a search query using pgvector semantic search.
 *
 * Rules:
 * - Generates 768-dim query embedding via generateEmbedding()
 * - Calls Supabase RPC match_document_chunks
 * - Maps only real retrieved records to Citation[]
 * - NEVER invents citations, page numbers, or sections
 */
export async function retrievePolicyEvidence(
  query: string,
  documentId?: string
): Promise<Citation[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  if (!isServerSupabaseConfigured()) {
    throw new RagConfigurationError(
      "Supabase credentials are not configured. Cannot perform pgvector similarity search."
    );
  }

  const queryEmbedding = await generateEmbedding(query);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 5,
    filter_document_id: documentId || null,
  });

  if (error) {
    throw new RagRetrievalError(`Vector similarity search failed: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((chunk: {
    page_number: number;
    section: string | null;
    content: string;
  }) => ({
    page: chunk.page_number,
    section: chunk.section || undefined,
    text: chunk.content,
  }));
}

