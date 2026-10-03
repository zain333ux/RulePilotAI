import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaseResult, ExpenseCase, PolicyRule, WorkflowDefinition } from "../../types/contracts";
import { createRepositoryStore, RepositoryNotFoundError } from "../../lib/repositories/repositories";

type DatabaseResponse = { data: unknown; error: unknown; count?: number | null };

function mockSupabase(responses: DatabaseResponse[]) {
  const calls: Array<{ table: string; method: string; value?: unknown }> = [];
  let responseIndex = 0;

  const client = {
    rpc(name: string, value?: unknown) {
      calls.push({ table: name, method: "rpc", value });
      return Promise.resolve(responses[responseIndex++]);
    },
    from(table: string) {
      const builder = {
        select(value?: unknown) { calls.push({ table, method: "select", value }); return builder; },
        insert(value?: unknown) { calls.push({ table, method: "insert", value }); return builder; },
        update(value?: unknown) { calls.push({ table, method: "update", value }); return builder; },
        delete() { calls.push({ table, method: "delete" }); return builder; },
        eq(column: string, value: unknown) { calls.push({ table, method: `eq:${column}`, value }); return builder; },
        order(column: string, value?: unknown) { calls.push({ table, method: `order:${column}`, value }); return builder; },
        limit(value: number) { calls.push({ table, method: "limit", value }); return builder; },
        single() { calls.push({ table, method: "single" }); return Promise.resolve(responses[responseIndex++]); },
        maybeSingle() { calls.push({ table, method: "maybeSingle" }); return Promise.resolve(responses[responseIndex++]); },
        then(resolve: (value: DatabaseResponse) => unknown) {
          return Promise.resolve(responses[responseIndex++]).then(resolve);
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient;

  return { store: createRepositoryStore(client), calls };
}

const documentRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "policy.pdf",
  file_url: null,
  storage_path: "11111111-1111-4111-8111-111111111111/policy.pdf",
  status: "uploaded",
  page_count: 0,
  created_at: "2026-10-03T08:00:00.000Z",
  updated_at: "2026-10-03T08:00:00.000Z",
};

test("creates and reads a document with database fields mapped safely", async () => {
  const { store, calls } = mockSupabase([
    { data: documentRow, error: null },
    { data: documentRow, error: null },
  ]);

  const created = await store.createDocument({
    id: documentRow.id,
    name: documentRow.name,
    storagePath: documentRow.storage_path,
  });
  const read = await store.getDocumentById(documentRow.id);

  assert.equal(created.storagePath, documentRow.storage_path);
  assert.equal(read.status, "uploaded");
  assert.equal(calls.filter((call) => call.table === "documents" && call.method === "insert").length, 1);
});

test("updates document processing status and page count", async () => {
  const { store, calls } = mockSupabase([{
    data: { ...documentRow, status: "processed", page_count: 7 },
    error: null,
  }]);

  const document = await store.updateDocumentProcessingStatus(documentRow.id, "processed", 7);

  assert.equal(document.status, "processed");
  assert.equal(document.pageCount, 7);
  assert.ok(calls.some((call) => call.method === "update"));
});

test("throws a typed not-found error for a missing document", async () => {
  const { store } = mockSupabase([{ data: null, error: null }]);
  await assert.rejects(
    store.getDocumentById(documentRow.id),
    (error) => error instanceof RepositoryNotFoundError && error.entity === "Document"
  );
});

test("inserts, reads, and deletes document chunks without generating content", async () => {
  const row = {
    id: "22222222-2222-4222-8222-222222222222",
    document_id: documentRow.id,
    page_number: 2,
    section: "Meals",
    content: "Receipts are required.",
    embedding: [0.1, 0.2],
    created_at: "2026-10-03T08:01:00.000Z",
  };
  const { store, calls } = mockSupabase([
    { data: [row], error: null },
    { data: [row], error: null },
    { data: null, error: null },
  ]);

  const inserted = await store.insertDocumentChunks(documentRow.id, [{
    pageNumber: 2,
    section: "Meals",
    content: "Receipts are required.",
    embedding: [0.1, 0.2],
  }]);
  const read = await store.getDocumentChunksByDocumentId(documentRow.id);
  await store.deleteDocumentChunksByDocumentId(documentRow.id);

  assert.deepEqual(inserted[0].embedding, [0.1, 0.2]);
  assert.equal(read[0].pageNumber, 2);
  assert.ok(calls.some((call) => call.table === "document_chunks" && call.method === "delete"));
});

test("atomically replaces document chunks and preserves embedding input", async () => {
  const embedding = Array.from({ length: 768 }, (_, index) => index / 768);
  const chunk = {
    pageNumber: 2,
    section: "Meals",
    content: "Receipts are required.",
    embedding,
  };
  const row = {
    id: "22222222-2222-4222-8222-222222222222",
    document_id: documentRow.id,
    page_number: chunk.pageNumber,
    section: chunk.section,
    content: chunk.content,
    embedding,
    created_at: "2026-10-03T08:01:00.000Z",
  };
  const { store, calls } = mockSupabase([{ data: [row], error: null }]);

  const stored = await store.replaceDocumentChunks(documentRow.id, [chunk]);

  assert.deepEqual(stored[0].embedding, embedding);
  assert.deepEqual(calls.find((call) => call.method === "rpc"), {
    table: "replace_document_chunks_atomic",
    method: "rpc",
    value: { p_document_id: documentRow.id, p_chunks: [chunk] },
  });
  assert.equal(calls.some((call) => call.table === "document_chunks" && call.method === "delete"), false);
});

test("atomically clears document chunks with an empty replacement set", async () => {
  const { store, calls } = mockSupabase([{ data: [], error: null }]);

  assert.deepEqual(await store.replaceDocumentChunks(documentRow.id, []), []);
  assert.deepEqual(calls.find((call) => call.method === "rpc")?.value, {
    p_document_id: documentRow.id,
    p_chunks: [],
  });
});

for (const failure of [
  { name: "malformed chunk", message: "each chunk must match the document chunk JSON contract" },
  { name: "invalid embedding", message: "embedding must contain exactly 768 numbers" },
  { name: "database failure", message: "database unavailable" },
]) {
  test(`maps ${failure.name} RPC failures without falling back to non-atomic writes`, async () => {
    const { store, calls } = mockSupabase([{ data: null, error: { message: failure.message } }]);

    await assert.rejects(
      store.replaceDocumentChunks(documentRow.id, [{ pageNumber: 1, content: "Policy text" }]),
      (error: unknown) => error instanceof Error
        && error.name === "RepositoryError"
        && error.message === "Could not replace document chunks."
    );
    assert.equal(calls.filter((call) => call.method === "rpc").length, 1);
    assert.equal(calls.some((call) => call.table === "document_chunks"), false);
  });
}

test("atomically replaces and reads policy rules using the shared PolicyRule contract", async () => {
  const rule: PolicyRule = {
    id: "EXP-001",
    name: "Receipt requirement",
    field: "receipt",
    operator: "==",
    value: true,
    action: "Request receipt",
    citation: { page: 2, section: "Receipts", text: "Receipt required." },
  };
  const row = {
    id: "33333333-3333-4333-8333-333333333333",
    document_id: documentRow.id,
    rule_code: rule.id,
    rule_name: rule.name,
    field_name: rule.field,
    operator: rule.operator,
    value: rule.value,
    action: rule.action,
    citation_page: rule.citation.page,
    citation_section: rule.citation.section,
    raw_rule_text: rule.citation.text,
    created_at: "2026-10-03T08:02:00.000Z",
  };
  const { store, calls } = mockSupabase([
    { data: [row], error: null },
    { data: [row], error: null },
  ]);

  assert.deepEqual(await store.replacePolicyRules(documentRow.id, [rule]), [rule]);
  assert.deepEqual(await store.getPolicyRulesByDocumentId(documentRow.id), [rule]);
  assert.deepEqual(calls.find((call) => call.method === "rpc"), {
    table: "replace_policy_rules_atomic",
    method: "rpc",
    value: { p_document_id: documentRow.id, p_rules: [rule] },
  });
  assert.equal(calls.some((call) => call.table === "policy_rules" && call.method === "delete"), false);
});

test("atomically clears policy rules with an empty replacement set", async () => {
  const { store, calls } = mockSupabase([{ data: [], error: null }]);

  assert.deepEqual(await store.replacePolicyRules(documentRow.id, []), []);
  assert.deepEqual(calls.find((call) => call.method === "rpc")?.value, {
    p_document_id: documentRow.id,
    p_rules: [],
  });
});

test("maps atomic policy-rule RPC failures to RepositoryError", async () => {
  const { store } = mockSupabase([{
    data: null,
    error: { message: "invalid replacement" },
  }]);

  await assert.rejects(
    store.replacePolicyRules(documentRow.id, []),
    (error: unknown) => error instanceof Error
      && error.name === "RepositoryError"
      && error.message === "Could not replace policy rules."
  );
});

test("saves and reads workflows using WorkflowDefinition", async () => {
  const workflow: WorkflowDefinition = {
    nodes: [{ id: "start", type: "start", label: "Start" }],
    edges: [],
  };
  const row = {
    id: "44444444-4444-4444-8444-444444444444",
    document_id: documentRow.id,
    name: "Expense workflow",
    workflow_json: workflow,
    created_at: "2026-10-03T08:03:00.000Z",
  };
  const { store } = mockSupabase([
    { data: row, error: null },
    { data: row, error: null },
    { data: row, error: null },
  ]);

  const saved = await store.saveWorkflow({ documentId: documentRow.id, name: row.name, workflow });
  const byDocument = await store.getWorkflowByDocumentId(documentRow.id);
  const byId = await store.getWorkflowById(row.id);

  assert.deepEqual(saved.workflow, workflow);
  assert.equal(byDocument.documentId, documentRow.id);
  assert.equal(byId.id, row.id);
});

test("creates and reads cases without evaluating rules", async () => {
  const expenseCase: ExpenseCase = {
    employeeName: "Ayesha Khan",
    category: "Travel",
    amount: 12000,
    receipt: true,
    managerApproval: false,
    financeApproval: false,
    internationalTravel: false,
    preApproval: false,
    expenseDate: "2026-09-20",
    submissionDate: "2026-09-25",
  };
  const row = {
    id: "55555555-5555-4555-8555-555555555555",
    workflow_id: "44444444-4444-4444-8444-444444444444",
    employee_name: expenseCase.employeeName,
    category: expenseCase.category,
    amount: expenseCase.amount,
    input_json: expenseCase,
    status: "PENDING",
    created_at: "2026-10-03T08:04:00.000Z",
  };
  const { store } = mockSupabase([
    { data: row, error: null },
    { data: row, error: null },
  ]);

  const created = await store.createCase({ workflowId: row.workflow_id, expenseCase });
  const read = await store.getCaseById(row.id);

  assert.deepEqual(created.expenseCase, expenseCase);
  assert.equal(read.status, "PENDING");
});

test("saves and reads case results without calculating a decision", async () => {
  const result: CaseResult = { status: "APPROVED", violations: [] };
  const row = {
    id: "66666666-6666-4666-8666-666666666666",
    case_id: "55555555-5555-4555-8555-555555555555",
    decision: result.status,
    reason: "All structured rules passed.",
    violations_json: result.violations,
    evidence_json: [],
    action: null,
    created_at: "2026-10-03T08:05:00.000Z",
  };
  const { store } = mockSupabase([
    { data: row, error: null },
    { data: row, error: null },
  ]);

  const saved = await store.saveCaseResult({
    caseId: row.case_id,
    result,
    reason: row.reason,
  });
  const read = await store.getCaseResultByCaseId(row.case_id);

  assert.deepEqual(saved.result, result);
  assert.equal(read.reason, row.reason);
});

test("does not silently convert database failures into empty reads", async () => {
  const { store } = mockSupabase([{ data: null, error: { message: "connection failed" } }]);
  await assert.rejects(store.getDocumentChunksByDocumentId(documentRow.id), /Could not read document chunks/);
});
