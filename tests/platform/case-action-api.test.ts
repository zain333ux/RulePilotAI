import assert from "node:assert/strict";
import { test } from "node:test";
import rulesJson from "../../mocks/policy-rules.json";
import { handleGenerateAction } from "../../lib/actions/generate";
import { handleExecuteCase } from "../../lib/cases/execute";
import {
  RepositoryError,
  RepositoryNotFoundError,
  type CaseRecord,
  type CaseResultRecord,
  type CreateCaseInput,
  type SaveCaseResultInput,
  type WorkflowRecord,
} from "../../lib/repositories/repositories";
import type { CaseResult, ExpenseCase, PolicyRule } from "../../types/contracts";

const WORKFLOW_ID = "11111111-1111-4111-8111-111111111111";
const DOCUMENT_ID = "22222222-2222-4222-8222-222222222222";
const CASE_ID = "33333333-3333-4333-8333-333333333333";
const RESULT_ID = "44444444-4444-4444-8444-444444444444";
const rules = rulesJson as PolicyRule[];

const baseCase: ExpenseCase = {
  employeeName: "Ayesha Khan",
  category: "Meals",
  amount: 4500,
  receipt: false,
  managerApproval: false,
  financeApproval: false,
  internationalTravel: false,
  preApproval: false,
  expenseDate: "2026-09-01",
  submissionDate: "2026-09-05",
};

const workflow: WorkflowRecord = {
  id: WORKFLOW_ID,
  documentId: DOCUMENT_ID,
  name: "Expense workflow",
  workflow: { nodes: [], edges: [] },
  createdAt: "2026-10-03T08:00:00.000Z",
};

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function executeDependencies(overrides: Partial<Parameters<typeof handleExecuteCase>[1]> = {}) {
  const calls = { created: [] as CreateCaseInput[], saved: [] as SaveCaseResultInput[] };
  const dependencies: Parameters<typeof handleExecuteCase>[1] = {
    async getWorkflowById() { return workflow; },
    async getPolicyRulesByDocumentId() { return rules; },
    async createCase(input) {
      calls.created.push(input);
      return {
        id: CASE_ID,
        workflowId: input.workflowId,
        expenseCase: input.expenseCase,
        status: input.status ?? "PENDING",
        createdAt: "2026-10-03T08:01:00.000Z",
      };
    },
    async saveCaseResult(input) {
      calls.saved.push(input);
      return {
        id: RESULT_ID,
        caseId: input.caseId,
        result: input.result,
        reason: input.reason,
        evidence: input.evidence ?? [],
        action: input.action,
        createdAt: "2026-10-03T08:02:00.000Z",
      };
    },
    ...overrides,
  };
  return { dependencies, calls };
}

async function execute(expenseCase: ExpenseCase, overrides: Partial<Parameters<typeof handleExecuteCase>[1]> = {}) {
  const { dependencies, calls } = executeDependencies(overrides);
  const response = await handleExecuteCase(
    jsonRequest("/api/cases/execute", { workflowId: WORKFLOW_ID, expenseCase }),
    dependencies,
    { logger: { error() {} } }
  );
  return { response, body: await response.json(), calls };
}

test("executes and persists an approved case", async () => {
  const { response, body, calls } = await execute(baseCase);
  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    success: true,
    caseId: CASE_ID,
    caseResult: { status: "APPROVED", violations: [] },
  });
  assert.equal(calls.created[0].workflowId, WORKFLOW_ID);
  assert.equal(calls.saved[0].caseId, CASE_ID);
});

test("returns action required for missing manager approval", async () => {
  const { body } = await execute({ ...baseCase, amount: 68000, receipt: true });
  assert.equal(body.caseResult.status, "ACTION_REQUIRED");
  assert.deepEqual(body.caseResult.violations.map((item: { ruleId: string }) => item.ruleId), ["EXP-002"]);
});

test("rejects a hotel claim above the nightly cap", async () => {
  const { body } = await execute({
    ...baseCase,
    category: "Hotel",
    amount: 26000,
    receipt: true,
    hotelNightlyRate: 26000,
    hotelNights: 1,
  });
  assert.equal(body.caseResult.status, "REJECTED");
  assert.ok(body.caseResult.violations.some((item: { ruleId: string }) => item.ruleId === "EXP-004"));
});

test("rejects a claim submitted after 14 days", async () => {
  const { body } = await execute({ ...baseCase, submissionDate: "2026-09-16" });
  assert.equal(body.caseResult.status, "REJECTED");
  assert.ok(body.caseResult.violations.some((item: { ruleId: string }) => item.ruleId === "EXP-005"));
});

test("requires pre-approval for international travel", async () => {
  const { body } = await execute({ ...baseCase, internationalTravel: true });
  assert.equal(body.caseResult.status, "ACTION_REQUIRED");
  assert.ok(body.caseResult.violations.some((item: { ruleId: string }) => item.ruleId === "EXP-006"));
});

for (const [name, requestBody] of [
  ["malformed workflow ID", { workflowId: "not-a-uuid", expenseCase: baseCase }],
  ["negative amount", { workflowId: WORKFLOW_ID, expenseCase: { ...baseCase, amount: -1 } }],
  ["invalid date", { workflowId: WORKFLOW_ID, expenseCase: { ...baseCase, expenseDate: "2026-02-30" } }],
  ["submission before expense", { workflowId: WORKFLOW_ID, expenseCase: { ...baseCase, submissionDate: "2026-08-31" } }],
  ["hotel without nightly rate", { workflowId: WORKFLOW_ID, expenseCase: { ...baseCase, category: "Hotel" } }],
  ["invalid hotel nights", { workflowId: WORKFLOW_ID, expenseCase: { ...baseCase, hotelNights: 1.5 } }],
] as const) {
  test(`rejects ${name}`, async () => {
    const { dependencies, calls } = executeDependencies();
    const response = await handleExecuteCase(
      jsonRequest("/api/cases/execute", requestBody),
      dependencies,
      { logger: { error() {} } }
    );
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, "INVALID_REQUEST");
    assert.equal(calls.created.length, 0);
  });
}

test("returns 404 when workflow does not exist", async () => {
  const { response, body } = await execute(baseCase, {
    async getWorkflowById() { throw new RepositoryNotFoundError("Workflow", WORKFLOW_ID); },
  });
  assert.equal(response.status, 404);
  assert.equal(body.code, "WORKFLOW_NOT_FOUND");
});

test("returns 409 when the workflow document has no rules", async () => {
  const { response, body, calls } = await execute(baseCase, {
    async getPolicyRulesByDocumentId() { return []; },
  });
  assert.equal(response.status, 409);
  assert.equal(body.code, "RULES_NOT_READY");
  assert.equal(calls.created.length, 0);
});

test("returns 500 when result persistence fails after case creation", async () => {
  const { response, body, calls } = await execute(baseCase, {
    async saveCaseResult() { throw new RepositoryError("Could not save case result."); },
  });
  assert.equal(response.status, 500);
  assert.equal(body.code, "PERSISTENCE_FAILED");
  assert.equal(calls.created.length, 1);
});

function caseRecord(expenseCase = baseCase): CaseRecord {
  return {
    id: CASE_ID,
    workflowId: WORKFLOW_ID,
    expenseCase,
    status: "PENDING",
    createdAt: "2026-10-03T08:01:00.000Z",
  };
}

function resultRecord(result: CaseResult): CaseResultRecord {
  return {
    id: RESULT_ID,
    caseId: CASE_ID,
    result,
    evidence: result.violations.map((violation) => violation.citation),
    createdAt: "2026-10-03T08:02:00.000Z",
  };
}

function actionDependencies(
  result: CaseResult,
  overrides: Partial<Parameters<typeof handleGenerateAction>[1]> = {}
) {
  const dependencies: Parameters<typeof handleGenerateAction>[1] = {
    async getCaseById() { return caseRecord(); },
    async getCaseResultByCaseId() { return resultRecord(result); },
    ...overrides,
  };
  return dependencies;
}

async function generateAction(
  result: CaseResult,
  overrides: Partial<Parameters<typeof handleGenerateAction>[1]> = {},
  caseId = CASE_ID
) {
  const response = await handleGenerateAction(
    jsonRequest("/api/actions/generate", { caseId }),
    actionDependencies(result, overrides),
    { logger: { error() {} } }
  );
  return { response, body: await response.json() };
}

test("generates payment action from a stored approved result", async () => {
  const { response, body } = await generateAction({ status: "APPROVED", violations: [] });
  assert.equal(response.status, 200);
  assert.equal(body.action, "Process payment disbursement");
  assert.match(body.template, /Ayesha Khan/);
  assert.equal(body.webhookTriggered, false);
});

test("generates approval action from a stored action-required result", async () => {
  const result = (await execute({ ...baseCase, amount: 68000, receipt: true })).body.caseResult;
  const { body } = await generateAction(result);
  assert.equal(body.action, "Request required approvals and documentation");
  assert.match(body.template, /manager/i);
  assert.equal(body.webhookTriggered, false);
});

test("generates rejection action from a stored rejected result", async () => {
  const result = (await execute({ ...baseCase, submissionDate: "2026-09-16" })).body.caseResult;
  const { body } = await generateAction(result);
  assert.equal(body.action, "Issue claim rejection notice");
  assert.match(body.template, /rejected/i);
});

test("rejects malformed case ID", async () => {
  const { response, body } = await generateAction({ status: "APPROVED", violations: [] }, {}, "bad-id");
  assert.equal(response.status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("returns 404 when case does not exist", async () => {
  const { response, body } = await generateAction(
    { status: "APPROVED", violations: [] },
    { async getCaseById() { throw new RepositoryNotFoundError("Case", CASE_ID); } }
  );
  assert.equal(response.status, 404);
  assert.equal(body.code, "CASE_NOT_FOUND");
});

test("returns 409 when case result is not ready", async () => {
  const { response, body } = await generateAction(
    { status: "APPROVED", violations: [] },
    { async getCaseResultByCaseId() { throw new RepositoryNotFoundError("Case result", CASE_ID); } }
  );
  assert.equal(response.status, 409);
  assert.equal(body.code, "RESULT_NOT_READY");
});

test("returns 500 when repository read fails", async () => {
  const { response, body } = await generateAction(
    { status: "APPROVED", violations: [] },
    { async getCaseById() { throw new RepositoryError("Could not read case."); } }
  );
  assert.equal(response.status, 500);
  assert.equal(body.code, "PERSISTENCE_FAILED");
});

test("keeps webhook disabled until Member 4 integration", async () => {
  const { body } = await generateAction({ status: "APPROVED", violations: [] });
  assert.equal(body.webhookTriggered, false);
});
