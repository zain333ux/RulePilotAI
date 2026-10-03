import Link from "next/link";
import { 
  ArrowRight, 
  ChevronRight,
  FileUp
} from "lucide-react";
import HeroDiagram from "@/components/HeroDiagram";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0d272f] via-[#162237] to-[#262745] text-[#d1d5db] font-sans relative overflow-hidden">
      
      {/* Navigation Bar */}
      <nav className="flex items-center justify-end px-8 py-6 sticky top-0 z-50">
        <div className="flex items-center gap-8 text-[15px] font-medium text-[#9ca3af]">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/policies/upload" className="hover:text-white transition-colors flex items-center gap-1">
            Upload Policy <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
          </Link>
        </div>
      </nav>

      <main className="flex flex-col items-center px-6 pt-10 pb-24 max-w-[1400px] mx-auto">
        
        {/* Hero Text */}
        <div className="text-center w-full max-w-[1200px] space-y-6 mb-10 mt-6 flex flex-col items-center">
          
          {/* Main App Badge */}
          <div className="relative group cursor-default mb-4">
            {/* Animated Glow Behind Badge */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4bbabc] via-[#9a75d5] to-[#4bbabc] rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse" />
            
            <div className="relative flex items-center gap-3 px-6 py-2.5 bg-[#0d1624] border border-[#2b5a6c]/50 rounded-full shadow-2xl">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4bbabc] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4bbabc] shadow-[0_0_12px_#4bbabc]"></span>
              </div>
              <span className="text-[14px] sm:text-[15px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-[#4bbabc] via-[#e2e8f0] to-[#b488f2] text-transparent bg-clip-text">
                RulePilot AI
              </span>
            </div>
          </div>

          <h1 className="text-[42px] sm:text-[52px] md:text-[58px] lg:whitespace-nowrap font-bold text-white tracking-tight leading-[1.1]">
            Turn company rules into actionable execution.
          </h1>
        </div>

        {/* Custom React Diagram */}
        <HeroDiagram />

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mb-24 z-10">
          <Link
            href="/policies/upload"
            className="group relative flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#4bbabc] to-[#9a75d5] text-white text-[15px] font-bold tracking-wide hover:shadow-[0_0_35px_rgba(154,117,213,0.6)] transition-all duration-300 overflow-hidden"
          >
            {/* Button Highlight Sweep Effect */}
            <div className="absolute inset-0 bg-white/20 -translate-x-[120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-in-out skew-x-12" />
            <FileUp className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Upload Policy</span>
          </Link>

          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0d1b2a]/60 backdrop-blur-md border-[1.5px] border-[#2b5a6c]/60 text-[#7cc6c8] text-[15px] font-bold tracking-wide hover:bg-[#162c41]/80 hover:border-[#4bbabc] hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(75,186,188,0.2)]"
          >
            Enter Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-[1200px] z-10">
          
          {/* Feature 1 */}
          <div className="relative bg-[#0d1b2a]/40 backdrop-blur-md border border-[#2b5a6c]/40 p-7 rounded-2xl hover:border-[#4bbabc]/70 hover:bg-[#112538]/60 hover:shadow-[0_0_30px_rgba(75,186,188,0.15)] transition-all duration-500 flex flex-col group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4bbabc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="h-[90px] mb-4 relative flex items-center justify-start">
               {/* Custom Grounded Extraction Icon */}
               <div className="relative w-24 h-24 flex items-center justify-center">
                 {/* Sparkles */}
                 <svg className="absolute top-2 right-4 w-5 h-5 text-[#4bbabc]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                 </svg>
                 <svg className="absolute top-6 left-2 w-3 h-3 text-[#4bbabc]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                 </svg>
                 <svg className="absolute bottom-6 left-1 w-4 h-4 text-[#9a75d5]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                 </svg>

                 {/* Document Base */}
                 <div className="absolute left-4 top-3 w-[46px] h-[64px] bg-gradient-to-b from-[#eaf3f9] to-[#a8c9e4] rounded-[6px] border-[2.5px] border-[#1a2538] shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.4)] flex flex-col gap-[5px] px-[7px] py-[8px]">
                   <div className="h-[2.5px] bg-[#6c869e] w-full rounded-full opacity-70" />
                   <div className="h-[2.5px] bg-[#6c869e] w-full rounded-full opacity-70" />
                   <div className="h-[2.5px] bg-[#6c869e] w-[70%] rounded-full opacity-70" />
                   <div className="h-[2.5px] bg-[#6c869e] w-full rounded-full opacity-70 mt-auto" />
                   <div className="h-[2.5px] bg-[#6c869e] w-[80%] rounded-full opacity-70" />
                   <div className="h-[2.5px] bg-[#6c869e] w-[95%] rounded-full opacity-70" />
                 </div>

                 {/* Magnifying Glass */}
                 <div className="absolute right-3 bottom-3 flex items-center justify-center">
                   {/* Handle */}
                   <div className="absolute top-[75%] left-[75%] w-[14px] h-[26px] bg-gradient-to-b from-[#9a75d5] to-[#71549e] border-[2.5px] border-[#1a2538] rounded-full transform -rotate-[40deg] origin-top-left z-0 shadow-sm" />
                   
                   {/* Lens */}
                   <div className="relative z-10 w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#eaf3f9] to-[#c2d7e9] border-[3px] border-[#1a2538] flex items-center justify-center shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9)]">
                     <span className="text-[#1a2538] font-black text-[16px] tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>AI</span>
                     {/* Glare effect */}
                     <div className="absolute top-[4px] left-[4px] w-[14px] h-[6px] bg-white rounded-full opacity-70 transform -rotate-[40deg]" />
                   </div>
                 </div>
               </div>
            </div>
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Grounded Rule Extraction</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              Instantly transform unstructured policy documents into precise, executable logic using Gemini AI.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="relative bg-[#0d1b2a]/40 backdrop-blur-md border border-[#2b5a6c]/40 p-7 rounded-2xl hover:border-[#4bbabc]/70 hover:bg-[#112538]/60 hover:shadow-[0_0_30px_rgba(75,186,188,0.15)] transition-all duration-500 flex flex-col group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4bbabc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="h-[90px] mb-4 relative flex items-center justify-start">
               {/* Custom Workflow Logic Icon */}
               <div className="relative w-24 h-24 flex items-center justify-center">
                 {/* Sparkles */}
                 <svg className="absolute top-2 left-4 w-4 h-4 text-[#e5a962]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                 </svg>
                 <svg className="absolute bottom-4 right-2 w-5 h-5 text-[#4bbabc]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                 </svg>

                 {/* Nodes and Wires */}
                 <div className="relative w-[70px] h-[60px]">
                   {/* Wires */}
                   <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 60">
                     <path d="M 15 30 L 35 15 L 55 15" fill="none" stroke="#6c869e" strokeWidth="2.5" />
                     <path d="M 15 30 L 35 45 L 55 45" fill="none" stroke="#6c869e" strokeWidth="2.5" />
                   </svg>
                   {/* Node 1 */}
                   <div className="absolute top-1/2 left-0 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#4bbabc] to-[#2b7c7e] border-[2.5px] border-[#1a2538] z-10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4)]">
                      <div className="absolute top-1 left-1 w-3 h-1.5 bg-white rounded-full opacity-60 transform -rotate-[40deg]" />
                   </div>
                   {/* Node 2 */}
                   <div className="absolute top-0 right-0 w-[26px] h-[26px] rounded-[6px] bg-gradient-to-br from-[#9a75d5] to-[#71549e] border-[2.5px] border-[#1a2538] z-10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4)]">
                      <div className="absolute top-0.5 left-0.5 w-3 h-1 bg-white rounded-full opacity-60" />
                   </div>
                   {/* Node 3 */}
                   <div className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-[6px] bg-gradient-to-br from-[#e5a962] to-[#b88241] border-[2.5px] border-[#1a2538] z-10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4)]">
                      <div className="absolute top-0.5 left-0.5 w-3 h-1 bg-white rounded-full opacity-60" />
                   </div>
                 </div>
               </div>
            </div>
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Transparent Workflow Logic</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              Build and visualize complex business rule paths with a dynamic and interactive React Flow interface.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="relative bg-[#0d1b2a]/40 backdrop-blur-md border border-[#2b5a6c]/40 p-7 rounded-2xl hover:border-[#4bbabc]/70 hover:bg-[#112538]/60 hover:shadow-[0_0_30px_rgba(75,186,188,0.15)] transition-all duration-500 flex flex-col group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4bbabc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="h-[90px] mb-4 relative flex items-center justify-start">
               {/* Custom Deterministic Shield Icon */}
               <div className="relative w-24 h-24 flex items-center justify-center">
                 {/* Sparkles */}
                 <svg className="absolute top-3 right-3 w-4 h-4 text-[#9a75d5]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                 </svg>

                 {/* Shield Base */}
                 <div className="relative w-[50px] h-[60px] bg-gradient-to-b from-[#4bbabc] to-[#2b7c7e] border-[2.5px] border-[#1a2538] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.5)] z-10"
                      style={{ clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)', borderRadius: '4px' }}>
                    <div className="absolute inset-0 border-[2.5px] border-[#1a2538] pointer-events-none" style={{ clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)' }} />
                    <div className="absolute top-2 left-2 w-4 h-8 bg-white opacity-20 transform -rotate-[30deg]" />
                 </div>

                 {/* Small Gear */}
                 <div className="absolute bottom-2 right-3 w-7 h-7 rounded-full bg-gradient-to-br from-[#eaf3f9] to-[#c2d7e9] border-[2.5px] border-[#1a2538] flex items-center justify-center z-20 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a2538]" />
                    {/* Gear teeth */}
                    <div className="absolute -inset-1 border-[2.5px] border-dashed border-[#1a2538] rounded-full opacity-30" />
                 </div>
               </div>
            </div>
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Deterministic Decision Engine</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              Ensure repeatable, accurate policy decisions free from human error or hallucinations.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="relative bg-[#0d1b2a]/40 backdrop-blur-md border border-[#2b5a6c]/40 p-7 rounded-2xl hover:border-[#4bbabc]/70 hover:bg-[#112538]/60 hover:shadow-[0_0_30px_rgba(75,186,188,0.15)] transition-all duration-500 flex flex-col group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4bbabc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="h-[90px] mb-4 relative flex items-center justify-start">
               {/* Custom Agentic Integrations Icon */}
               <div className="relative w-24 h-24 flex items-center justify-center">
                 {/* Sparkles */}
                 <svg className="absolute top-2 left-2 w-5 h-5 text-[#4bbabc]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                 </svg>

                 {/* Cloud Base */}
                 <div className="relative w-[64px] h-[44px]">
                    <div className="absolute bottom-0 left-0 w-[64px] h-[30px] bg-gradient-to-br from-[#eaf3f9] to-[#c2d7e9] border-[2.5px] border-[#1a2538] rounded-full shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9)]" />
                    <div className="absolute bottom-[10px] left-[12px] w-[34px] h-[34px] bg-gradient-to-t from-[#c2d7e9] to-[#eaf3f9] border-[2.5px] border-[#1a2538] rounded-full" />
                    {/* Cover up inner borders */}
                    <div className="absolute bottom-[2.5px] left-[15px] w-[30px] h-[25px] bg-[#eaf3f9] rounded-full" />
                    <div className="absolute top-3 left-4 w-4 h-2 bg-white rounded-full opacity-60" />
                 </div>

                 {/* Integration Plugs */}
                 <div className="absolute -bottom-1 flex gap-2">
                    <div className="w-[14px] h-[14px] rounded-sm bg-gradient-to-br from-[#9a75d5] to-[#71549e] border-[2.5px] border-[#1a2538]" />
                    <div className="w-[14px] h-[14px] rounded-sm bg-gradient-to-br from-[#4bbabc] to-[#2b7c7e] border-[2.5px] border-[#1a2538]" />
                 </div>
               </div>
            </div>
            <h3 className="text-[17px] font-bold text-white mb-3 tracking-wide">Agentic Integrations</h3>
            <p className="text-[15px] text-[#8e98ac] leading-[1.6]">
              Submit business cases and audit automated next steps seamlessly into existing workflows.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
