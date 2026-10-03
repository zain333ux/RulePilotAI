"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle, ShieldAlert, FileText, ArrowRight, Activity } from "lucide-react";
import { CaseForm } from "@/components/cases/CaseForm";
import { ExpenseCase, CaseResult } from "@/types/contracts";
import { api } from "@/lib/client/rulepilot-api";
import { useSession } from "@/components/session/SessionProvider";

export default function CasesPage() {
  const { session } = useSession();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async (formData: ExpenseCase) => {
    if (!session.documentId) {
      setError("No active policy found. Please upload a policy first.");
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setResult(null);

    try {
      const evaluationResult = await api.cases.execute(session.documentId, formData);
      setResult(evaluationResult.caseResult);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to evaluate case");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
      case "ACTION_REQUIRED":
        return "text-amber-400 border-amber-500/20 bg-amber-500/10";
      case "REJECTED":
        return "text-rose-400 border-rose-500/20 bg-rose-500/10";
      default:
        return "text-slate-400 border-slate-500/20 bg-slate-500/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
      case "ACTION_REQUIRED":
        return <AlertCircle className="w-8 h-8 text-amber-400" />;
      case "REJECTED":
        return <XCircle className="w-8 h-8 text-rose-400" />;
      default:
        return null;
    }
  };

  // If no policy is loaded, show a strict empty state
  if (!session.documentId) {
    return (
      <div className="min-h-screen bg-[#0a0f18] text-slate-200 p-8 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4bbabc]/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="z-10 rounded-3xl border border-dashed border-[#2b5a6c]/40 bg-[#0d1b2a]/40 backdrop-blur-sm p-12 max-w-2xl w-full flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="w-20 h-20 rounded-3xl bg-[#0a0f18] border border-[#2b5a6c]/50 flex items-center justify-center shadow-[0_0_15px_rgba(43,90,108,0.3)] mb-6">
            <ShieldAlert className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
            Policy Required
          </h2>
          <p className="text-slate-400 max-w-lg mb-8 text-lg">
            You cannot evaluate a business case without an active policy. Please upload a policy document to extract the deterministic rules.
          </p>
          <Link
            href="/policies/upload"
            className="px-8 py-4 bg-gradient-to-r from-[#4bbabc] to-[#9a75d5] hover:opacity-90 text-white rounded-xl text-base font-bold shadow-[0_0_20px_rgba(154,117,213,0.2)] transition-all flex items-center gap-2 group"
          >
            <FileText className="w-5 h-5" /> Upload Policy <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 p-8 relative overflow-hidden flex flex-col">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4bbabc]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9a75d5]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10 w-full flex-1">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-sm text-[#4bbabc]/70 hover:text-[#4bbabc] transition-colors bg-[#0d1b2a]/40 px-4 py-2 rounded-full border border-[#2b5a6c]/30 hover:border-[#4bbabc]/50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium tracking-wide">Back to Dashboard</span>
        </Link>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Execute Business Case
          </h1>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed mt-2">
            Submit expense claims to be evaluated deterministically against the extracted rules of <strong>{session.documentName}</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="order-2 lg:order-1">
            <CaseForm onSubmit={handleEvaluate} isLoading={isEvaluating} />
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            {error && (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-sm flex items-start gap-3 shadow-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {!result && !error && (
              <div className="h-full min-h-[400px] border border-[#2b5a6c]/30 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-[#0d1b2a]/20 backdrop-blur-sm">
                <div className="w-20 h-20 rounded-full bg-[#122336]/50 flex items-center justify-center mb-6 border border-[#2b5a6c]/30 shadow-inner relative">
                  {isEvaluating ? (
                    <>
                       <div className="absolute inset-0 border-4 border-[#4bbabc] rounded-full border-t-transparent animate-spin" />
                       <Activity className="w-8 h-8 text-[#4bbabc] animate-pulse" />
                    </>
                  ) : (
                    <CheckCircle2 className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {isEvaluating ? "Analyzing Data..." : "Awaiting Evaluation"}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                  {isEvaluating 
                    ? "The deterministic engine is currently parsing your input against the loaded policy rules." 
                    : "Fill out the form and submit a case to see the deterministic engine's decision based on the extracted rules."}
                </p>
              </div>
            )}

            {result && (
              <div className="p-8 rounded-3xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/60 backdrop-blur-md shadow-[0_0_40px_rgba(43,90,108,0.2)] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-[#2b5a6c]/30">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${getStatusColor(result.status)} shadow-lg`}>
                     {getStatusIcon(result.status)}
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-wider mb-2">
                    {result.status.replace("_", " ")}
                  </h3>
                  <p className="text-sm text-slate-400">Processed deterministically by RulePilot Engine</p>
                </div>

                {result.violations.length > 0 ? (
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-rose-400 mb-4">
                       <AlertCircle className="w-5 h-5" />
                       <h4 className="font-bold uppercase tracking-widest text-sm">Violations Found</h4>
                     </div>
                    <div className="space-y-4">
                      {result.violations.map((violation, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-inner group hover:border-rose-500/40 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                             <span className="font-mono text-xs font-bold bg-rose-500/20 text-rose-300 px-3 py-1 rounded-md border border-rose-500/30">
                               {violation.ruleId}
                             </span>
                             <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">Failed</span>
                          </div>
                          <p className="text-sm text-rose-200 leading-relaxed">{violation.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="font-bold text-emerald-300 text-lg">All Checks Passed</p>
                    <p className="text-sm text-emerald-500/80">The submitted case fully complies with the active policy rules.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
