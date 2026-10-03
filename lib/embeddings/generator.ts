import "server-only";

export class EmbeddingNotConfiguredError extends Error {
  constructor(message = "GEMINI_API_KEY is not configured. Cannot generate embeddings.") {
    super(message);
    this.name = "EmbeddingNotConfiguredError";
  }
}

export class EmbeddingGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingGenerationError";
  }
}

/**
 * Generate a verified 768-dimensional embedding vector for input text
 * using Google's text-embedding-004 model.
 *
 * Explicitly requests and validates 768 dimensions matching Supabase vector(768).
 * Never returns silent zero-vectors.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new EmbeddingGenerationError("Cannot generate embedding for empty text.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new EmbeddingNotConfiguredError();
  }

  const model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  const payload = {
    model: `models/${model}`,
    content: {
      parts: [{ text: text.trim() }],
    },
    outputDimensionality: 768,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new EmbeddingGenerationError(
      `Embedding API returned status ${response.status}: ${errorBody.slice(0, 300)}`
    );
  }

  const data = await response.json();
  const values: number[] | undefined = data?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new EmbeddingGenerationError("Embedding response did not contain numerical vector values.");
  }

  if (values.length !== 768) {
    throw new EmbeddingGenerationError(
      `Embedding dimension mismatch: expected 768 dimensions, received ${values.length}.`
    );
  }

  return values;
}

