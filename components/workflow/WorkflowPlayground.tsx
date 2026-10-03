"use client";

import { useState, useEffect } from "react";
import { GitBranch, Layers, Sparkles } from "lucide-react";
import mockWorkflow from "@/mocks/workflow.json";
import { WorkflowExecutionDemo } from "./WorkflowExecutionDemo";
import type { WorkflowDefinition } from "@/types/contracts";
import { useSession } from "@/components/session/SessionProvider";
import Link from "next/link";

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

const BASE_OPTIONS: WorkflowOption[] = [
  {
    id: "standard",
    name: "Standard Expense Check",
    workflow: mockWorkflow as WorkflowDefinition,
    description:
      "Sample expense workflow with receipt checks, manager approval and finance approval.",
    synthetic: false,
  },
  {
    id: "fast-track",
    name: "Fast-Track Auto-Reconciliation",
    workflow: FAST_TRACK_WORKFLOW,
    description:
      "Disburses compliant small-ticket invoices directly without manager escalation.",
    synthetic: true,
  },
  {
    id: "procurement",
    name: "Capital Procurement Routing",
    workflow: PROCUREMENT_WORKFLOW,
    description:
      "Illustrates dual-level committee approval and PO dispatch.",
    synthetic: true,
  },
];

export function WorkflowPlayground() {
  const { session } = useSession();
  
  const options = session.workflow ? [
    {
      id: "session-active",
      name: session.documentName ? `${session.documentName} Workflow` : "Active Policy Workflow",
      workflow: session.workflow,
      description: "Dynamically generated from your most recently uploaded policy.",
      synthetic: false,
    },
    ...BASE_OPTIONS
  ] : BASE_OPTIONS;

  const [selectedWorkflowId, setSelectedWorkflowId] = useState(options[0].id);

  // Sync if session workflow arrives late
  useEffect(() => {
    if (session.workflow && selectedWorkflowId === "standard") {
       setSelectedWorkflowId("session-active");
    }
  }, [session.workflow, selectedWorkflowId]);

  const currentOption =
    options.find((option) => option.id === selectedWorkflowId) ??
    options[0];

  return (
    <div className="space-y-6">
      {/* Switcher Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2b5a6c]/50 bg-[#0d1b2a]/60 backdrop-blur-md p-5 shadow-[0_0_20px_rgba(43,90,108,0.1)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-white tracking-wide">
            <Layers className="h-4 w-4 text-[#4bbabc]" />
            <span>Workflow Engine</span>
          </div>
          <p className="text-xs text-slate-400">
            Select a workflow to simulate the execution engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={selectedWorkflowId === option.id}
              onClick={() => setSelectedWorkflowId(option.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all relative overflow-hidden group border ${
                selectedWorkflowId === option.id
                  ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  : "border-[#2b5a6c]/40 bg-[#122336]/60 text-slate-300 hover:border-[#4bbabc]/50 hover:text-white"
              }`}
            >
              {option.id === "session-active" && selectedWorkflowId === option.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
              )}
              {option.id === "session-active" && (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="relative z-10">{option.name}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono relative z-10 ${
                selectedWorkflowId === option.id ? "bg-indigo-500/20 text-indigo-300" : "bg-[#050a10] text-slate-400 border border-[#2b5a6c]/30"
              }`}>
                {option.workflow.nodes.length} N
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Execution Arena */}
      <div className="space-y-6 rounded-3xl border border-[#2b5a6c]/40 bg-[#0d1b2a]/40 backdrop-blur-sm p-6 lg:p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b5a6c]/30 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <GitBranch className="h-5 w-5 text-[#4bbabc]" />
              <span>{currentOption.name}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              {currentOption.description}
            </p>
          </div>

          <span className="rounded-lg border border-[#2b5a6c]/50 bg-[#122336] px-3 py-1.5 text-xs font-mono text-slate-300 shadow-inner flex items-center gap-3">
            <span><strong>{currentOption.workflow.nodes.length}</strong> Nodes</span>
            <span className="w-px h-3 bg-[#2b5a6c]/50" />
            <span><strong>{currentOption.workflow.edges.length}</strong> Edges</span>
          </span>
        </div>

        {/* Central Controller owning both Graph & Timeline */}
        <div className="bg-[#050a10] rounded-2xl overflow-hidden border border-[#2b5a6c]/30">
          <WorkflowExecutionDemo
            key={selectedWorkflowId}
            workflow={currentOption.workflow}
          />
        </div>
      </div>
    </div>
  );
}