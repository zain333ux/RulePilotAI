"use client";

import { useState } from "react";
import { GitBranch, Info, Layers, RefreshCw } from "lucide-react";
import mockWorkflow from "@/mocks/workflow.json";
import { WorkflowGraph } from "./WorkflowGraph";
import { AgentTimelineDemo } from "@/components/agents/AgentTimelineDemo";
import type { WorkflowDefinition, WorkflowNode } from "@/types/contracts";

const FAST_TRACK_WORKFLOW: WorkflowDefinition = {
  nodes: [
    { id: "ft-1", type: "start", label: "Invoice Submitted" },
    {
      id: "ft-2",
      type: "condition",
      label: "Pre-Approved Vendor & Amount < 5k?",
    },
    { id: "ft-3", type: "action", label: "Instant Payment Disbursal" },
    { id: "ft-4", type: "end", label: "Reconciliation Complete" },
  ],
  edges: [
    { id: "ft-e1", source: "ft-1", target: "ft-2" },
    {
      id: "ft-e2",
      source: "ft-2",
      target: "ft-3",
      label: "Yes (Compliant)",
    },
    { id: "ft-e3", source: "ft-3", target: "ft-4" },
  ],
};

const PROCUREMENT_WORKFLOW: WorkflowDefinition = {
  nodes: [
    { id: "po-1", type: "start", label: "Purchase Requisition" },
    {
      id: "po-2",
      type: "condition",
      label: "Capital Asset > PKR 250k?",
    },
    { id: "po-3", type: "approval", label: "VP Operations Review" },
    {
      id: "po-4",
      type: "approval",
      label: "Procurement Committee Approval",
    },
    { id: "po-5", type: "action", label: "Dispatch PO to Vendor" },
    { id: "po-6", type: "end", label: "Requisition Fulfilled" },
  ],
  edges: [
    { id: "po-e1", source: "po-1", target: "po-2" },
    {
      id: "po-e2",
      source: "po-2",
      target: "po-3",
      label: "Yes (> 250k)",
    },
    {
      id: "po-e3",
      source: "po-2",
      target: "po-4",
      label: "No (<= 250k)",
    },
    { id: "po-e4", source: "po-3", target: "po-4" },
    { id: "po-e5", source: "po-4", target: "po-5" },
    { id: "po-e6", source: "po-5", target: "po-6" },
  ],
};

interface WorkflowOption {
  id: string;
  name: string;
  workflow: WorkflowDefinition;
  description: string;
  synthetic: boolean;
}

const WORKFLOW_OPTIONS: WorkflowOption[] = [
  {
    id: "standard",
    name: "Employee Travel & Expense Policy",
    workflow: mockWorkflow as WorkflowDefinition,
    description:
      "Sample expense workflow from mocks/workflow.json with receipt checks, manager approval and finance approval.",
    synthetic: false,
  },
  {
    id: "fast-track",
    name: "Fast-Track Auto-Reconciliation",
    workflow: FAST_TRACK_WORKFLOW,
    description:
      "Synthetic layout demo only. These illustrative vendor rules are not extracted from the expense policy and do not execute payments.",
    synthetic: true,
  },
  {
    id: "procurement",
    name: "Capital Procurement & PO Routing",
    workflow: PROCUREMENT_WORKFLOW,
    description:
      "Synthetic layout demo only. These illustrative procurement rules are not extracted from the expense policy and do not dispatch purchase orders.",
    synthetic: true,
  },
];

export function WorkflowPlayground() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(
    WORKFLOW_OPTIONS[0].id,
  );
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [traversedNodeIds, setTraversedNodeIds] = useState<string[]>([]);
  const [activeEdgeIds, setActiveEdgeIds] = useState<string[]>([]);
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);

  const currentOption =
    WORKFLOW_OPTIONS.find((option) => option.id === selectedWorkflowId) ??
    WORKFLOW_OPTIONS[0];

  const inspectedNode: WorkflowNode | undefined =
    currentOption.workflow.nodes.find((node) => node.id === inspectedNodeId);

  function handleSelectWorkflow(id: string) {
    if (id === selectedWorkflowId) return;

    setSelectedWorkflowId(id);
    setActiveNodeId(null);
    setTraversedNodeIds([]);
    setActiveEdgeIds([]);
    setInspectedNodeId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Dynamic Workflow Switcher</span>
          </div>
          <p className="text-xs text-zinc-400">
            Compare the sample expense graph with synthetic layout demos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WORKFLOW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={selectedWorkflowId === option.id}
              onClick={() => handleSelectWorkflow(option.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedWorkflowId === option.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "border border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              <span>{option.name}</span>
              <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono opacity-80">
                {option.workflow.nodes.length} Nodes ·{" "}
                {option.workflow.edges.length} Edges
              </span>
              {option.synthetic && (
                <span className="text-[10px]">Synthetic demo</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-base font-semibold text-white">
              <GitBranch className="h-4 w-4 text-indigo-400" />
              <span>{currentOption.name}</span>
            </div>
            <p className="text-xs text-zinc-400">
              {currentOption.description}
            </p>
            <p className="text-xs text-amber-400">
              {currentOption.synthetic
                ? "Synthetic layout demo — illustrative rules, no policy evidence."
                : "Authored sample fixture — not live PDF extraction."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeNodeId && (
              <span className="flex animate-pulse items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/40">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Active Node: {activeNodeId}
              </span>
            )}
            <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300">
              {currentOption.workflow.nodes.length} Nodes ·{" "}
              {currentOption.workflow.edges.length} Edges
            </span>
          </div>
        </div>

        <WorkflowGraph
          workflow={currentOption.workflow}
          activeNodeId={activeNodeId}
          traversedNodeIds={traversedNodeIds}
          activeEdgeIds={activeEdgeIds}
          onNodeClick={(id) => setInspectedNodeId(id)}
        />

        {inspectedNode && (
          <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-4 text-xs text-zinc-300">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-indigo-300">
                <Info className="h-3.5 w-3.5 text-indigo-400" />
                Node Inspection: {inspectedNode.id}
              </span>
              <button
                type="button"
                onClick={() => setInspectedNodeId(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono md:grid-cols-4">
              <div>
                Type:{" "}
                <span className="font-semibold uppercase text-white">
                  {inspectedNode.type}
                </span>
              </div>
              <div>
                Rule:{" "}
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

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
          <AgentTimelineDemo
            key={selectedWorkflowId}
            workflow={currentOption.workflow}
            onActiveNodeChange={setActiveNodeId}
            onTraversedNodesChange={setTraversedNodeIds}
            onActiveEdgesChange={setActiveEdgeIds}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-4 text-xs text-zinc-500">
          <span>
            Primary module ownership:{" "}
            <strong>Member 4 (Workflow / Agent UX / Automation)</strong>
          </span>
          <span>
            Active fixture:{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
              {selectedWorkflowId === "standard"
                ? "mocks/workflow.json"
                : `synthetic-${selectedWorkflowId}`}
            </code>
          </span>
        </div>
      </div>
    </div>
  );
}