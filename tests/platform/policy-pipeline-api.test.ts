import assert from "node:assert/strict";
import { test } from "node:test";
import rulesJson from "../../mocks/policy-rules.json";
import { CitationGroundingError, GeminiExtractionError, GeminiNotConfiguredError } from "../../lib/ai/gemini";
import { handleProcessDocument } from "../../lib/documents/process";
import { EmbeddingGenerationError } from "../../lib/embeddings/generator";
import { UnreadablePdfError, type ExtractedPolicyPage } from "../../lib/rag/pdf-parser";
import { RepositoryError, RepositoryNotFoundError, type DocumentRecord, type WorkflowRecord } from "../../lib/repositories/repositories";
import { handleExtractRules } from "../../lib/rules/extract-document";
import { generateWorkflowFromRules, WorkflowGenerationError } from "../../lib/rules/workflow";
import { handleGenerateWorkflow } from "../../lib/workflows/generate";
import type { PolicyRule, WorkflowDefinition } from "../../types/contracts";

const DOCUMENT_ID = "22222222-2222-4222-8222-222222222222";
const WORKFLOW_ID = "11111111-1111-4111-8111-111111111111";
const rules = rulesJson as PolicyRule[];
const pages: ExtractedPolicyPage[] = [{ pageNumber: 1, text: rules[0].citation.text }];
const processedDocument: DocumentRecord = {
  id: DOCUMENT_ID,
  name: "Corporate expense policy.pdf",
  storagePath: `${DOCUMENT_ID}/corporate-expense-policy.pdf`,
  status: "processed",
  pageCount: 1,
  createdAt: "2026-10-03T08:00:00.000Z",
  updatedAt: "2026-10-03T08:00:00.000Z",
};

function request(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function processDeps(overrides: Partial<Parameters<typeof handleProcessDocument>[1]> = {}) {
  const statuses: string[] = [];
  const dependencies: Parameters<typeof handleProcessDocument>[1] = {
    async getDocumentById() { return { ...processedDocument, status: "uploaded" }; },
    async updateDocumentProcessingStatus(_id, status, pageCount) {
      statuses.push(`${status}:${pageCount ?? ""}`);
      return { ...processedDocument, status, ...(pageCount === undefined ? {} : { pageCount }) };
    },
    async downloadPolicyPdf() { return new Uint8Array([37, 80, 68, 70]); },
    async processPolicyPdf() {
      return { pageCount: 2, chunks: [
        { pageNumber: 1, content: "one", embedding: Array(768).fill(0.1) },
        { pageNumber: 2, content: "two", embedding: Array(768).fill(0.2) },
      ] };
    },
    async replaceDocumentChunks(_id, chunks) { return chunks.map((chunk, index) => ({ id: String(index), ...chunk })); },
    ...overrides,
  };
  return { dependencies, statuses };
}

async function process(overrides: Partial<Parameters<typeof handleProcessDocument>[1]> = {}, documentId = DOCUMENT_ID) {
  const { dependencies, statuses } = processDeps(overrides);
  const response = await handleProcessDocument(
    request("/api/documents/process", { documentId }), dependencies, { logger: { error() {} } }
  );
  return { response, body: await response.json(), statuses };
}

test("processes a stored PDF and reports accurate page and persisted chunk counts", async () => {
  const { response, body, statuses } = await process({
    async replaceDocumentChunks(_id, chunks) { return chunks.slice(0, 1); },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, documentId: DOCUMENT_ID, status: "processed", pageCount: 2, chunkCount: 1 });
  assert.deepEqual(statuses, ["processing:", "processed:2"]);
});

test("rejects an invalid document ID before processing", async () => {
  const { response } = await process({}, "bad-id");
  assert.equal(response.status, 400);
});

test("returns 404 when the processing document is missing", async () => {
  const { response } = await process({ async getDocumentById() { throw new RepositoryNotFoundError("Document", DOCUMENT_ID); } });
  assert.equal(response.status, 404);
});

test("rejects a document already being processed", async () => {
  const { response, statuses } = await process({ async getDocumentById() { return { ...processedDocument, status: "processing" }; } });
  assert.equal(response.status, 409);
  assert.deepEqual(statuses, []);
});

for (const [name, error, status] of [
  ["storage download failure", new Error("storage"), 500],
  ["unreadable PDF", new UnreadablePdfError(), 422],
  ["embedding provider failure", new EmbeddingGenerationError("status 502"), 502],
] as const) {
  test(`maps ${name} and marks processing failed`, async () => {
    const override = name === "storage download failure"
      ? { async downloadPolicyPdf(): Promise<Uint8Array> { throw error; } }
      : { async processPolicyPdf(): Promise<never> { throw error; } };
    const { response, statuses } = await process(override);
    assert.equal(response.status, status);
    assert.deepEqual(statuses, ["processing:", "failed:"]);
  });
}

test("marks the document failed when atomic chunk persistence fails", async () => {
  const { response, statuses } = await process({ async replaceDocumentChunks() { throw new RepositoryError("chunks"); } });
  assert.equal(response.status, 500);
  assert.deepEqual(statuses, ["processing:", "failed:"]);
});

test("does not report success when the final status update fails", async () => {
  let calls = 0;
  const seen: string[] = [];
  const { response } = await process({
    async updateDocumentProcessingStatus(_id, status) {
      calls++;
      seen.push(status);
      if (calls === 2) throw new RepositoryError("status");
      return { ...processedDocument, status };
    },
  });
  assert.equal(response.status, 500);
  assert.deepEqual(seen, ["processing", "processed", "failed"]);
});

function extractDeps(overrides: Partial<Parameters<typeof handleExtractRules>[1]> = {}) {
  let replacements = 0;
  const dependencies: Parameters<typeof handleExtractRules>[1] = {
    async getDocumentById() { return processedDocument; },
    async downloadPolicyPdf() { return new Uint8Array([37, 80, 68, 70]); },
    async extractPdfPages() { return pages; },
    async extractPolicyRulesFromPages() { return rules; },
    async replacePolicyRules(_id, nextRules) { replacements++; return nextRules; },
    ...overrides,
  };
  return { dependencies, replacementCount: () => replacements };
}

async function extract(overrides: Partial<Parameters<typeof handleExtractRules>[1]> = {}, documentId = DOCUMENT_ID) {
  const state = extractDeps(overrides);
  const response = await handleExtractRules(
    request("/api/rules/extract", { documentId }), state.dependencies, { logger: { error() {} } }
  );
  return { response, body: await response.json(), replacementCount: state.replacementCount };
}

test("extracts grounded rules from source pages and persists them atomically", async () => {
  const { response, body, replacementCount } = await extract();
  assert.equal(response.status, 200);
  assert.equal(body.rules.length, 6);
  assert.equal(replacementCount(), 1);
});

test("rejects an invalid rule-extraction document ID", async () => {
  assert.equal((await extract({}, "bad-id")).response.status, 400);
});

test("returns 404 when the extraction document is missing", async () => {
  const result = await extract({ async getDocumentById() { throw new RepositoryNotFoundError("Document", DOCUMENT_ID); } });
  assert.equal(result.response.status, 404);
});

test("requires a processed document before extraction", async () => {
  const result = await extract({ async getDocumentById() { return { ...processedDocument, status: "uploaded" }; } });
  assert.equal(result.response.status, 409);
});

for (const [name, override, status] of [
  ["storage read failure", { async downloadPolicyPdf(): Promise<Uint8Array> { throw new Error("storage"); } }, 500],
  ["PDF extraction failure", { async extractPdfPages(): Promise<never> { throw new UnreadablePdfError(); } }, 422],
  ["Gemini configuration failure", { async extractPolicyRulesFromPages(): Promise<never> { throw new GeminiNotConfiguredError(); } }, 503],
  ["citation grounding failure", { async extractPolicyRulesFromPages(): Promise<never> { throw new CitationGroundingError("citation"); } }, 422],
] as const) {
  test(`maps ${name} without replacing stored rules`, async () => {
    const result = await extract(override);
    assert.equal(result.response.status, status);
    assert.equal(result.replacementCount(), 0);
  });
}

test("rejects an empty extraction without replacing stored rules", async () => {
  const result = await extract({ async extractPolicyRulesFromPages() { return []; } });
  assert.equal(result.response.status, 422);
  assert.equal(result.replacementCount(), 0);
});

test("maps Gemini quota failures to 429", async () => {
  const result = await extract({ async extractPolicyRulesFromPages(): Promise<never> { throw new GeminiExtractionError("status 429 quota"); } });
  assert.equal(result.response.status, 429);
});

test("returns 500 when atomic policy-rule persistence fails", async () => {
  const result = await extract({ async replacePolicyRules() { throw new RepositoryError("rules"); } });
  assert.equal(result.response.status, 500);
  assert.equal(result.replacementCount(), 0);
});

function workflowDeps(overrides: Partial<Parameters<typeof handleGenerateWorkflow>[1]> = {}) {
  const graph = generateWorkflowFromRules(rules);
  const dependencies: Parameters<typeof handleGenerateWorkflow>[1] = {
    async getDocumentById() { return processedDocument; },
    async getPolicyRulesByDocumentId() { return rules; },
    generateWorkflowFromRules() { return graph; },
    async saveWorkflow(input): Promise<WorkflowRecord> {
      return { id: WORKFLOW_ID, documentId: input.documentId, name: input.name, workflow: input.workflow, createdAt: "2026-10-03T09:00:00.000Z" };
    },
    ...overrides,
  };
  return { dependencies, graph };
}

async function workflow(overrides: Partial<Parameters<typeof handleGenerateWorkflow>[1]> = {}, documentId = DOCUMENT_ID) {
  const state = workflowDeps(overrides);
  const response = await handleGenerateWorkflow(
    request("/api/workflows/generate", { documentId }), state.dependencies, { logger: { error() {} } }
  );
  return { response, body: await response.json(), graph: state.graph };
}

test("generates, persists, and returns the exact workflow graph and ID", async () => {
  const result = await workflow();
  assert.equal(result.response.status, 200);
  assert.equal(result.body.workflowId, WORKFLOW_ID);
  assert.deepEqual(result.body.workflow, result.graph);
});

test("rejects an invalid workflow document ID", async () => {
  assert.equal((await workflow({}, "bad-id")).response.status, 400);
});

test("returns 404 when the workflow document is missing", async () => {
  const result = await workflow({ async getDocumentById() { throw new RepositoryNotFoundError("Document", DOCUMENT_ID); } });
  assert.equal(result.response.status, 404);
});

test("returns 409 when workflow rules are missing", async () => {
  const result = await workflow({ async getPolicyRulesByDocumentId() { return []; } });
  assert.equal(result.response.status, 409);
});

test("returns 422 for a workflow domain generation error", async () => {
  const result = await workflow({ generateWorkflowFromRules(): WorkflowDefinition { throw new WorkflowGenerationError("duplicate"); } });
  assert.equal(result.response.status, 422);
});

test("returns 500 when workflow persistence fails", async () => {
  const result = await workflow({ async saveWorkflow() { throw new RepositoryError("workflow"); } });
  assert.equal(result.response.status, 500);
});
