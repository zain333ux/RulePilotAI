// Allow the server-only helper to be tested in the Node test runner.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("server-only");
} catch {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  } as NodeModule;
}

import mockWorkflow from "../../mocks/workflow.json";
import type { WorkflowDefinition } from "../../types/contracts";
import { createLayout } from "../../components/workflow/layout";
import {
  createInitialExecutionState,
  discoverWorkflowPaths,
  resetExecutionState,
  stepExecution,
} from "../../components/workflow/execution";

export function validateWorkflowDefinition(workflow: WorkflowDefinition): {
  valid: boolean;
  error?: string;
} {
  if (!workflow || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    return { valid: false, error: "Workflow nodes are empty or missing" };
  }

  if (!Array.isArray(workflow.edges)) {
    return { valid: false, error: "Workflow edges array is missing" };
  }

  const nodeIds = new Set<string>();
  const validTypes = new Set([
    "start",
    "condition",
    "action",
    "approval",
    "end",
  ]);

  for (const node of workflow.nodes) {
    if (nodeIds.has(node.id)) {
      return { valid: false, error: `Duplicate node ID: ${node.id}` };
    }
    nodeIds.add(node.id);

    if (!validTypes.has(node.type)) {
      return { valid: false, error: `Invalid node type: ${node.type}` };
    }
  }

  const edgeIds = new Set<string>();
  for (const edge of workflow.edges) {
    if (edgeIds.has(edge.id)) {
      return { valid: false, error: `Duplicate edge ID: ${edge.id}` };
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return { valid: false, error: `Edge ${edge.id} references a missing node` };
    }
  }

  const startNodes = workflow.nodes.filter((node) => node.type === "start");
  const endNodes = workflow.nodes.filter((node) => node.type === "end");

  if (startNodes.length === 0) {
    return { valid: false, error: "Workflow requires at least one start node" };
  }

  if (endNodes.length === 0) {
    return { valid: false, error: "Workflow requires at least one end node" };
  }

  return { valid: true };
}

export function verifyWorkflowStructure() {
  console.log("=== Verifying Workflow Structure & Malformed Validation ===");

  const workflow = mockWorkflow as WorkflowDefinition;
  const standardValidation = validateWorkflowDefinition(workflow);
  if (!standardValidation.valid) {
    throw new Error(`Standard mock workflow failed validation: ${standardValidation.error}`);
  }

  // Verify rule ID preservation on relevant condition/action nodes
  const ruleNodes = workflow.nodes.filter((n) => n.ruleId);
  if (ruleNodes.length === 0) {
    throw new Error("Workflow nodes must retain relevant ruleId values");
  }
  for (const rn of ruleNodes) {
    if (typeof rn.ruleId !== "string" || !rn.ruleId.startsWith("EXP-")) {
      throw new Error(`Invalid preserved ruleId format: ${rn.ruleId}`);
    }
  }

  // Malformed Workflow Test 1: Duplicate node ID
  const duplicateNodeWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "node-1", type: "start", label: "Start" },
      { id: "node-1", type: "end", label: "Duplicate" },
    ],
    edges: [],
  };
  const dupCheck = validateWorkflowDefinition(duplicateNodeWorkflow);
  if (dupCheck.valid || !dupCheck.error?.includes("Duplicate node ID")) {
    throw new Error("Failed to catch duplicate node ID");
  }

  // Malformed Workflow Test 2: Edge pointing to missing node
  const missingNodeEdgeWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "start", type: "start", label: "Start" },
      { id: "end", type: "end", label: "End" },
    ],
    edges: [{ id: "e1", source: "start", target: "ghost-node" }],
  };
  const edgeCheck = validateWorkflowDefinition(missingNodeEdgeWorkflow);
  if (edgeCheck.valid || !edgeCheck.error?.includes("references a missing node")) {
    throw new Error("Failed to catch edge referencing missing node");
  }

  // Malformed Workflow Test 3: Invalid node type
  const invalidTypeWorkflow = {
    nodes: [
      { id: "start", type: "start", label: "Start" },
      { id: "bad", type: "unsupported-kind", label: "Bad" },
      { id: "end", type: "end", label: "End" },
    ],
    edges: [],
  } as unknown as WorkflowDefinition;
  const typeCheck = validateWorkflowDefinition(invalidTypeWorkflow);
  if (typeCheck.valid || !typeCheck.error?.includes("Invalid node type")) {
    throw new Error("Failed to catch invalid node type");
  }

  // Malformed Workflow Test 4: Missing start node
  const missingStartWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "c1", type: "condition", label: "No Start" },
      { id: "end", type: "end", label: "End" },
    ],
    edges: [],
  };
  const startCheck = validateWorkflowDefinition(missingStartWorkflow);
  if (startCheck.valid || !startCheck.error?.includes("at least one start node")) {
    throw new Error("Failed to catch missing start node");
  }

  // Malformed Workflow Test 5: Missing end node
  const missingEndWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "start", type: "start", label: "Start" },
      { id: "c1", type: "condition", label: "No End" },
    ],
    edges: [],
  };
  const endCheck = validateWorkflowDefinition(missingEndWorkflow);
  if (endCheck.valid || !endCheck.error?.includes("at least one end node")) {
    throw new Error("Failed to catch missing end node");
  }

  console.log(
    `✅ Workflow structure verified: ${workflow.nodes.length} nodes, ${workflow.edges.length} edges + 5 malformed tests passed.`,
  );

  return true;
}

export function verifyDynamicWorkflowLayout() {
  console.log("=== Verifying Workflow Layout Generation ===");

  const workflow = mockWorkflow as WorkflowDefinition;
  const calculated = createLayout(workflow, "node-2", ["node-1"]);

  if (calculated.length !== workflow.nodes.length) {
    throw new Error("Layout node count does not match the workflow");
  }

  for (const node of calculated) {
    if (
      !Number.isFinite(node.position.x) ||
      !Number.isFinite(node.position.y)
    ) {
      throw new Error(`Invalid layout position for ${node.id}`);
    }
  }

  if (!calculated.find((node) => node.id === "node-2")?.data.isActive) {
    throw new Error("Node 2 should be active");
  }

  const node1 = calculated.find((node) => node.id === "node-1");
  if (!node1?.data.isCompleted && !node1?.data.isTraversed) {
    throw new Error("Node 1 should be marked completed/traversed");
  }

  const emptyLayout = createLayout({ nodes: [], edges: [] });

  if (emptyLayout.length !== 0) {
    throw new Error("Empty workflow should produce no layout nodes");
  }

  const singleWorkflow: WorkflowDefinition = {
    nodes: [{ id: "single", type: "start", label: "Single Node" }],
    edges: [],
  };

  const singleLayout = createLayout(singleWorkflow);

  if (singleLayout.length !== 1 || singleLayout[0].position.y !== 0) {
    throw new Error("Single-node layout failed");
  }

  const cyclicWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "c1", type: "condition", label: "Loop A" },
      { id: "c2", type: "condition", label: "Loop B" },
    ],
    edges: [
      { id: "e1", source: "c1", target: "c2" },
      { id: "e2", source: "c2", target: "c1" },
    ],
  };

  const cyclicLayout = createLayout(cyclicWorkflow);

  if (cyclicLayout.length !== 2) {
    throw new Error("Cyclic fallback must retain every node");
  }

  for (const node of cyclicLayout) {
    if (
      !Number.isFinite(node.position.x) ||
      !Number.isFinite(node.position.y)
    ) {
      throw new Error(`Invalid cyclic fallback position for ${node.id}`);
    }
  }

  console.log("✅ Layout checks passed, including cycle fallback.");
  return true;
}

export function verifyExecutionStateLogic() {
  console.log("=== Verifying Pure Execution State Logic & Dynamic Traversal ===");

  // CASE A: start -> end
  const caseAWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "a-start", type: "start", label: "Submit Case A" },
      { id: "a-end", type: "end", label: "Finalize Case A" },
    ],
    edges: [{ id: "a-e1", source: "a-start", target: "a-end" }],
  };
  const pathsA = discoverWorkflowPaths(caseAWorkflow);
  if (pathsA.length !== 1 || pathsA[0].steps.length !== 2) {
    throw new Error(`Case A path discovery failed: expected 1 path with 2 steps, got ${pathsA.length}`);
  }

  let stateA = createInitialExecutionState();
  if (stateA.status !== "idle" || stateA.running || stateA.activeNodeId !== null) {
    throw new Error("Initial state should be idle with no active node");
  }
  // Step 0: start node
  stateA = stepExecution(stateA, pathsA[0], 0, false);
  if (stateA.activeNodeId !== "a-start" || !stateA.running || stateA.steps[0].status !== "running") {
    throw new Error("Case A Step 0 transition failed");
  }
  // Step 1: end node
  stateA = stepExecution(stateA, pathsA[0], 1, false);
  if (stateA.activeNodeId !== "a-end" || !stateA.completedNodeIds.includes("a-start")) {
    throw new Error("Case A Step 1 transition failed");
  }
  // Step 2: automation running
  stateA = stepExecution(stateA, pathsA[0], 2, false);
  if (stateA.steps[3].status !== "running" || stateA.activeNodeId !== null) {
    throw new Error("Case A automation running transition failed");
  }
  // Step 3: automation complete
  stateA = stepExecution(stateA, pathsA[0], 3, false);
  if (stateA.status !== "completed" || stateA.running || stateA.steps[3].status !== "completed") {
    throw new Error("Case A finalization failed");
  }

  // CASE B: start -> condition -> action -> end
  const caseBWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "b1", type: "start", label: "Start B" },
      { id: "b2", type: "condition", label: "Check Threshold B", ruleId: "EXP-001" },
      { id: "b3", type: "action", label: "Require Manager Review" },
      { id: "b4", type: "end", label: "End B" },
    ],
    edges: [
      { id: "be1", source: "b1", target: "b2" },
      { id: "be2", source: "b2", target: "b3", label: "Yes" },
      { id: "be3", source: "b3", target: "b4" },
    ],
  };
  const pathsB = discoverWorkflowPaths(caseBWorkflow);
  if (pathsB.length !== 1 || pathsB[0].steps.length !== 4) {
    throw new Error(`Case B path discovery failed: expected 1 path with 4 steps, got ${pathsB.length}`);
  }
  let stateB = createInitialExecutionState();
  stateB = stepExecution(stateB, pathsB[0], 0, false); // Start
  stateB = stepExecution(stateB, pathsB[0], 1, false); // Condition
  if (stateB.steps[0].status !== "completed" || stateB.steps[1].status !== "running") {
    throw new Error("Case B condition step did not transition Policy to completed and Evaluation to running");
  }
  stateB = stepExecution(stateB, pathsB[0], 2, false); // Action
  if (stateB.steps[1].status !== "completed" || stateB.steps[2].status !== "running") {
    throw new Error("Case B action step did not transition Evaluation to completed and Action to running");
  }
  stateB = stepExecution(stateB, pathsB[0], 3, false); // End
  stateB = stepExecution(stateB, pathsB[0], 4, false); // Automation running
  stateB = stepExecution(stateB, pathsB[0], 5, false); // Automation completed
  if (stateB.status !== "completed" || stateB.completedNodeIds.length !== 4) {
    throw new Error("Case B completion failed");
  }

  // CASE C: full six-rule mock workflow (multi-branch discovery)
  const pathsC = discoverWorkflowPaths(mockWorkflow as WorkflowDefinition);
  if (pathsC.length < 2) {
    throw new Error(`Case C should discover at least 2 distinct branches, found ${pathsC.length}`);
  }
  // Verify all discovered paths in mockWorkflow start with start node and end with end node
  for (const path of pathsC) {
    if (path.steps[0].nodeType !== "start") {
      throw new Error(`Path ${path.id} does not start with a start node`);
    }
    if (path.steps[path.steps.length - 1].nodeType !== "end") {
      throw new Error(`Path ${path.id} does not terminate at an end node`);
    }
  }

  // CASE D: complex DAG with multiple conditions, approvals, and long labels
  const caseDWorkflow: WorkflowDefinition = {
    nodes: [
      { id: "d1", type: "start", label: "Employee Travel & Subsistence Expense Claim Form" },
      { id: "d2", type: "condition", label: "Is total reimbursable amount strictly exceeding the departmental cap of PKR 100,000?", ruleId: "EXP-001" },
      { id: "d3", type: "approval", label: "Executive Vice President and Chief Financial Officer Comprehensive Sign-off" },
      { id: "d4", type: "condition", label: "Does claim date exceed 14 calendar days from travel date?", ruleId: "EXP-002" },
      { id: "d5", type: "action", label: "Flag Claim for Policy Exception Justification" },
      { id: "d6", type: "end", label: "Formal Claim Archival and Disbursement System Record" },
    ],
    edges: [
      { id: "de1", source: "d1", target: "d2" },
      { id: "de2", source: "d2", target: "d3", label: "Yes (> 100,000)" },
      { id: "de3", source: "d2", target: "d4", label: "No (<= 100,000)" },
      { id: "de4", source: "d3", target: "d4" },
      { id: "de5", source: "d4", target: "d5" },
      { id: "de6", source: "d5", target: "d6" },
    ],
  };
  const pathsD = discoverWorkflowPaths(caseDWorkflow);
  if (pathsD.length < 2) {
    throw new Error("Case D complex DAG should discover multiple branches");
  }

  // TEST RESET BEHAVIOR:
  // Reset mid-run must cleanly wipe running, active node, completed nodes, and reset steps to waiting
  const runningState = stepExecution(createInitialExecutionState(), pathsB[0], 2, false);
  if (!runningState.running || runningState.activeNodeId !== "b3") {
    throw new Error("Pre-reset state should be actively running at node b3");
  }
  const resetState = resetExecutionState();
  if (
    resetState.running !== false ||
    resetState.activeNodeId !== null ||
    resetState.completedNodeIds.length !== 0 ||
    resetState.activeEdgeIds.length !== 0 ||
    resetState.steps.some((s) => s.status !== "waiting")
  ) {
    throw new Error("Reset behavior failed to clear state and return steps to waiting");
  }

  // TEST FAILURE BEHAVIOR (Simulated Webhook Failure):
  // When optional webhook fails:
  // - steps 0, 1, 2 remain completed
  // - step 3 is failed
  // - graph nodes remain in completedNodeIds (not erased!)
  // - message confirms core RulePilot decision remains available
  let failureState = createInitialExecutionState();
  for (let i = 0; i <= pathsB[0].steps.length; i++) {
    failureState = stepExecution(failureState, pathsB[0], i, true);
  }
  failureState = stepExecution(failureState, pathsB[0], pathsB[0].steps.length + 1, true);

  if (failureState.status !== "failed") {
    throw new Error("Failure simulation did not set status to failed");
  }
  if (
    failureState.steps[0].status !== "completed" ||
    failureState.steps[1].status !== "completed" ||
    failureState.steps[2].status !== "completed"
  ) {
    throw new Error("Webhook failure must NOT wipe out previous core completed steps");
  }
  if (failureState.steps[3].status !== "failed" || !failureState.steps[3].error) {
    throw new Error("Webhook step should be marked failed with an error description");
  }
  if (failureState.completedNodeIds.length !== 4) {
    throw new Error("Graph nodes must remain completed when optional webhook fails");
  }
  if (!failureState.message.includes("Core RulePilot evaluation and action draft remain available")) {
    throw new Error("Failure message must confirm core results remain available");
  }

  console.log("✅ Pure execution state logic passed all tests (Cases A-D, Reset, and Failure isolation).");
  return true;
}

export async function verifyWebhookReliability() {
  console.log("=== Verifying Automation Webhook Reliability ===");

  const { triggerAutomationWebhook } = await import(
    "../../lib/automation/webhook"
  );

  const originalEnv = process.env.MAKE_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  try {
    // All requests below are mocked; no external webhook is sent.
    globalThis.fetch = async () => {
      throw new Error("Unexpected fetch call");
    };

    delete process.env.MAKE_WEBHOOK_URL;

    const unconfigured = await triggerAutomationWebhook({
      caseId: "sample-case",
    });

    if (
      unconfigured.success ||
      !unconfigured.message.includes("not configured")
    ) {
      throw new Error("Unconfigured webhook fallback failed");
    }

    process.env.MAKE_WEBHOOK_URL = "https://example.invalid/webhook";

    let requestCount = 0;

    globalThis.fetch = async (_input, init) => {
      requestCount++;

      if (
        init?.method !== "POST" ||
        init.body !== JSON.stringify({ caseId: "sample-case" }) ||
        !init.signal
      ) {
        throw new Error("Invalid webhook request");
      }

      return new Response(JSON.stringify({ status: "queued" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const success = await triggerAutomationWebhook({
      caseId: "sample-case",
    });

    if (!success.success || success.status !== 200 || requestCount !== 1) {
      throw new Error(
        `Successful request check failed: ${JSON.stringify(success)}`,
      );
    }

    globalThis.fetch = async () =>
      new Response("Internal Server Error", { status: 500 });

    const httpFailure = await triggerAutomationWebhook({
      caseId: "sample-case",
    });

    if (
      httpFailure.success ||
      httpFailure.status !== 500 ||
      httpFailure.error !== "HTTP_ERROR"
    ) {
      throw new Error("HTTP failure fallback failed");
    }

    globalThis.fetch = async () => {
      throw new Error("ENOTFOUND sensitive-provider-details");
    };

    const networkFailure = await triggerAutomationWebhook({
      caseId: "sample-case",
    });

    if (
      networkFailure.success ||
      networkFailure.error !== "REQUEST_FAILED" ||
      networkFailure.message.includes("sensitive-provider-details")
    ) {
      throw new Error("Safe network failure fallback failed");
    }

    // Wait for the helper's actual timer to abort the mock request.
    globalThis.fetch = async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;

        if (!signal) {
          reject(new Error("Expected an abort signal"));
          return;
        }

        const onAbort = () => {
          const error = new Error("Request aborted");
          error.name = "AbortError";
          reject(error);
        };

        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener("abort", onAbort, { once: true });
        }
      });

    const timeout = await triggerAutomationWebhook(
      { caseId: "sample-case" },
      { timeoutMs: 20 },
    );

    if (
      timeout.success ||
      timeout.error !== "TIMEOUT" ||
      !timeout.message.includes("timed out")
    ) {
      throw new Error("Actual timeout handling failed");
    }

    // Invalid timeouts must return without sending a request.
    globalThis.fetch = async () => {
      throw new Error("Invalid timeout must not call fetch");
    };

    for (const timeoutMs of [0, -1, NaN, Infinity, 30001]) {
      const invalid = await triggerAutomationWebhook(
        { caseId: "sample-case" },
        { timeoutMs },
      );

      if (invalid.success || invalid.error !== "INVALID_TIMEOUT") {
        throw new Error(`Invalid timeout was accepted: ${timeoutMs}`);
      }
    }

    console.log(
      "✅ Mock webhook checks passed: unconfigured, success, HTTP failure, network failure, timeout and invalid timeout.",
    );

    return true;
  } finally {
    if (originalEnv === undefined) {
      delete process.env.MAKE_WEBHOOK_URL;
    } else {
      process.env.MAKE_WEBHOOK_URL = originalEnv;
    }

    globalThis.fetch = originalFetch;
  }
}

export async function runAllWorkflowTests() {
  verifyWorkflowStructure();
  verifyDynamicWorkflowLayout();
  verifyExecutionStateLogic();
  await verifyWebhookReliability();
}

if (typeof require !== "undefined" && require.main === module) {
  runAllWorkflowTests().catch((error) => {
    console.error("Workflow tests failed:", error);
    process.exitCode = 1;
  });
}