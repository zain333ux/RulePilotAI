"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Database, GitMerge, FileSearch, Terminal, Copy, Check } from "lucide-react";
import { useSession } from "@/components/session/SessionProvider";

import { PolicyRule } from "@/types/contracts";

export default function PoliciesPage() {
  const { session } = useSession();
  const [copyState, setCopyState] = useState<{ id: string; status: "copied" | "error" } | null>(null);
  
  const rules = session.rules || [];
  const documentName = session.documentName || "Unknown Document";

  const handleCopyLogic = async (rule: PolicyRule) => {
    const logicString = `if (${rule.field} ${rule.operator} ${rule.value}) { action = '${rule.action}' }`;
    try {
      await navigator.clipboard.writeText(logicString);
      setCopyState({ id: rule.id, status: "copied" });
    } catch {
      setCopyState({ id: rule.id, status: "error" });
    }
    setTimeout(() => setCopyState(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 p-8 relative overflow-hidden flex flex-col">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[10%] w-[40%] h-[50%] bg-[#4bbabc]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[40%] bg-[#9a75d5]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10 w-full flex-1">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-sm text-[#4bbabc]/70 hover:text-[#4bbabc] transition-colors bg-[#0d1b2a]/40 px-4 py-2 rounded-full border border-[#2b5a6c]/30 hover:border-[#4bbabc]/50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium tracking-wide">Back to Dashboard</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#0d1b2a] border border-[#2b5a6c]/50 flex items-center justify-center shadow-[0_0_15px_rgba(43,90,108,0.3)]">
                <Database className="w-5 h-5 text-[#4bbabc]" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Policy Rules
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed mt-2">
              Explore the rules extracted from your active policies.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Link href="/workflows" className="flex items-center gap-2 px-4 py-2 bg-[#0d1b2a]/60 border border-[#2b5a6c]/40 rounded-xl hover:border-[#4bbabc]/50 hover:bg-[#112538] transition-colors text-xs font-bold text-[#4bbabc] uppercase tracking-wider">
               <GitMerge className="w-3.5 h-3.5" />
               View Decision Workflow
             </Link>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-24 bg-[#0d1b2a]/40 backdrop-blur-md border border-[#2b5a6c]/40 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(43,90,108,0.1)]">
             <div className="w-16 h-16 rounded-full bg-[#122336] flex items-center justify-center mb-4 border border-[#2b5a6c]/30 shadow-inner">
               <Database className="w-8 h-8 text-slate-500" />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">No Active Policy</h2>
             <p className="text-slate-400 max-w-md mb-6">Upload a corporate policy document to extract rules and view them here.</p>
             <Link 
               href="/policies/upload"
               className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
             >
               Upload Policy
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
               {/* Document summary card */}
               <div className="bg-[#0d1b2a]/40 backdrop-blur-md border border-[#2b5a6c]/40 p-6 rounded-2xl shadow-[0_0_20px_rgba(43,90,108,0.1)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4bbabc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4bbabc] to-[#2b7c7e] p-0.5 shadow-[0_0_20px_rgba(75,186,188,0.3)] mb-4">
                       <div className="w-full h-full bg-[#0a0f18] rounded-[10px] flex items-center justify-center">
                         <FileText className="w-6 h-6 text-[#4bbabc]" />
                       </div>
                     </div>
                     <h2 className="text-lg font-bold text-white mb-4 truncate" title={documentName}>{documentName}</h2>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-sm border-b border-[#2b5a6c]/20 pb-2">
                         <span className="text-slate-400">Extracted Rules</span>
                         <span className="font-bold text-[#9a75d5]">{rules.length}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400">Status</span>
                         <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded shadow-[0_0_10px_rgba(52,211,153,0.2)]">Active</span>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-[#4bbabc] uppercase tracking-widest flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4" />
                Extracted Rules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-[#122336]/60 border border-[#2b5a6c]/40 rounded-xl p-5 hover:border-[#4bbabc]/50 hover:shadow-[0_0_20px_rgba(75,186,188,0.1)] transition-all group relative overflow-hidden flex flex-col h-full">
                     <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <FileSearch className="w-16 h-16 text-[#4bbabc]" />
                     </div>
                     
                     <div className="flex items-center justify-between mb-4 relative z-10">
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-[#4bbabc]/10 text-[#4bbabc] rounded-md border border-[#4bbabc]/30 uppercase tracking-wider shadow-inner">
                         {rule.id}
                       </span>
                       <span className="text-[10px] text-slate-300 font-mono flex items-center gap-1.5 bg-[#050a10] px-2 py-1 rounded border border-[#2b5a6c]/30">
                         Page {rule.citation?.page} {rule.citation?.section && `· Sec ${rule.citation.section}`}
                       </span>
                     </div>
                     
                     <h4 className="text-[15px] font-bold text-white mb-2 relative z-10 leading-snug group-hover:text-[#4bbabc] transition-colors">{rule.name}</h4>
                     <div className="flex-1 space-y-4">
                       <div>
                         <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Condition</p>
                         <p className="text-sm text-slate-300 bg-[#0d1b2a] p-2 rounded-lg border border-[#2b5a6c]/30 shadow-inner">
                           Applies when <span className="text-[#4bbabc] font-medium">{rule.field}</span> is <span className="text-pink-400 font-medium">{rule.operator}</span> <span className="text-[#e5a962] font-medium">{rule.value.toString()}</span>
                         </p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Required Action</p>
                         <p className="text-sm text-emerald-300 font-medium">{rule.action}</p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Policy Evidence</p>
                         <p className="text-xs text-slate-400 italic bg-[#050a10]/50 p-2 rounded-lg border border-slate-800 line-clamp-2">
                           &quot;{rule.citation?.text}&quot;
                         </p>
                       </div>
                     </div>
                     
                     <div className="mt-4 pt-3 border-t border-[#2b5a6c]/20 flex justify-end">
                       <button onClick={() => handleCopyLogic(rule)} className={`${copyState?.id === rule.id && copyState.status === "copied" ? 'text-emerald-400' : copyState?.id === rule.id && copyState.status === "error" ? 'text-rose-400' : 'text-slate-500 hover:text-white'} transition-colors flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold`} title="Copy Logic">
                         {copyState?.id === rule.id && copyState.status === "copied" ? <><Check className="w-3 h-3" /> Copied</> : copyState?.id === rule.id && copyState.status === "error" ? "Copy failed" : <><Copy className="w-3 h-3" /> Copy Logic</>}
                       </button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
