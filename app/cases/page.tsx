"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
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
    } catch (err: any) {
      setError(err.message || "Failed to evaluate case");
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
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "ACTION_REQUIRED":
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-rose-400" />;
      default:
        return null;
    }
  };

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
            Submit expense claims to be evaluated deterministically against your active policy rules.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <CaseForm onSubmit={handleEvaluate} isLoading={isEvaluating} />
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!result && !error && (
              <div className="h-full min-h-[300px] border border-[#2b5a6c]/30 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-[#0d1b2a]/20 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-[#122336] flex items-center justify-center mb-4 border border-[#2b5a6c]/30 shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Awaiting Evaluation</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Fill out the form and submit a case to see the deterministic engine's decision based on the extracted rules.
                </p>
              </div>
            )}

            {result && (
              <div className="p-8 rounded-3xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_30px_rgba(43,90,108,0.1)] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start justify-between border-b border-[#2b5a6c]/30 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                      Evaluation Result
                    </h3>
                    <p className="text-xs text-slate-400">Processed by RulePilot Engine</p>
                  </div>
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold tracking-wider ${getStatusColor(result.status)}`}>
                    {getStatusIcon(result.status)}
                    {result.status.replace("_", " ")}
                  </span>
                </div>

                {result.violations.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-widest">Violations</h4>
                    <div className="space-y-3">
                      {result.violations.map((violation, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                          <p className="font-semibold mb-1">{violation.ruleId}</p>
                          <p>{violation.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}



                {result.status === "APPROVED" && result.violations.length === 0 && (
                  <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-center flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <p className="font-bold">All compliance checks passed.</p>
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
