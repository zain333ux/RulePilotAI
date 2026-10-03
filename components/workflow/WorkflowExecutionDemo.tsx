"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Info,
  Play,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import type { WorkflowDefinition, WorkflowNode } from "@/types/contracts";
import { WorkflowGraph } from "./WorkflowGraph";
import { AgentTimeline } from "@/components/agents/AgentTimeline";
import {
  createInitialExecutionState,
  discoverWorkflowPaths,
  resetExecutionState,
  stepExecution,
  type WorkflowExecutionState,
} from "./execution";

export interface WorkflowExecutionDemoProps {
  workflow: WorkflowDefinition;
  className?: string;
}

export function WorkflowExecutionDemo({
  workflow,
  className = "",
}: WorkflowExecutionDemoProps) {
  const paths = useMemo(() => discoverWorkflowPaths(workflow), [workflow]);
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>(
    createInitialExecutionState,
  );
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);

  const activeRunId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePath = paths[selectedPathIndex] ?? paths[0];

  // Cleanup on unmount to prevent memory leaks and stale UI mutation
  useEffect(() => {
    return () => {
      activeRunId.current += 1;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  function handleReset() {
    activeRunId.current += 1;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setExecutionState(resetExecutionState());
    setInspectedNodeId(null);
  }

  function handleSelectPath(index: number) {
    if (executionState.running) return;
    handleReset();
    setSelectedPathIndex(index);
  }

  function runSimulation() {
    if (executionState.running || !activePath || activePath.steps.length === 0) {
      return;
    }

    const currentRunId = ++activeRunId.current;
    const shouldFail = simulateFailure;
    const path = activePath;
    const totalSteps = path.steps.length + 1; // Graph steps + automation finalization

    let currentStep = 0;

    function executeNextStep() {
      if (currentRunId !== activeRunId.current) return;

      setExecutionState((prev) => {
        return stepExecution(prev, path, currentStep, shouldFail);
      });

      if (currentStep < totalSteps) {
        currentStep += 1;
        timerRef.current = setTimeout(executeNextStep, 750);
      } else {
        timerRef.current = null;
      }
    }

    executeNextStep();
  }

  const inspectedNode: WorkflowNode | undefined = workflow.nodes.find(
    (node) => node.id === inspectedNodeId,
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Route & Scenario Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <GitBranch className="h-4 w-4 text-indigo-400" />
            <span>Execution Route Preview</span>
          </div>
          <p className="text-xs text-zinc-400">
            {activePath?.description ?? "Select an execution path to simulate."}
          </p>
        </div>

        {paths.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {paths.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                disabled={executionState.running}
                aria-pressed={selectedPathIndex === idx}
                onClick={() => handleSelectPath(idx)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  selectedPathIndex === idx
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <span>{p.name}</span>
                <span className="ml-1.5 rounded bg-black/40 px-1 py-0.5 text-[10px] font-mono">
                  {p.steps.length} Steps
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runSimulation}
            disabled={executionState.running}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{executionState.running ? "Executing..." : "Run Simulation"}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Simulation</span>
          </button>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={simulateFailure}
              disabled={executionState.running}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Simulate webhook failure</span>
          </label>
        </div>

        <div className="text-xs text-zinc-400">
          Status:{" "}
          <span
            className={`font-semibold uppercase ${
              executionState.status === "completed"
                ? "text-emerald-400"
                : executionState.status === "failed"
                  ? "text-rose-400"
                  : executionState.status === "running"
                    ? "text-indigo-400"
                    : "text-zinc-400"
            }`}
          >
            {executionState.status}
          </span>
        </div>
      </div>

      {/* Node Inspection Card */}
      {inspectedNode && (
        <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-4 text-xs text-zinc-300">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Info className="h-4 w-4 text-indigo-400" />
              Inspecting Node: {inspectedNode.id}
            </span>
            <button
              type="button"
              onClick={() => setInspectedNodeId(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono md:grid-cols-4">
            <div>
              Kind:{" "}
              <span className="font-semibold uppercase text-white">
                {inspectedNode.type}
              </span>
            </div>
            <div>
              Rule Ref:{" "}
              <span className="text-amber-400">
                {inspectedNode.ruleId ?? "None"}
              </span>
            </div>
            <div className="col-span-2">
              Label:{" "}
              <span className="text-zinc-100">{inspectedNode.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* Graph Visualizer (Presentational Component) */}
      <div className="relative">
        <WorkflowGraph
          workflow={workflow}
          activeNodeId={executionState.activeNodeId}
          completedNodeIds={executionState.completedNodeIds}
          activeEdgeIds={executionState.activeEdgeIds}
          onNodeClick={(id) => setInspectedNodeId(id)}
        />
      </div>

      {/* Synchronized Agent Pipeline Timeline */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
        <AgentTimeline steps={executionState.steps} />
      </div>

      {/* Real-time Status & Execution Messaging */}
      {executionState.message && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs font-medium ${
            executionState.status === "failed"
              ? "border-rose-900/50 bg-rose-950/30 text-rose-300"
              : executionState.status === "completed"
                ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
                : "border-indigo-900/50 bg-indigo-950/30 text-indigo-200"
          }`}
        >
          {executionState.status === "failed" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          ) : executionState.status === "completed" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          )}
          <div className="space-y-1">
            <p>{executionState.message}</p>
            {executionState.status === "failed" && (
              <p className="font-mono text-[11px] text-zinc-400">
                Notice: Core RulePilot decision, rule evaluation, and approval
                action draft are completely preserved. Only optional webhook
                dispatch timed out or reported failure.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Optional Mock Decision Result Card (Labelled Demo State) */}
      {(executionState.status === "completed" ||
        executionState.status === "failed") && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300">
          <div className="flex items-center gap-2 font-semibold text-white">
            <ShieldAlert className="h-4 w-4 text-indigo-400" />
            <span>Execution Summary</span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-amber-400">
              Simulation
            </span>
          </div>
          <p className="mt-1 text-zinc-400">
            Traversed {executionState.completedNodeIds.length} workflow steps
            across policy extraction and rule evaluation. In live execution,
            RulePilot evaluates citations and ensures policy compliance.
          </p>
        </div>
      )}
    </div>
  );
}
