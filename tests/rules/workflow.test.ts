import assert from "node:assert/strict";
import { generateWorkflowFromRules, WorkflowGenerationError } from "../../lib/rules/workflow";
import mockRules from "../../mocks/policy-rules.json";
import { PolicyRule } from "../../types/contracts";

export function runWorkflowGeneratorVerification() {
  console.log("=== Testing Deterministic Workflow Generator ===");

  const rules = mockRules as PolicyRule[];

  // 1. Generate workflow from 6 demo rules
  const workflow = generateWorkflowFromRules(rules);

  // Start node
  const startNode = workflow.nodes.find(n => n.type === "start");
  assert.ok(startNode, "Workflow must contain a start node");
  assert.equal(startNode?.id, "node-1");

  // End node
  const endNode = workflow.nodes.find(n => n.type === "end");
  assert.ok(endNode, "Workflow must contain an end node");

  // Every rule represented and ruleId preserved
  for (const rule of rules) {
    const condNode = workflow.nodes.find(n => n.type === "condition" && n.ruleId === rule.id);
    assert.ok(condNode, `Condition node missing for rule ${rule.id}`);

    const actionNode = workflow.nodes.find(
      n => (n.type === "action" || n.type === "approval") && n.ruleId === rule.id
    );
    assert.ok(actionNode, `Action/approval node missing for rule ${rule.id}`);
  }
  console.log("Test 1 (All Rules Represented & Preserved): Passed");

  // 2. All edges reference valid node IDs, no duplicate edge IDs
  const nodeIds = new Set(workflow.nodes.map(n => n.id));
  assert.equal(nodeIds.size, workflow.nodes.length, "All node IDs must be strictly unique");

  const edgeIds = new Set(workflow.edges.map(e => e.id));
  assert.equal(edgeIds.size, workflow.edges.length, "All edge IDs must be strictly unique");

  for (const edge of workflow.edges) {
    assert.ok(nodeIds.has(edge.source), `Edge ${edge.id} references invalid source ${edge.source}`);
    assert.ok(nodeIds.has(edge.target), `Edge ${edge.id} references invalid target ${edge.target}`);
  }
  console.log("Test 2 (Edge Source/Target Node Integrity & Uniqueness): Passed");

  // 2b. Verify semantic labels for EXP-005 and EXP-006
  const exp005Cond = workflow.nodes.find(n => n.ruleId === "EXP-005" && n.type === "condition");
  assert.equal(exp005Cond?.label, "Submission Delay > 14 Days?", "EXP-005 label must be unambiguous");

  const exp005YesEdge = workflow.edges.find(e => e.source === exp005Cond?.id && e.label?.startsWith("Yes"));
  assert.equal(exp005YesEdge?.label, "Yes (> 14 Days)", "EXP-005 Yes edge must represent violation threshold");

  const exp006Cond = workflow.nodes.find(n => n.ruleId === "EXP-006" && n.type === "condition");
  assert.equal(exp006Cond?.label, "International Travel Claim?");
  console.log("Test 2b (EXP-005 and EXP-006 Semantic Labels): Passed");

  // 3. Deterministic output
  const workflow2 = generateWorkflowFromRules(rules);
  assert.deepEqual(workflow, workflow2, "Workflow generator output must be 100% deterministic");
  console.log("Test 3 (Determinism): Passed");

  // 4. Safe empty rules handling
  const emptyWorkflow = generateWorkflowFromRules([]);
  assert.equal(emptyWorkflow.nodes.length, 2, "Empty workflow should have exactly start and end nodes");
  assert.equal(emptyWorkflow.edges.length, 1, "Empty workflow should have exactly 1 edge from start to end");
  assert.equal(emptyWorkflow.edges[0].source, emptyWorkflow.nodes[0].id);
  assert.equal(emptyWorkflow.edges[0].target, emptyWorkflow.nodes[1].id);
  console.log("Test 4 (Empty Rules Handling): Passed");

  // 5. Reject duplicate rule IDs
  const duplicateRules: PolicyRule[] = [
    rules[0],
    { ...rules[0], name: "Duplicate EXP-001" },
  ];
  assert.throws(
    () => {
      generateWorkflowFromRules(duplicateRules);
    },
    WorkflowGenerationError,
    "Expected WorkflowGenerationError on duplicate rule IDs"
  );
  console.log("Test 5 (Duplicate Rule ID Rejection): Passed");

  console.log("✅ All workflow generator tests passed successfully!");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runWorkflowGeneratorVerification();
}
