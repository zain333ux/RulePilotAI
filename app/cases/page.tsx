"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle, ShieldAlert, FileText, ArrowRight, Activity, Zap } from "lucide-react";
import { CaseForm } from "@/components/cases/CaseForm";
import { ExpenseCase, Citation } from "@/types/contracts";
import { api } from "@/lib/client/rulepilot-api";
import { useSession } from "@/components/session/SessionProvider";
import { CitationModal } from "@/components/policy/CitationModal";
import { normalizeApiError } from "@/lib/client/error";

export default function CasesPage() {
  const { session, updateSession } = useSession();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const result = session.latestCaseResult || null;
  const [error, setError] = useState<string | null>(null);

  // Next Action state
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);
  const actionResult = session.latestAction && session.latestTemplate 
    ? { action: session.latestAction, template: session.latestTemplate } 
    : null;

  // Citation Modal state
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Copy Feedback state
  const [copyActionState, setCopyActionState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copyTemplateState, setCopyTemplateState] = useState<'idle' | 'copied' | 'error'>('idle');



  const handleEvaluate = async (formData: ExpenseCase) => {
    if (!session.workflowId) {
      setError("No active decision workflow found. Please upload a policy first to generate the workflow.");
      return;
    }

    setIsEvaluating(true);
    setError(null);
    updateSession({
      latestCaseId: undefined,
      latestCaseResult: undefined,
      latestAction: undefined,
      latestTemplate: undefined
    });

    try {
      const evaluationResult = await api.cases.execute(session.workflowId, formData);
      
      // Update session with latest results for Dashboard and clear old actions
      updateSession({
        latestCaseId: evaluationResult.caseId,
        latestCaseResult: evaluationResult.caseResult,
        latestAction: undefined,
        latestTemplate: undefined
      });
    } catch (err: unknown) {
      setError(normalizeApiError(err, "Failed to evaluate case"));
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateAction = async () => {
    if (!session.latestCaseId) return;
    
    setIsGeneratingAction(true);
    setError(null);
    
    try {
      const res = await api.actions.generate(session.latestCaseId);
      // Save action to session
      updateSession({
        latestAction: res.action,
        latestTemplate: res.template
      });
    } catch (err: unknown) {
      setError(normalizeApiError(err, "Failed to generate next action."));
    } finally {
      setIsGeneratingAction(false);
    }
  };

  const handleCopyAction = async () => {
    if (actionResult?.action) {
      try {
        await navigator.clipboard.writeText(actionResult.action);
        setCopyActionState('copied');
      } catch {
        setCopyActionState('error');
      }
      setTimeout(() => setCopyActionState('idle'), 2000);
    }
  };

  const handleCopyTemplate = async () => {
    if (actionResult?.template) {
      try {
        await navigator.clipboard.writeText(actionResult.template);
        setCopyTemplateState('copied');
      } catch {
        setCopyTemplateState('error');
      }
      setTimeout(() => setCopyTemplateState('idle'), 2000);
    }
  };

  const handleOpenCitation = (citation: Citation | undefined) => {
    if (citation) {
      setSelectedCitation(citation);
      setCitationModalOpen(true);
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

  // If no workflow is loaded, show empty state
  if (!session.workflowId) {
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
            You cannot evaluate a business case without an active policy. Please upload a policy document to map the rules.
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
            Evaluate a Case
          </h1>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed mt-2">
            Submit expense claims to be evaluated against the rules mapped from <strong>{session.documentName}</strong>.
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
                    ? "RulePilot is comparing your claim with the active policy rules."
                    : "Fill out the form and submit a case to see the policy decision and supporting evidence."}
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
                    {result.status === "APPROVED" ? "Case Approved" : result.status === "ACTION_REQUIRED" ? "Action Required" : "Case Rejected"}
                  </h3>
                  <p className="text-sm text-slate-400">Evaluated against the active policy.</p>
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
                          <p className="text-sm text-rose-200 leading-relaxed mb-4">{violation.message}</p>
                          
                          <div className="space-y-3 bg-[#0a0f18]/50 p-4 rounded-xl border border-rose-500/10">
                            <div>
                              <p className="text-xs text-rose-500/70 font-bold uppercase tracking-wider mb-1">Required Action</p>
                              <p className="text-sm text-rose-200">{violation.action || "No specific action defined."}</p>
                            </div>
                            
                            {violation.citation && (
                              <div>
                                <p className="text-xs text-rose-500/70 font-bold uppercase tracking-wider mb-1">Source Reference</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-slate-300">
                                    Page {violation.citation.page} {violation.citation.section && `· ${violation.citation.section}`}
                                  </p>
                                  <button 
                                    onClick={() => handleOpenCitation(violation.citation)}
                                    className="text-xs font-bold text-[#4bbabc] hover:text-[#5fd4d6] transition-colors flex items-center gap-1 bg-[#4bbabc]/10 hover:bg-[#4bbabc]/20 px-2 py-1 rounded-md"
                                  >
                                    View policy evidence <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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

                {/* Next Action Generation for all statuses */}
                <div className="pt-6 border-t border-[#2b5a6c]/30 mt-6">
                  {!actionResult ? (
                    <button
                      onClick={handleGenerateAction}
                      disabled={isGeneratingAction}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {isGeneratingAction ? (
                        <>
                          <Activity className="w-4 h-4 animate-spin" /> Generating Recommended Action...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" /> Generate Recommended Next Action
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Zap className="w-5 h-5" />
                          <h4 className="font-bold uppercase tracking-widest text-sm">Recommended Next Action</h4>
                        </div>
                        <button onClick={handleCopyAction} className="text-xs text-indigo-300 hover:text-white bg-indigo-500/20 px-3 py-1 rounded border border-indigo-500/30 transition-colors">
                          {copyActionState === 'copied' ? "Copied" : copyActionState === 'error' ? "Could not copy. Please select the text manually." : "Copy Action"}
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <p className="text-sm font-semibold text-indigo-200">{actionResult.action}</p>
                      </div>
                      
                      {actionResult.template && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold uppercase tracking-widest text-sm text-slate-400">Suggested Message</h4>
                            <button onClick={handleCopyTemplate} className="text-xs text-slate-300 hover:text-white bg-[#0d1b2a] px-3 py-1 rounded border border-[#2b5a6c]/30 transition-colors">
                              {copyTemplateState === 'copied' ? "Copied" : copyTemplateState === 'error' ? "Could not copy. Please select the text manually." : "Copy Message"}
                            </button>
                          </div>
                          <div className="p-4 rounded-xl bg-[#050a10] border border-[#2b5a6c]/30">
                            <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{actionResult.template}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <CitationModal 
        isOpen={citationModalOpen} 
        onClose={() => setCitationModalOpen(false)} 
        citation={selectedCitation}
        documentName={session.documentName}
      />
    </div>
  );
}
