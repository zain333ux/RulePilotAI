"use client";

import Link from "next/link";
import { FileText, GitFork, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { useSession } from "@/components/session/SessionProvider";

export default function DashboardPage() {
  const { session } = useSession();

  const activePolicies = session.documentId ? 1 : 0;
  const extractedRules = session.rules?.length || 0;
  const activeWorkflows = session.workflow ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 p-8 relative overflow-hidden flex flex-col">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-[#4bbabc]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[40%] bg-[#9a75d5]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10 w-full flex-1">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-[#4bbabc]/70 hover:text-[#4bbabc] transition-colors bg-[#0d1b2a]/40 px-4 py-2 rounded-full border border-[#2b5a6c]/30 hover:border-[#4bbabc]/50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium tracking-wide">Home</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2b5a6c]/30 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Enterprise Compliance Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Overview of active company policies, generated workflows, and recent evaluation cases.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/policies/upload"
              className="px-6 py-2.5 bg-gradient-to-r from-[#4bbabc] to-[#9a75d5] hover:opacity-90 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(154,117,213,0.2)] transition-all"
            >
              Upload Policy
            </Link>
            <Link
              href="/cases"
              className="px-6 py-2.5 bg-[#0d1b2a]/60 hover:bg-[#122336] text-white rounded-xl text-sm font-bold border border-[#2b5a6c]/50 transition-all hover:border-[#4bbabc]/50"
            >
              Execute Cases
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)] group hover:border-[#4bbabc]/50 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Active Policies</span>
              <FileText className="w-5 h-5 text-[#4bbabc]" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">{activePolicies}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Currently loaded in engine</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)] group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Extracted Rules</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">{extractedRules}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Deterministic constraints</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)] group hover:border-amber-500/50 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Active Workflows</span>
              <GitFork className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">{activeWorkflows}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Visual hierarchical graphs</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)] group hover:border-[#9a75d5]/50 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Recent Executions</span>
              <Clock className="w-5 h-5 text-[#9a75d5]" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">0</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Since last session reset</div>
          </div>
        </div>
      </div>
    </div>
  );
}
