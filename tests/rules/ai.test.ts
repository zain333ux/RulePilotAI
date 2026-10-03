import assert from "node:assert/strict";
import { validatePolicyRules, extractPolicyRulesFromText, GeminiNotConfiguredError } from "../../lib/ai/gemini";
import { generateEmbedding, EmbeddingNotConfiguredError } from "../../lib/embeddings/generator";
import { retrievePolicyEvidence, RagConfigurationError } from "../../lib/rag/retriever";
import mockRules from "../../mocks/policy-rules.json";

export async function runAiModuleVerification() {
  console.log("=== Testing AI / RAG Module Safeguards and Validators ===");

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
  ];
  const emptyResult = validatePolicyRules(malformed);
  assert.equal(emptyResult.length, 0, "Expected invalid rules to be dropped");
  console.log("Test 2 (Validator Filters Malformed Rules): Passed");

  // 3. Test Gemini client throws GeminiNotConfiguredError without API key
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
    console.log("Test 3 (Gemini Missing Key Safety): Passed");

    // 4. Test Embedding generator throws EmbeddingNotConfiguredError without API key
    await assert.rejects(
      async () => {
        await generateEmbedding("Some text to embed");
      },
      EmbeddingNotConfiguredError,
      "Expected EmbeddingNotConfiguredError when GEMINI_API_KEY is not set"
    );
    console.log("Test 4 (Embedding Missing Key Safety): Passed");

    // 5. Test RAG retriever throws RagConfigurationError when credentials missing
    await assert.rejects(
      async () => {
        await retrievePolicyEvidence("query");
      },
      RagConfigurationError,
      "Expected RagConfigurationError when Supabase/Gemini credentials missing"
    );
    console.log("Test 5 (RAG Configuration Safety): Passed");
  } finally {
    if (prevKey) {
      process.env.GEMINI_API_KEY = prevKey;
    }
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
