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

export function verifyWorkflowStructure() {
  console.log("=== Verifying Workflow Structure ===");

  const workflow = mockWorkflow as WorkflowDefinition;

  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    throw new Error("Workflow nodes are empty or missing");
  }

  if (!Array.isArray(workflow.edges) || workflow.edges.length === 0) {
    throw new Error("Workflow edges are empty or missing");
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
      throw new Error(`Duplicate node ID: ${node.id}`);
    }

    nodeIds.add(node.id);

    if (!validTypes.has(node.type)) {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }

  const edgeIds = new Set<string>();

  for (const edge of workflow.edges) {
    if (edgeIds.has(edge.id)) {
      throw new Error(`Duplicate edge ID: ${edge.id}`);
    }

    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Edge ${edge.id} references a missing node`);
    }
  }

  const startNodes = workflow.nodes.filter((node) => node.type === "start");
  const endNodes = workflow.nodes.filter((node) => node.type === "end");

  if (startNodes.length === 0 || endNodes.length === 0) {
    throw new Error("Workflow requires start and end nodes");
  }

  const adjacency = new Map<string, string[]>();

  for (const edge of workflow.edges) {
    const targets = adjacency.get(edge.source) ?? [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  }

  const queue = startNodes.map((node) => node.id);
  const visited = new Set(queue);

  for (let index = 0; index < queue.length; index++) {
    for (const target of adjacency.get(queue[index]) ?? []) {
      if (!visited.has(target)) {
        visited.add(target);
        queue.push(target);
      }
    }
  }

  if (!endNodes.some((node) => visited.has(node.id))) {
    throw new Error("No end node is reachable from a start node");
  }

  console.log(
    `✅ Workflow structure verified: ${workflow.nodes.length} nodes, ${workflow.edges.length} edges.`,
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

  if (!calculated.find((node) => node.id === "node-1")?.data.isTraversed) {
    throw new Error("Node 1 should be traversed");
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
  await verifyWebhookReliability();
}

if (typeof require !== "undefined" && require.main === module) {
  runAllWorkflowTests().catch((error) => {
    console.error("Workflow tests failed:", error);
    process.exitCode = 1;
  });
}