"use client";

import Link from "next/link";
import { 
  FileText, GitFork, CheckCircle, Clock, ArrowLeft, 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, ArrowRight, Activity, FileCode2,
  FileUp
} from "lucide-react";
import { useSession } from "@/components/session/SessionProvider";

export default function DashboardPage() {
  const { session } = useSession();

  const activePolicies = session.documentId ? 1 : 0;
  const extractedRules = session.rules?.length || 0;
  const activeWorkflows = session.workflow ? 1 : 0;
  
  const hasLatestCase = !!session.latestCaseResult;
  const latestStatus = session.latestCaseResult?.status || "NONE";
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "ACTION_REQUIRED": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "REJECTED": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "ACTION_REQUIRED": return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case "REJECTED": return <XCircle className="w-5 h-5 text-rose-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

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
              Central hub for active policies, extracted rules, and execution outcomes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/policies/upload"
              className="px-6 py-2.5 bg-gradient-to-r from-[#4bbabc] to-[#9a75d5] hover:opacity-90 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(154,117,213,0.2)] transition-all flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" /> Upload Policy
            </Link>
            <Link
              href="/cases"
              className="px-6 py-2.5 bg-[#0d1b2a]/60 hover:bg-[#122336] text-white rounded-xl text-sm font-bold border border-[#2b5a6c]/50 transition-all hover:border-[#4bbabc]/50 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" /> Execute Cases
            </Link>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Active Policies</span>
              <FileText className="w-5 h-5 text-[#4bbabc]" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">{activePolicies}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Current Policy</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Extracted Rules</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">{extractedRules}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Policy-driven constraints</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Workflow Steps</span>
              <GitFork className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">{session.workflow?.nodes.length || 0}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Workflow Steps</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_20px_rgba(43,90,108,0.1)]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-sm font-bold tracking-wide">Recent Executions</span>
              <Clock className="w-5 h-5 text-[#9a75d5]" />
            </div>
            <div className="mt-4 text-4xl font-extrabold text-white">{hasLatestCase ? 1 : 0}</div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Since last session reset</div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Policy Summary */}
            <div className="p-6 rounded-3xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-[#4bbabc]" /> Active Policy Context
                </h3>
                {session.documentId ? (
                  <p className="text-sm text-slate-400">
                    <span className="text-white font-medium">{session.documentName || "Policy Document"}</span> is currently governing the engine.
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">No active policy uploaded.</p>
                )}
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${session.documentId ? 'bg-[#4bbabc]/10 text-[#4bbabc] border-[#4bbabc]/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                {session.documentId ? "ACTIVE" : "INACTIVE"}
              </div>
            </div>

            {/* Extracted Rules Preview */}
            <div className="p-6 rounded-3xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-emerald-400" /> Extracted Rules Preview
                </h3>
                {extractedRules > 0 && (
                  <Link href="/policies" className="text-xs text-[#4bbabc] hover:text-white transition-colors flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {extractedRules > 0 ? (
                <div className="space-y-3">
                  {session.rules?.slice(0, 3).map((rule, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[#2b5a6c]/20 bg-[#122336]/50 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-[#4bbabc]/40 transition-colors">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#4bbabc] mb-1">{rule.id}</div>
                        <div className="text-sm text-slate-200">{rule.name}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono bg-[#0a0f18] px-3 py-1.5 rounded-lg border border-[#2b5a6c]/30">
                        <span className="text-amber-300">{rule.field}</span>
                        <span className="text-slate-400">{rule.operator}</span>
                        <span className="text-emerald-300">{String(rule.value)}</span>
                      </div>
                    </div>
                  ))}
                  {extractedRules > 3 && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-slate-500">+ {extractedRules - 3} more rules loaded in the engine</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center border border-dashed border-[#2b5a6c]/30 rounded-2xl bg-[#0a0f18]/30">
                  <FileText className="w-8 h-8 text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No rules available.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[250px]">Upload a policy document to extract policy rules.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* Workflow Snapshot */}
            <div className="p-6 rounded-3xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-lg">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <GitFork className="w-5 h-5 text-amber-400" /> Workflow Snapshot
              </h3>
              
              {activeWorkflows > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#122336]/50 border border-[#2b5a6c]/20">
                    <div className="text-center flex-1 border-r border-[#2b5a6c]/30">
                      <div className="text-2xl font-black text-amber-400">{session.workflow?.nodes.length}</div>
                      <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Steps</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-2xl font-black text-amber-400">{session.workflow?.edges.length}</div>
                      <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Connections</div>
                    </div>
                  </div>
                  <Link href="/workflows" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-sm font-bold transition-all">
                    Explore Decision Workflow <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="h-[150px] flex flex-col items-center justify-center text-center border border-dashed border-[#2b5a6c]/30 rounded-2xl bg-[#0a0f18]/30">
                  <p className="text-sm text-slate-400">Graph not generated.</p>
                </div>
              )}
            </div>

            {/* Latest Execution */}
            <div className="p-6 rounded-3xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-lg">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-[#9a75d5]" /> Latest Execution
              </h3>
              
              {hasLatestCase ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${getStatusColor(latestStatus)}`}>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(latestStatus)}
                      <span className="font-bold tracking-wide">{latestStatus.replace("_", " ")}</span>
                    </div>
                  </div>
                  
                  {session.latestCaseResult?.violations && session.latestCaseResult.violations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Violations Found:</h4>
                      {session.latestCaseResult.violations.slice(0, 2).map((v, i) => (
                         <div key={i} className="text-xs bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg text-rose-300 flex flex-col gap-1">
                           <span className="font-bold">{v.ruleId}</span>
                           <span>{v.message}</span>
                         </div>
                      ))}
                      {session.latestCaseResult.violations.length > 2 && (
                        <p className="text-xs text-slate-500 text-center mt-2">+{session.latestCaseResult.violations.length - 2} more violations</p>
                      )}
                    </div>
                  )}
                  <Link href="/cases" className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9a75d5]/10 hover:bg-[#9a75d5]/20 text-[#9a75d5] border border-[#9a75d5]/20 hover:border-[#9a75d5]/40 rounded-xl text-sm font-bold transition-all">
                    Run Another Case <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="h-[150px] flex flex-col items-center justify-center text-center border border-dashed border-[#2b5a6c]/30 rounded-2xl bg-[#0a0f18]/30">
                  <p className="text-sm text-slate-400">No cases executed yet.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
