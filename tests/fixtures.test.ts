import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import rules from "../mocks/policy-rules.json";
import workflow from "../mocks/workflow.json";
import results from "../mocks/case-results.json";
import approved from "../mocks/approved-case.json";
import approval from "../mocks/approval-required-case.json";
import multiple from "../mocks/multiple-violations.json";
import type { ExpenseCase } from "../types/contracts";

const cases = { approved, "approval-required": approval, "multiple-violations": multiple } satisfies Record<string, ExpenseCase>;

test("demo citations point to exact text on their authored sample page", () => {
  const source = readFileSync("mocks/sample-expense-policy.txt", "utf8").replace(/\r\n/g, "\n");
  assert.equal(new Set(rules.map(r => r.id)).size, 6);
  for (const rule of rules) {
    assert.ok([">", "<", ">=", "<=", "==", "!="].includes(rule.operator));
    assert.ok(["number", "string", "boolean"].includes(typeof rule.value));
    assert.ok(Number.isInteger(rule.citation.page) && rule.citation.page > 0);
    const page = source.split(`=== Demo Page ${rule.citation.page} ===`)[1]?.split("=== Demo Page")[0];
    assert.ok(page?.includes(`Section ${rule.citation.section}\n${rule.citation.text}`), rule.id);
  }
});

test("expected sample decisions retain the correct rule IDs and source citations", () => {
  const expected = { approved: [], "approval-required": ["EXP-002"], "multiple-violations": ["EXP-001", "EXP-002", "EXP-003"] };
  for (const key of Object.keys(cases) as (keyof typeof cases)[]) {
    const result = results[key];
    assert.deepEqual(result.violations.map(v => v.ruleId), expected[key]);
    assert.equal(result.status, key === "approved" ? "APPROVED" : "ACTION_REQUIRED");
    for (const violation of result.violations) {
      assert.deepEqual(violation.citation, rules.find(r => r.id === violation.ruleId)?.citation);
      assert.ok(violation.message && violation.action);
    }
    const claim = cases[key];
    const days = (Date.parse(claim.submissionDate) - Date.parse(claim.expenseDate)) / 86400000;
    assert.ok(days >= 0 && days <= 14, "three core fixtures must not hide an extra late violation");
    assert.ok(!/hotel|lodging/i.test(claim.category), "hotel fixtures require explicit nightly rate");
  }
});

test("workflow edges and rule references form a reachable start-to-end graph", () => {
  const ids = new Set(workflow.nodes.map(n => n.id));
  assert.equal(ids.size, workflow.nodes.length);
  assert.equal(new Set(workflow.edges.map(e => e.id)).size, workflow.edges.length);
  const starts = workflow.nodes.filter(n => n.type === "start");
  assert.equal(starts.length, 1);
  assert.ok(workflow.nodes.some(n => n.type === "end"));
  for (const node of workflow.nodes) {
    if (node.ruleId) assert.ok(rules.some(r => r.id === node.ruleId));
  }
  for (const edge of workflow.edges) assert.ok(ids.has(edge.source) && ids.has(edge.target));
  const reachable = new Set([starts[0].id]);
  for (let i = 0; i < workflow.nodes.length; i++) {
    for (const edge of workflow.edges) if (reachable.has(edge.source)) reachable.add(edge.target);
  }
  assert.equal(reachable.size, ids.size, "disconnected nodes cannot be reached from submission");
});
