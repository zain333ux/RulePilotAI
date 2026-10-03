import assert from "node:assert/strict";
import {
  validatePolicyRules,
  validatePolicyRulesAgainstSource,
  extractPolicyRulesFromText,
  GeminiNotConfiguredError,
  CitationGroundingError,
} from "../../lib/ai/gemini";
import { generateEmbedding, EmbeddingNotConfiguredError } from "../../lib/embeddings/generator";
import { retrievePolicyEvidence, RagConfigurationError } from "../../lib/rag/retriever";
import mockRules from "../../mocks/policy-rules.json";
import { PolicyRule } from "../../types/contracts";
import type { ExtractedPolicyPage } from "../../lib/rag/pdf-parser";

export async function runAiModuleVerification() {
  console.log("=== Testing AI / RAG Module Safeguards, Grounding & Validators ===");

  // 1. Test validatePolicyRules with valid fixture
  const validated = validatePolicyRules(mockRules);
  assert.equal(validated.length, 6, "Expected 6 validated rules from mock rules");
  assert.equal(validated[0].id, "EXP-001");
  assert.equal(validated[3].id, "EXP-004");
  assert.equal(validated[3].field, "hotelNightlyRate");
  assert.equal(validated[3].value, 25000);
  console.log("Test 1 (Policy Rule Validator with Mock Rules): Passed");

  // 2. Test validatePolicyRules filters out malformed items
  const malformed = [
    { id: "EXP-BAD-1" }, // missing fields
    { id: "EXP-BAD-2", name: "Bad Op", field: "x", operator: "INVALID_OP", value: 10, action: "a", citation: { page: 1, text: "t" } },
    { id: "EXP-BAD-3", name: "Bad Cit", field: "x", operator: ">", value: 10, action: "a", citation: { page: -1, text: "" } },
    { id: "EXP-BAD-4", name: "No Text", field: "x", operator: ">", value: 10, action: "a", citation: { page: 1, text: "   " } },
  ];
  const emptyResult = validatePolicyRules(malformed);
  assert.equal(emptyResult.length, 0, "Expected invalid rules to be dropped");
  console.log("Test 2 (Validator Filters Malformed & Invalid Rules): Passed");

  // 3. Strict Citation Grounding Tests
  const samplePages: ExtractedPolicyPage[] = [
    {
      pageNumber: 1,
      text: "Corporate Expense Policy\nSection 1.4 Claims must be submitted within 14 calendar days of expense date.",
    },
    {
      pageNumber: 2,
      text: "Section 2.1 Itemized merchant receipts are mandatory for all single expense claims exceeding PKR 5,000.",
    },
  ];

  // 3a: Valid exact citation passes
  const validRule: PolicyRule = {
    id: "EXP-001",
    name: "Receipt Requirement",
    field: "amount",
    operator: ">",
    value: 5000,
    action: "require_receipt",
    citation: {
      page: 2,
      section: "2.1",
      text: "Itemized merchant receipts are mandatory for all single expense claims exceeding PKR 5,000.",
    },
  };
  const grounded = validatePolicyRulesAgainstSource([validRule], samplePages);
  assert.equal(grounded.length, 1);
  console.log("Test 3a (Valid Exact Citation Accepted): Passed");

  // 3b: Citation with PDF line-breaks and normalized whitespace passes
  const whitespaceRule: PolicyRule = {
    ...validRule,
    citation: {
      page: 2,
      section: "2.1",
      text: "Itemized   merchant receipts\nare mandatory for all single expense claims exceeding PKR 5,000.",
    },
  };
  const groundedWs = validatePolicyRulesAgainstSource([whitespaceRule], samplePages);
  assert.equal(groundedWs.length, 1);
  console.log("Test 3b (Normalized Whitespace / Newline Citation Accepted): Passed");

  // 3c: Wrong page citation rejected
  const wrongPageRule: PolicyRule = {
    ...validRule,
    citation: {
      page: 1, // Text actually exists on page 2, not page 1
      text: "Itemized merchant receipts are mandatory for all single expense claims exceeding PKR 5,000.",
    },
  };
  assert.throws(
    () => {
      validatePolicyRulesAgainstSource([wrongPageRule], samplePages);
    },
    CitationGroundingError,
    "Expected CitationGroundingError when citation cites wrong page"
  );
  console.log("Test 3c (Wrong Page Citation Rejected): Passed");

  // 3d: Fabricated citation text rejected
  const fabricatedRule: PolicyRule = {
    ...validRule,
    citation: {
      page: 2,
      text: "Employees must always submit receipts for every cup of coffee.",
    },
  };
  assert.throws(
    () => {
      validatePolicyRulesAgainstSource([fabricatedRule], samplePages);
    },
    CitationGroundingError,
    "Expected CitationGroundingError for fabricated citation text"
  );
  console.log("Test 3d (Fabricated Citation Text Rejected): Passed");

  // 3e: Paraphrased citation rejected
  const paraphrasedRule: PolicyRule = {
    ...validRule,
    citation: {
      page: 2,
      text: "Receipts are required when expenses are greater than 5000 rupees.",
    },
  };
  assert.throws(
    () => {
      validatePolicyRulesAgainstSource([paraphrasedRule], samplePages);
    },
    CitationGroundingError,
    "Expected CitationGroundingError for paraphrased citation text"
  );
  console.log("Test 3e (Paraphrased Citation Rejected): Passed");

  // 3f: Non-existent page number rejected
  const nonExistentPageRule: PolicyRule = {
    ...validRule,
    citation: {
      page: 99,
      text: "Some text",
    },
  };
  assert.throws(
    () => {
      validatePolicyRulesAgainstSource([nonExistentPageRule], samplePages);
    },
    CitationGroundingError,
    "Expected CitationGroundingError for page > total pages"
  );
  console.log("Test 3f (Non-Existent Page Number Rejected): Passed");

  // 4. Test Gemini client throws GeminiNotConfiguredError without API key
  const prevKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    await assert.rejects(
      async () => {
        await extractPolicyRulesFromText("Some policy text");
      },
      GeminiNotConfiguredError,
      "Expected GeminiNotConfiguredError when GEMINI_API_KEY is not set"
    );
    console.log("Test 4 (Gemini Missing Key Safety): Passed");

    // 5. Test Embedding generator throws EmbeddingNotConfiguredError without API key
    await assert.rejects(
      async () => {
        await generateEmbedding("Some text to embed");
      },
      EmbeddingNotConfiguredError,
      "Expected EmbeddingNotConfiguredError when GEMINI_API_KEY is not set"
    );
    console.log("Test 5 (Embedding Missing Key Safety): Passed");

    // 6. Test RAG retriever throws RagConfigurationError when credentials missing
    await assert.rejects(
      async () => {
        await retrievePolicyEvidence("query");
      },
      RagConfigurationError,
      "Expected RagConfigurationError when Supabase/Gemini credentials missing"
    );
    console.log("Test 6 (RAG Configuration Safety): Passed");
  } finally {
    if (prevKey) {
      process.env.GEMINI_API_KEY = prevKey;
    }
  }

  // 7. The supported default embedding model must retain the 768-dimension DB contract.
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_EMBEDDING_MODEL;
  const previousGenerationModel = process.env.GEMINI_MODEL;
  const previousFetch = globalThis.fetch;
  try {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_EMBEDDING_MODEL;
    globalThis.fetch = async (input) => {
      assert.match(String(input), /models\/gemini-embedding-001:embedContent/);
      return Response.json({ embedding: { values: Array(768).fill(0.25) } });
    };
    const embedding = await generateEmbedding("Supported model check");
    assert.equal(embedding.length, 768);
    console.log("Test 7 (Supported Default Embedding Model): Passed");

    delete process.env.GEMINI_MODEL;
    globalThis.fetch = async (input) => {
      assert.match(String(input), /models\/gemini-3\.6-flash:generateContent/);
      return Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify([validRule]) }] } }],
      });
    };
    const generatedRules = await extractPolicyRulesFromText("Supported generation model check");
    assert.equal(generatedRules.length, 1);
    console.log("Test 8 (Supported Default Generation Model): Passed");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_EMBEDDING_MODEL;
    else process.env.GEMINI_EMBEDDING_MODEL = previousModel;
    if (previousGenerationModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previousGenerationModel;
  }

  console.log("✅ All AI / RAG module tests passed successfully!");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runAiModuleVerification().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
