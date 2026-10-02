"use client";

import { useEffect, useRef, useState } from "react";
import { AgentTimeline } from "./AgentTimeline";
import mockWorkflow from "@/mocks/workflow.json";
import type { AgentStep, WorkflowDefinition } from "@/types/contracts";

export interface ExecutionScenario {
  id: string;
  name: string;
  description: string;
  amount: number;
  steps: {
    nodeId: string;
    edgeId?: string;
    timelineStepIndex: number;
    stepNote: string;
  }[];
}

function makeScenario(
  id: string,
  name: string,
  amount: number,
  description: string,
  path: string[],
  edges: string[],
): ExecutionScenario {
  return {
    id,
    name,
    amount,
    description,
    steps: path.map((nodeId, index) => ({
      nodeId,
      edgeId: index === 0 ? undefined : edges[index - 1],
      timelineStepIndex: index === 0 ? 0 : 1,
      stepNote: `Mock amount-threshold traversal: ${nodeId}.`,
    })),
  };
}

export const DEMO_SCENARIOS: ExecutionScenario[] = [
  makeScenario(
    "executive-claim",
    "Finance Approval (> PKR 100k)",
    145000,
    "Mock PKR 145,000 path shows receipt, manager and finance requirements. No approval is granted or sent.",
    [
      "node-1",
      "node-2",
      "node-3",
      "node-4",
      "node-5",
      "node-6",
      "node-7",
      "node-8",
    ],
    [
      "edge-1",
      "edge-2",
      "edge-4",
      "edge-5",
      "edge-7",
      "edge-8",
      "edge-10",
    ],
  ),
  makeScenario(
    "manager-claim",
    "Manager Approval (PKR 65k)",
    65000,
    "Mock PKR 65,000 path shows receipt and manager requirements, below the finance threshold.",
    [
      "node-1",
      "node-2",
      "node-3",
      "node-4",
      "node-5",
      "node-6",
      "node-8",
    ],
    ["edge-1", "edge-2", "edge-4", "edge-5", "edge-7", "edge-9"],
  ),
  makeScenario(
    "fast-track",
    "Below Receipt Threshold (< PKR 5k)",
    3500,
    "Mock PKR 3,500 path skips amount-based requirements. Other policy rules are not evaluated; no payment is processed.",
    ["node-1", "node-2", "node-4", "node-6", "node-8"],
    ["edge-1", "edge-3", "edge-6", "edge-9"],
  ),
];

function createDefaultSteps(): AgentStep[] {
  return [
    {
      id: "policy",
      name: "Policy Extraction",
      description: "Load authored sample fixture; no PDF extraction.",
      status: "waiting",
    },
    {
      id: "evaluation",
      name: "Rule Evaluation",
      description: "Preview an amount-threshold path; no compliance decision.",
      status: "waiting",
    },
    {
      id: "action",
      name: "Action Generation",
      description: "Simulate preparation of the next action.",
      status: "waiting",
    },
    {
      id: "automation",
      name: "Optional Automation",
      description: "Simulate delivery status; no webhook request.",
      status: "waiting",
    },
  ];
}

export interface AgentTimelineDemoProps {
  workflow?: WorkflowDefinition;
  onActiveNodeChange?: (nodeId: string | null) => void;
  onTraversedNodesChange?: (nodeIds: string[]) => void;
  onActiveEdgesChange?: (edgeIds: string[]) => void;
  onScenarioChange?: (scenario: ExecutionScenario) => void;
}

function validateScenario(
  scenario: ExecutionScenario,
  workflow: WorkflowDefinition,
): string | null {
  for (let index = 0; index < scenario.steps.length; index++) {
    const step = scenario.steps[index];

    if (!workflow.nodes.some((node) => node.id === step.nodeId)) {
      return `Scenario node ${step.nodeId} is absent from this graph.`;
    }

    if (index > 0) {
      const previous = scenario.steps[index - 1];
      const edge = workflow.edges.find((item) => item.id === step.edgeId);

      if (
        !edge ||
        edge.source !== previous.nodeId ||
        edge.target !== step.nodeId
      ) {
        return `Invalid scenario connection to ${step.nodeId}.`;
      }
    }
  }

  return null;
}

export function AgentTimelineDemo({
  workflow = mockWorkflow as WorkflowDefinition,
  onActiveNodeChange,
  onTraversedNodesChange,
  onActiveEdgesChange,
  onScenarioChange,
}: AgentTimelineDemoProps) {
  const [steps, setSteps] = useState<AgentStep[]>(createDefaultSteps);
  const [running, setRunning] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    DEMO_SCENARIOS[0].id,
  );
  const [message, setMessage] = useState("");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRun = useRef(0);
  const runningRef = useRef(false);

  const selectedScenario =
    DEMO_SCENARIOS.find((item) => item.id === selectedScenarioId) ??
    DEMO_SCENARIOS[0];

  const scenarioError = validateScenario(selectedScenario, workflow);

  useEffect(() => {
    return () => {
      activeRun.current += 1;
      runningRef.current = false;

      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function reset() {
    activeRun.current += 1;
    runningRef.current = false;

    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setSteps(createDefaultSteps());
    setRunning(false);
    setMessage("");
    onActiveNodeChange?.(null);
    onTraversedNodesChange?.([]);
    onActiveEdgesChange?.([]);
  }

  function handleScenarioChange(id: string) {
    if (runningRef.current) return;

    reset();
    setSelectedScenarioId(id);

    const scenario = DEMO_SCENARIOS.find((item) => item.id === id);
    if (scenario) onScenarioChange?.(scenario);
  }

  function runDemo() {
    if (runningRef.current) return;

    const error = validateScenario(selectedScenario, workflow);

    if (error) {
      setMessage("This graph is a layout preview; expense simulation is unavailable.");
      return;
    }

    const runId = ++activeRun.current;
    const shouldFail = simulateFailure;
    const scenario = selectedScenario;
    const traversed: string[] = [];
    const edges: string[] = [];

    runningRef.current = true;
    setRunning(true);
    setSteps(createDefaultSteps());
    setMessage(`Running mock preview: ${scenario.name}.`);
    onActiveNodeChange?.(null);
    onTraversedNodesChange?.([]);
    onActiveEdgesChange?.([]);

    function updateStep(
      index: number,
      status: AgentStep["status"],
      description?: string,
    ) {
      const now = new Date().toISOString();

      setSteps((current) =>
        current.map((step, stepIndex) =>
          stepIndex === index
            ? {
                ...step,
                status,
                description: description ?? step.description,
                startedAt: step.startedAt ?? now,
                completedAt:
                  status === "completed" || status === "failed"
                    ? now
                    : undefined,
                error:
                  status === "failed"
                    ? "Simulated automation failure"
                    : undefined,
              }
            : step,
        ),
      );
    }

    function schedule(callback: () => void) {
      timer.current = setTimeout(() => {
        if (runId !== activeRun.current) return;
        timer.current = null;
        callback();
      }, 750);
    }

    function finishAutomation() {
      updateStep(
        3,
        shouldFail ? "failed" : "completed",
        shouldFail
          ? "Simulated delivery failure; mock traversal remains complete."
          : "Mock delivery step completed; no notification sent.",
      );

      runningRef.current = false;
      setRunning(false);
      onActiveNodeChange?.(null);
      setMessage(
        shouldFail
          ? "Mock preview complete. Optional automation failure simulated; nothing sent."
          : "Mock preview complete. No live evaluation, approval, payment or webhook request.",
      );
    }

    function simulateAction() {
      onActiveNodeChange?.(null);
      updateStep(1, "completed");
      updateStep(2, "running", "Simulating next-action preparation.");

      schedule(() => {
        updateStep(2, "completed", "Mock action step complete; no draft sent.");
        updateStep(3, "running");
        schedule(finishAutomation);
      });
    }

    function traverse(index: number) {
      if (runId !== activeRun.current) return;

      const step = scenario.steps[index];
      const node = workflow.nodes.find((item) => item.id === step.nodeId)!;

      traversed.push(step.nodeId);
      if (step.edgeId) edges.push(step.edgeId);

      onActiveNodeChange?.(step.nodeId);
      onTraversedNodesChange?.([...traversed]);
      onActiveEdgesChange?.([...edges]);

      if (index === 0) {
        updateStep(0, "running");
      } else {
        updateStep(0, "completed");
        updateStep(1, "running", `Mock path preview: ${node.label}`);
      }

      schedule(() => {
        if (index + 1 < scenario.steps.length) {
          traverse(index + 1);
        } else {
          simulateAction();
        }
      });
    }

    traverse(0);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-400">
        Mock visualization only — no AI, full compliance evaluation,
        approvals, payments or webhook requests.
      </p>

      {scenarioError ? (
        <p className="text-sm text-zinc-300">
          Synthetic layout preview. Expense scenarios are available only
          on the Employee Travel & Expense graph.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {DEMO_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                disabled={running}
                aria-pressed={selectedScenarioId === scenario.id}
                onClick={() => handleScenarioChange(scenario.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                  selectedScenarioId === scenario.id
                    ? "bg-indigo-600 text-white"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300"
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold text-emerald-400">
            Scenario Amount: PKR {selectedScenario.amount.toLocaleString()}
          </p>

          <p className="text-xs text-zinc-400">
            {selectedScenario.description}
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runDemo}
          disabled={running || scenarioError !== null}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Running..." : "Run Simulation"}
        </button>

        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
        >
          Reset Graph & Pipeline
        </button>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={simulateFailure}
            disabled={running || scenarioError !== null}
            onChange={(event) => setSimulateFailure(event.target.checked)}
            className="accent-indigo-500"
          />
          Simulate webhook failure
        </label>
      </div>

      <AgentTimeline steps={steps} />

      <p role="status" aria-live="polite" className="min-h-5 text-sm text-zinc-300">
        {message}
      </p>
    </div>
  );
}