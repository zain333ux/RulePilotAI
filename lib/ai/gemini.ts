import "server-only";
import { PolicyRule, RuleOperator } from "@/types/contracts";

export class GeminiNotConfiguredError extends Error {
  constructor(message = "GEMINI_API_KEY is not configured. Cannot extract policy rules.") {
    super(message);
    this.name = "GeminiNotConfiguredError";
  }
}

export class GeminiExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiExtractionError";
  }
}

const VALID_OPERATORS = new Set<RuleOperator>([">", "<", ">=", "<=", "==", "!="]);

/**
 * Validates and sanitizes a raw array of parsed JSON objects into strictly typed PolicyRule[].
 */
export function validatePolicyRules(data: unknown): PolicyRule[] {
  if (!Array.isArray(data)) {
    throw new GeminiExtractionError("Extraction output was not a JSON array.");
  }

  const validRules: PolicyRule[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const { id, name, field, operator, value, action, citation } = item as Record<string, unknown>;

    if (
      typeof id !== "string" || !id.trim() ||
      typeof name !== "string" || !name.trim() ||
      typeof field !== "string" || !field.trim() ||
      typeof operator !== "string" || !VALID_OPERATORS.has(operator as RuleOperator) ||
      (typeof value !== "number" && typeof value !== "string" && typeof value !== "boolean") ||
      typeof action !== "string" || !action.trim() ||
      typeof citation !== "object" || citation === null
    ) {
      continue;
    }

    const cit = citation as Record<string, unknown>;
    const pageNum = Number(cit.page);
    if (!Number.isInteger(pageNum) || pageNum <= 0 || typeof cit.text !== "string" || !cit.text.trim()) {
      continue;
    }

    validRules.push({
      id: id.trim(),
      name: name.trim(),
      field: field.trim(),
      operator: operator as RuleOperator,
      value: value,
      action: action.trim(),
      citation: {
        page: pageNum,
        section: typeof cit.section === "string" && cit.section.trim().length > 0 ? cit.section.trim() : undefined,
        text: cit.text.trim(),
      },
    });
  }

  return validRules;
}

/**
 * Extract structured PolicyRule[] from policy text via Google Gemini REST API.
 * Uses system instructions and structured JSON response mode.
 *
 * Rules:
 * - Requires GEMINI_API_KEY in server environment
 * - Validates output schema strictly against PolicyRule[]
 * - Ensures citation grounding: citations must cite real pages from input text
 */
export async function extractPolicyRulesFromText(
  policyText: string
): Promise<PolicyRule[]> {
  if (!policyText || policyText.trim().length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiNotConfiguredError();
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = `You are an expert enterprise policy extraction engine for RulePilot AI.
Extract all actionable, deterministic business policy rules from the provided text into a JSON array of PolicyRule objects.

Each rule object MUST have this exact structure:
{
  "id": "EXP-001", // unique rule code
  "name": "Receipt Requirement Threshold", // descriptive name
  "field": "amount", // business field evaluated (e.g. amount, hotelNightlyRate, submissionWindowDays, internationalTravel)
  "operator": ">", // one of: ">", "<", ">=", "<=", "==", "!="
  "value": 5000, // numeric, string, or boolean threshold
  "action": "require_receipt", // action to take upon violation
  "citation": {
    "page": 3, // 1-indexed page number from the document markers
    "section": "2.1", // section number if detectable, or omit
    "text": "Exact verbatim sentence from the policy text"
  }
}

GROUNDING RULES:
1. Citations MUST contain exact verbatim excerpts from the document. Never fabricate or paraphrase citations.
2. Page numbers MUST match the page markers in the text (e.g. "=== Demo Page X ===" or "Page X").
3. Output strictly a JSON array without markdown formatting.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Extract policy rules from the following text:\n\n${policyText}`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
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
    throw new GeminiExtractionError(
      `Gemini extraction API failed with status ${response.status}: ${errorBody.slice(0, 300)}`
    );
  }

  const responseData = await response.json();
  const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new GeminiExtractionError("Gemini response contained no content candidates.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new GeminiExtractionError(`Failed to parse Gemini output as JSON: ${(err as Error).message}`);
  }

  const rules = validatePolicyRules(parsed);

  if (rules.length === 0) {
    throw new GeminiExtractionError("No valid PolicyRule objects could be extracted from Gemini response.");
  }

  return rules;
}

