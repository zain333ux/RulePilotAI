import Link from "next/link";
import { ArrowLeft, GitMerge } from "lucide-react";
import { WorkflowPlayground } from "@/components/workflow/WorkflowPlayground";

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 p-8 relative overflow-hidden flex flex-col">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#9a75d5]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4bbabc]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10 w-full flex-1">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-sm text-[#4bbabc]/70 hover:text-[#4bbabc] transition-colors bg-[#0d1b2a]/40 px-4 py-2 rounded-full border border-[#2b5a6c]/30 hover:border-[#4bbabc]/50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium tracking-wide">Back to Dashboard</span>
        </Link>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#0d1b2a] border border-[#2b5a6c]/50 flex items-center justify-center shadow-[0_0_15px_rgba(43,90,108,0.3)]">
              <GitMerge className="w-5 h-5 text-[#4bbabc]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Interactive Workflows
            </h1>
          </div>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed mt-2">
            Visual rule hierarchy rendered dynamically, mapped from your active policy.
          </p>
        </div>

        <WorkflowPlayground />
      </div>
    </div>
  );
}