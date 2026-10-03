import Link from "next/link";
import { 
  ArrowRight, 
  FileUp
} from "lucide-react";
import HeroDiagram from "@/components/HeroDiagram";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0d272f] via-[#162237] to-[#262745] text-[#d1d5db] font-sans relative overflow-hidden flex flex-col">
      <main className="flex flex-col items-center px-6 pt-16 pb-24 max-w-[1400px] mx-auto flex-1">
        
        {/* Hero Text */}
        <div className="text-center w-full max-w-[1200px] space-y-6 mb-10 mt-6 flex flex-col items-center">
          
          <h1 className="text-[42px] sm:text-[52px] md:text-[58px] lg:whitespace-nowrap font-bold text-white tracking-tight leading-[1.1]">
            Turn company policies into clear, enforceable decisions.
          </h1>
          <p className="text-[18px] text-[#9ca3af] max-w-2xl font-medium">
            RulePilot identifies the rules, builds the decision workflow, evaluates cases, and gives you exact source-backed evidence.
          </p>
        </div>

        {/* Custom React Diagram */}
        <HeroDiagram />

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mb-24 z-10 mt-8">
          <Link
            href="/policies/upload"
            className="group relative flex items-center gap-2 px-8 py-3.5 rounded-lg bg-indigo-600 text-white text-[15px] font-bold tracking-wide hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/20"
          >
            <FileUp className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Upload Policy</span>
          </Link>

          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#0d1b2a]/60 backdrop-blur-md border border-[#2b5a6c]/60 text-cyan-400 text-[15px] font-bold tracking-wide hover:bg-[#162c41]/80 hover:border-cyan-400 transition-all duration-300"
          >
            Open Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-[1200px] z-10">
          
          {/* Feature 1 */}
          <div className="relative bg-[#0a0f18]/60 backdrop-blur-md border border-indigo-500/20 p-7 rounded-xl hover:border-indigo-400 transition-all duration-300 flex flex-col">
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Grounded Policy Understanding</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              Turn written policies into clear rules tied back to the original source text.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="relative bg-[#0a0f18]/60 backdrop-blur-md border border-indigo-500/20 p-7 rounded-xl hover:border-indigo-400 transition-all duration-300 flex flex-col">
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Visual Decision Workflows</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              See how policy conditions automatically lead to approvals, actions, or rejections.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="relative bg-[#0a0f18]/60 backdrop-blur-md border border-indigo-500/20 p-7 rounded-xl hover:border-indigo-400 transition-all duration-300 flex flex-col">
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Consistent Case Decisions</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              Evaluate business cases against the exact same rules every single time.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="relative bg-[#0a0f18]/60 backdrop-blur-md border border-indigo-500/20 p-7 rounded-xl hover:border-indigo-400 transition-all duration-300 flex flex-col">
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Source-Backed Evidence</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              Every decision points directly to the exact policy text and section behind it.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
