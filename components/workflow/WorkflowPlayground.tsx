"use client";

import { GitBranch, Layers, Sparkles, FileText, ArrowRight } from "lucide-react";
import { WorkflowExecutionDemo } from "./WorkflowExecutionDemo";
import { useSession } from "@/components/session/SessionProvider";
import Link from "next/link";

export function WorkflowPlayground() {
  const { session } = useSession();

  if (!session.workflow) {
    return (
      <div className="rounded-3xl border border-dashed border-[#2b5a6c]/40 bg-[#0d1b2a]/40 backdrop-blur-sm p-12 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center py-32">
        <div className="w-16 h-16 rounded-2xl bg-[#0a0f18] border border-[#2b5a6c]/50 flex items-center justify-center shadow-[0_0_15px_rgba(43,90,108,0.3)] mb-6">
          <Layers className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Active Workflow</h2>
        <p className="text-slate-400 max-w-md mb-8">
          The interactive workflow graph is generated automatically when you upload a policy document and extract its rules.
        </p>
        <Link
          href="/policies/upload"
          className="px-6 py-3 bg-gradient-to-r from-[#4bbabc] to-[#9a75d5] hover:opacity-90 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(154,117,213,0.2)] transition-all flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Upload Policy to Begin
        </Link>
      </div>
    );
  }

  const workflowName = session.documentName ? `${session.documentName} Workflow` : "Active Policy Workflow";

  return (
    <div className="space-y-6 rounded-3xl border border-[#2b5a6c]/40 bg-[#0d1b2a]/40 backdrop-blur-sm p-6 lg:p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#2b5a6c]/30 pb-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <GitBranch className="h-6 w-6 text-[#4bbabc]" />
            <span>{workflowName}</span>
            <div className="flex items-center gap-1 ml-3 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-full font-medium">
              <Sparkles className="w-3 h-3" /> Live Graph
            </div>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            This visual hierarchy was dynamically generated from the extracted rules of your active policy document.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/cases"
            className="flex items-center gap-2 px-4 py-2 bg-[#122336] hover:bg-[#1a3149] text-white rounded-xl text-sm font-bold border border-[#2b5a6c]/50 transition-all hover:border-[#4bbabc]/50"
          >
            Execute Test Cases <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="rounded-xl border border-[#2b5a6c]/50 bg-[#050a10] px-4 py-2 text-sm font-mono text-slate-300 shadow-inner flex items-center gap-3">
            <span><strong className="text-amber-400">{session.workflow.nodes.length}</strong> Nodes</span>
            <span className="w-px h-4 bg-[#2b5a6c]/50" />
            <span><strong className="text-amber-400">{session.workflow.edges.length}</strong> Edges</span>
          </span>
        </div>
      </div>

      <div className="bg-[#050a10] rounded-2xl overflow-hidden border border-[#2b5a6c]/30 shadow-inner min-h-[600px] flex">
        <div className="w-full h-full flex-1">
          <WorkflowExecutionDemo
            key={session.documentId || "session"}
            workflow={session.workflow}
          />
        </div>
      </div>
    </div>
  );
}