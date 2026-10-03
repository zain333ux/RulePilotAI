import "server-only";
import { PolicyRule, RuleOperator } from "@/types/contracts";
import type { ExtractedPolicyPage } from "@/lib/rag/pdf-parser";

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

export class CitationGroundingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CitationGroundingError";
  }
}

const VALID_OPERATORS = new Set<RuleOperator>([">", "<", ">=", "<=", "==", "!="]);

/**
 * Normalizes text for verbatim citation verification:
 * - strips surrounding quotes and whitespace
 * - collapses multiple whitespaces, tabs, and newlines to a single space
 * - converts to lowercase for case-insensitive matching
 */
export function normalizeCitationText(str: string): string {
  if (!str) return "";
  return str
    .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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
 * Strictly validates that every PolicyRule's citation is grounded in the actual source pages:
 * 1. Citation page must actually exist in the document.
 * 2. Citation text must occur in the cited page (normalizing whitespace/newlines from PDF extraction).
 * 3. Citation text must not be from a different page.
 * 4. Citation text must not be fabricated or loosely paraphrased.
 * 5. Section, when provided, is checked for consistency.
 */
export function validatePolicyRulesAgainstSource(
  rules: PolicyRule[],
  pages: ExtractedPolicyPage[]
): PolicyRule[] {
  if (!Array.isArray(rules) || rules.length === 0) {
    return [];
  }

  const pageMap = new Map<number, ExtractedPolicyPage>();
  for (const page of pages) {
    pageMap.set(page.pageNumber, page);
  }

  const groundedRules: PolicyRule[] = [];

  for (const rule of rules) {
    // 1. Citation page must actually exist
    const targetPage = pageMap.get(rule.citation.page);
    if (!targetPage) {
      throw new CitationGroundingError(
        `Rule ${rule.id} cites non-existent page ${rule.citation.page}. Source document only contains ${pages.length} page(s).`
      );
    }

    const normalizedCitation = normalizeCitationText(rule.citation.text);
    if (!normalizedCitation || normalizedCitation.length === 0) {
      throw new CitationGroundingError(
        `Rule ${rule.id} has an empty or invalid citation text.`
      );
    }

    const normalizedPageText = normalizeCitationText(targetPage.text);

    // 2. Citation text must occur in the cited page
    if (!normalizedPageText.includes(normalizedCitation)) {
      // 3. Check if citation text accidentally occurs on another page
      let otherFoundPage: number | undefined;
      for (const otherPage of pages) {
        if (otherPage.pageNumber !== rule.citation.page) {
          const normalizedOther = normalizeCitationText(otherPage.text);
          if (normalizedOther.includes(normalizedCitation)) {
            otherFoundPage = otherPage.pageNumber;
            break;
          }
        }
      }

      if (otherFoundPage !== undefined) {
        throw new CitationGroundingError(
          `Rule ${rule.id} citation mismatch: cited text exists on page ${otherFoundPage}, but rule cites page ${rule.citation.page}. Citation text: "${rule.citation.text}".`
        );
      }

      // 4 & 5. If not found anywhere, it is fabricated or paraphrased
      throw new CitationGroundingError(
        `Rule ${rule.id} citation text is not grounded in source policy (fabricated or paraphrased): "${rule.citation.text}".`
      );
    }

    // 6. Section consistency check
    if (rule.citation.section && rule.citation.section.trim().length > 0) {
      const sectionNormalized = rule.citation.section.trim().toLowerCase();
      const pageSectionsDetected = Array.from(
        targetPage.text.matchAll(/(?:Section\s+)?(\d+(?:\.\d+)+|\bSection\s+\d+\b)/gi)
      ).map(m => m[1]?.toLowerCase());

      if (
        pageSectionsDetected.length > 0 &&
        !pageSectionsDetected.includes(sectionNormalized) &&
        !normalizedPageText.includes(`section ${sectionNormalized}`) &&
        !normalizedPageText.includes(sectionNormalized)
      ) {
        throw new CitationGroundingError(
          `Rule ${rule.id} cites Section ${rule.citation.section} on page ${rule.citation.page}, but detected sections on that page are: [${pageSectionsDetected.join(", ")}].`
        );
      }
    }

    groundedRules.push(rule);
  }

  return groundedRules;
}

/**
 * System instruction provided to Google Gemini REST API.
 */
function buildGeminiSystemInstruction(): string {
  return `You are an expert enterprise policy extraction engine for RulePilot AI.
Extract all actionable, deterministic business policy rules from the provided text into a JSON array of PolicyRule objects.

Each rule object MUST have this exact structure:
{
  "id": "EXP-001", // unique rule code (e.g. EXP-001 through EXP-006)
  "name": "Receipt Requirement Threshold", // descriptive name
  "field": "amount", // business field evaluated (e.g. amount, hotelNightlyRate, expenseDate, submissionDate, internationalTravel)
  "operator": ">", // one of: ">", "<", ">=", "<=", "==", "!="
  "value": 5000, // numeric, string, or boolean threshold
  "action": "require_receipt", // action to take upon violation
  "citation": {
    "page": 3, // 1-indexed page number matching === Page X === markers
    "section": "2.1", // section number if detectable, or omit
    "text": "Exact verbatim excerpt from the document"
  }
}

GROUNDING RULES:
1. Citations MUST contain exact verbatim excerpts from the document. Never fabricate or paraphrase citations.
2. Page numbers MUST match the page markers in the text (e.g. "=== Page X ===").
3. Output strictly a JSON array without markdown formatting.`;
}

/**
 * Sends prompt payload to Gemini REST API and extracts parsed JSON.
 */
async function callGeminiExtractRules(promptContent: string): Promise<PolicyRule[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiNotConfiguredError();
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: `Extract policy rules from the following text:\n\n${promptContent}` }],
      },
    ],
    systemInstruction: {
      parts: [{ text: buildGeminiSystemInstruction() }],
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

/**
 * Production extraction path using real extracted PDF pages.
 *
 * Pipeline:
 * 1. Formats pages into page-aware text stream with explicit page markers
 * 2. Invokes Google Gemini API with structured JSON output schema
 * 3. Validates PolicyRule schema strictly
 * 4. Validates citation grounding against exact source pages (fails closed on hallucinations)
 * 5. Returns grounded PolicyRule[]
 */
export async function extractPolicyRulesFromPages(
  pages: ExtractedPolicyPage[]
): Promise<PolicyRule[]> {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  const textWithPageMarkers = pages
    .map(p => `=== Page ${p.pageNumber} ===\n${p.text}`)
    .join("\n\n");

  const rules = await callGeminiExtractRules(textWithPageMarkers);

  // Strict citation grounding against exact source pages
  const groundedRules = validatePolicyRulesAgainstSource(rules, pages);

  return groundedRules;
}

/**
 * Extracts structured PolicyRule[] from raw policy text.
 * Preserved for backward compatibility and raw text tests.
 */
export async function extractPolicyRulesFromText(
  policyText: string
): Promise<PolicyRule[]> {
  if (!policyText || policyText.trim().length === 0) {
    return [];
  }

  return await callGeminiExtractRules(policyText);
}
