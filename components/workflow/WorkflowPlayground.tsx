"use client";

import { useState } from "react";
import { GitBranch, Layers } from "lucide-react";
import mockWorkflow from "@/mocks/workflow.json";
import { WorkflowExecutionDemo } from "./WorkflowExecutionDemo";
import type { WorkflowDefinition } from "@/types/contracts";

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
      "Synthetic layout demo. Disburses compliant small-ticket invoices directly without manager escalation.",
    synthetic: true,
  },
  {
    id: "procurement",
    name: "Capital Procurement & PO Routing",
    workflow: PROCUREMENT_WORKFLOW,
    description:
      "Synthetic layout demo. Illustrates dual-level committee approval and PO dispatch.",
    synthetic: true,
  },
];

export function WorkflowPlayground() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(
    WORKFLOW_OPTIONS[0].id,
  );

  const currentOption =
    WORKFLOW_OPTIONS.find((option) => option.id === selectedWorkflowId) ??
    WORKFLOW_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Switcher Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Dynamic Workflow Switcher</span>
          </div>
          <p className="text-xs text-zinc-400">
            Compare the sample expense graph with alternate dynamic workflow topologies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WORKFLOW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={selectedWorkflowId === option.id}
              onClick={() => setSelectedWorkflowId(option.id)}
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
                <span className="text-[10px] text-zinc-400">Demo</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Execution Arena */}
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
                ? "Synthetic layout demo — dynamic topology verification."
                : "Authored sample fixture — mock demonstration data."}
            </p>
          </div>

          <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300">
            {currentOption.workflow.nodes.length} Nodes ·{" "}
            {currentOption.workflow.edges.length} Edges
          </span>
        </div>

        {/* Central Controller owning both Graph & Timeline */}
        <WorkflowExecutionDemo
          key={selectedWorkflowId}
          workflow={currentOption.workflow}
        />

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