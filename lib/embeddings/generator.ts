/**
 * Embeddings Generator Starter
 * Owned by Member 2 (AI / RAG / Rule Engine).
 *
 * Generates 768-dimensional vector embeddings (Gemini text-embedding-004).
 * Never return silent zero-vectors that look like valid embeddings.
 */

export class EmbeddingNotConfiguredError extends Error {
  constructor(message = "GEMINI_API_KEY is not configured. Cannot generate embeddings.") {
    super(message);
    this.name = "EmbeddingNotConfiguredError";
  }
}

export class EmbeddingNotImplementedError extends Error {
  constructor(message = "Embedding generation is not implemented yet (Member 2).") {
    super(message);
    this.name = "EmbeddingNotImplementedError";
  }
}

/**
 * Generate a 768-dim embedding for the given text.
 * Throws when credentials are missing or the integration is not yet implemented.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  void text;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new EmbeddingNotConfiguredError();
  }

  throw new EmbeddingNotImplementedError(
    "Embedding generation not implemented. Member 2: connect Gemini text-embedding-004 and return number[768]."
  );
}
