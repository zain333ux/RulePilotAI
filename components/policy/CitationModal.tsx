"use client";

import { useEffect } from "react";
import { Citation } from "@/types/contracts";
import { X, FileText, Bookmark, Info } from "lucide-react";

interface CitationModalProps {
  citation: Citation | null;
  isOpen: boolean;
  onClose: () => void;
  documentName?: string;
}

export function CitationModal({ citation, isOpen, onClose, documentName }: CitationModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f18]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* Backdrop click closer */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div 
        className="w-full max-w-2xl bg-[#0d1b2a] border border-[#2b5a6c]/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 relative group z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
        
        <div className="flex items-center justify-between p-6 border-b border-[#2b5a6c]/40 bg-[#112538]/50">
          <div className="flex items-center gap-3 text-cyan-400">
            <div className="p-2 bg-cyan-400/10 rounded-lg border border-cyan-400/20">
              <FileText className="w-5 h-5" />
            </div>
            <h2 id="modal-title" className="text-lg font-bold text-white tracking-wide">Policy Evidence</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#162c41] rounded-xl transition-colors border border-transparent hover:border-[#2b5a6c]/50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[13px] font-bold px-3 py-1.5 bg-[#162c41] text-slate-300 border border-[#2b5a6c]/50 rounded-lg shadow-inner max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{documentName || "Policy Document"}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-bold px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg shadow-inner">
              <Bookmark className="w-4 h-4" />
              <span>Page {citation.page}</span>
            </div>
            {citation.section && (
              <div className="flex items-center gap-2 text-[13px] font-bold px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg shadow-inner">
                <Info className="w-4 h-4" />
                <span>Section {citation.section}</span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-transparent rounded-full opacity-50" />
            <div className="pl-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Original Document Text</h3>
              <div className="p-6 rounded-2xl bg-[#0a0f18] border border-[#2b5a6c]/50 text-[15px] leading-relaxed text-slate-200 font-serif shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <FileText className="w-32 h-32" />
                </div>
                <span className="text-cyan-400 font-black text-xl leading-none mr-1">&quot;</span>
                {citation.text}
                <span className="text-cyan-400 font-black text-xl leading-none ml-1">&quot;</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#2b5a6c]/40 bg-[#112538]/30 flex justify-end">
          <button 
            onClick={onClose}
            className="group/btn relative w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold tracking-wide shadow-lg hover:bg-indigo-500 transition-all duration-300"
          >
            <span className="relative z-10">Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
