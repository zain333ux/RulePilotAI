/**
 * Gemini AI Extraction Client Starter
 * Owned by Member 2 (AI / RAG / Rule Engine).
 *
 * Extracts structured PolicyRule[] from parsed policy text.
 * Never fabricate rules or citations when Gemini is unavailable.
 */
import { PolicyRule } from "@/types/contracts";

export class GeminiNotConfiguredError extends Error {
  constructor(message = "GEMINI_API_KEY is not configured. Cannot extract policy rules.") {
    super(message);
    this.name = "GeminiNotConfiguredError";
  }
}

export class GeminiNotImplementedError extends Error {
  constructor(message = "Gemini structured extraction is not implemented yet (Member 2).") {
    super(message);
    this.name = "GeminiNotImplementedError";
  }
}

/**
 * Extract PolicyRule[] from policy text via Google Gemini structured output.
 * Throws when credentials are missing or the integration is not yet implemented.
 * Callers that need offline data must load mocks/policy-rules.json explicitly.
 */
export async function extractPolicyRulesFromText(
  policyText: string
): Promise<PolicyRule[]> {
  void policyText;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiNotConfiguredError();
  }

  throw new GeminiNotImplementedError(
    "Gemini structured extraction not implemented. Member 2: wire @google/genai (or REST) with responseSchema matching PolicyRule[]."
  );
}
