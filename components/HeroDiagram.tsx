import React from "react";

const BezierCurve = ({ 
  x1, y1, x2, y2, color, strokeWidth = 1.5, glow = false 
}: { 
  x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth?: number; glow?: boolean
}) => {
  // If the line is perfectly horizontal, add a microscopic offset to y2.
  // This prevents the SVG bounding box from having 0 height, which causes filters (like our glow) to fail to render.
  const safeY2 = y1 === y2 ? y2 + 0.1 : y2;
  const offset = Math.max(Math.abs(x2 - x1) * 0.5, 30);
  const path = `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${safeY2}, ${x2} ${safeY2}`;
  
  return (
    <>
      {glow && (
        <path 
          d={path} 
          stroke={color} 
          strokeWidth={strokeWidth * 4} 
          fill="none" 
          strokeOpacity={0.25}
          filter="url(#subtleglow)"
        />
      )}
      <path 
        d={path} 
        stroke={color} 
        strokeWidth={strokeWidth} 
        fill="none"
        className="drop-shadow-sm"
      />
    </>
  );
};

export default function HeroDiagram() {
  return (
    <div className="w-full max-w-[1200px] h-[350px] relative mx-auto my-8 hidden md:block select-none overflow-hidden">
      
      {/* Blueprint Grid across the entire component, completely transparent background so main page gradient shows through */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Deep Background Glow for the Brain */}
      <div className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#3fd5db] opacity-10 blur-[80px] rounded-[100%] pointer-events-none z-0" />

      {/* Coordinate system: 1200 x 350 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1200 350">
        <defs>
          <filter id="subtleglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Wires from Documents to 7 Nodes */}
        {/* Doc 1 (Expense Policy) -> Nodes 1, 2 */}
        <BezierCurve x1={150} y1={60} x2={270} y2={40} color="#4bbabc" glow />
        <BezierCurve x1={150} y1={80} x2={270} y2={80} color="#4bbabc" glow />
        
        {/* Doc 2 (Expense SOP) -> Nodes 3, 4 */}
        <BezierCurve x1={175} y1={140} x2={270} y2={120} color="#4bbabc" glow />
        <BezierCurve x1={175} y1={160} x2={270} y2={160} color="#4bbabc" glow />
        
        {/* Doc 3 (AI Handbook) -> Nodes 5, 6, 7 */}
        <BezierCurve x1={200} y1={220} x2={270} y2={200} color="#9a75d5" glow />
        <BezierCurve x1={200} y1={240} x2={270} y2={240} color="#9a75d5" glow />
        <BezierCurve x1={200} y1={260} x2={270} y2={280} color="#9a75d5" glow />

        {/* Wires from 7 Nodes converging to Gemini Pill */}
        <BezierCurve x1={310} y1={40} x2={370} y2={160} color="#4bbabc" glow />
        <BezierCurve x1={310} y1={80} x2={370} y2={160} color="#4bbabc" glow />
        <BezierCurve x1={310} y1={120} x2={370} y2={160} color="#4bbabc" glow />
        <BezierCurve x1={310} y1={160} x2={370} y2={160} color="#4bbabc" glow />
        
        <BezierCurve x1={310} y1={200} x2={370} y2={160} color="#9a75d5" glow />
        <BezierCurve x1={310} y1={240} x2={370} y2={160} color="#9a75d5" glow />
        <BezierCurve x1={310} y1={280} x2={370} y2={160} color="#9a75d5" glow />

        {/* Wires from Code Boxes and Gemini to Central Brain */}
        {/* Top Code Box -> Brain */}
        <BezierCurve x1={470} y1={80} x2={525} y2={145} color="#4bbabc" glow />
        
        {/* Gemini -> Brain */}
        <BezierCurve x1={460} y1={160} x2={525} y2={160} color="#4bbabc" glow strokeWidth={2} />
        
        {/* Bottom Code Box -> Brain */}
        <BezierCurve x1={470} y1={240} x2={525} y2={175} color="#4bbabc" glow />

        {/* Brain to Mid Pill */}
        <BezierCurve x1={655} y1={160} x2={720} y2={160} color="#4bbabc" glow strokeWidth={2} />

        {/* Mid Pill to 3 Pills */}
        <BezierCurve x1={770} y1={160} x2={830} y2={70} color="#4bbabc" glow />
        <BezierCurve x1={770} y1={160} x2={830} y2={160} color="#9a75d5" glow />
        <BezierCurve x1={770} y1={160} x2={830} y2={250} color="#9a75d5" glow />

        {/* 3 Pills to 5 Pills */}
        <BezierCurve x1={920} y1={70} x2={980} y2={35} color="#4bbabc" glow />
        <BezierCurve x1={920} y1={70} x2={980} y2={100} color="#4bbabc" glow />
        
        <BezierCurve x1={920} y1={160} x2={980} y2={160} color="#e5a962" glow />
        
        <BezierCurve x1={920} y1={250} x2={980} y2={220} color="#9a75d5" glow />
        <BezierCurve x1={920} y1={250} x2={980} y2={285} color="#9a75d5" glow />
      </svg>

      {/* HTML DOM Layer for Nodes */}
      <div className="absolute inset-0 z-20">
        
        {/* Document Stack Base 1 */}
        <div className="absolute top-[20px] left-[30px] w-[120px] h-[150px] bg-[#60778c]/60 backdrop-blur-md rounded-lg shadow-xl border border-white/10" />
        
        {/* Document Stack Base 2 */}
        <div className="absolute top-[40px] left-[60px] w-[120px] h-[150px] bg-[#89a3b8]/60 backdrop-blur-md rounded-lg shadow-xl border border-white/10" />
        
        {/* Document 1: Expense Policy */}
        <div className="absolute top-[10px] left-[90px] w-[120px] h-[160px] bg-[#ebf0f5] rounded-lg shadow-2xl flex flex-col p-3 z-30 border border-white overflow-hidden">
          {/* Subtle Document Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:5px_5px] pointer-events-none" />
          <div className="relative z-10 text-[11px] font-bold text-[#23354a] mb-3">Expense Policy</div>
          <div className="relative z-10 space-y-2">
            <div className="w-full h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[85%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-full h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[70%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[90%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[40%] h-[1.5px] bg-[#9caebf] rounded-full" />
          </div>
        </div>

        {/* Document 2: Expense SOP */}
        <div className="absolute top-[90px] left-[115px] w-[120px] h-[160px] bg-[#ebf0f5] rounded-lg shadow-2xl flex flex-col p-3 z-40 border border-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:5px_5px] pointer-events-none" />
          <div className="relative z-10 text-[11px] font-bold text-[#23354a] mb-3">Expense SOP</div>
          <div className="relative z-10 space-y-2">
            <div className="w-full h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[85%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-full h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[70%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[90%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-full h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[50%] h-[1.5px] bg-[#9caebf] rounded-full" />
          </div>
        </div>

        {/* Document 3: AI Handbook */}
        <div className="absolute top-[170px] left-[140px] w-[120px] h-[160px] bg-[#ebf0f5] rounded-lg shadow-2xl flex flex-col p-3 z-50 border border-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:5px_5px] pointer-events-none" />
          <div className="relative z-10 text-[11px] font-bold text-[#23354a] mb-3">AI Handbook</div>
          <div className="relative z-10 space-y-2">
            <div className="w-full h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[70%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[95%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[80%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-full h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[60%] h-[1.5px] bg-[#9caebf] rounded-full" />
            <div className="w-[85%] h-[1.5px] bg-[#9caebf] rounded-full" />
          </div>
        </div>

        {/* 7 Realistic Square Nodes */}
        {[40, 80, 120, 160, 200, 240, 280].map((y, i) => {
          const isCyan = i < 4;
          return (
            <div 
              key={i}
              className={`absolute left-[270px] w-[40px] h-[28px] rounded-[6px] -translate-y-1/2 shadow-lg backdrop-blur-md overflow-hidden
                ${isCyan ? 'bg-[#214358]/50 border-[1px] border-[#4cb9bc]' : 'bg-[#292c4a]/50 border-[1px] border-[#9a75d5]'}`}
              style={{ top: `${y}px` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
            </div>
          );
        })}

        {/* Code Box Top */}
        <div className="absolute top-[25px] left-[370px] w-[100px] h-[75px] bg-[#1a2538]/60 backdrop-blur-md border-[1px] border-white/20 rounded-lg shadow-xl p-3 flex flex-col gap-2.5 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:6px_6px] pointer-events-none" />
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[60%] h-[2px] bg-[#d9a05b] rounded-full" /></div>
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[80%] h-[2px] bg-[#4bbabc] rounded-full" /></div>
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[70%] h-[2px] bg-[#9a75d5] rounded-full" /></div>
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[85%] h-[2px] bg-[#4bbabc] rounded-full" /></div>
        </div>

        {/* Engine Pill */}
        <div className="absolute top-[160px] left-[370px] w-[90px] h-[30px] bg-[#326972]/60 backdrop-blur-md border-[1.2px] border-[#5ccdc8] rounded-full -translate-y-1/2 flex items-center justify-center shadow-[0_0_15px_rgba(76,186,188,0.2)]">
          <span className="text-[11px] font-medium text-white/90">Engine</span>
          <div className="absolute right-3 w-1 h-1 rounded-full bg-[#5ccdc8]/70" />
        </div>

        {/* Code Box Bottom */}
        <div className="absolute top-[215px] left-[370px] w-[100px] h-[75px] bg-[#1a2538]/60 backdrop-blur-md border-[1px] border-white/20 rounded-lg shadow-xl p-3 flex flex-col gap-2.5 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:6px_6px] pointer-events-none" />
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[60%] h-[2px] bg-[#d9a05b] rounded-full" /></div>
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[80%] h-[2px] bg-[#4bbabc] rounded-full" /></div>
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[70%] h-[2px] bg-[#9a75d5] rounded-full" /></div>
          <div className="relative z-10 flex gap-2"><div className="w-[10%] h-[2px] bg-[#425b76] rounded-full"/><div className="w-[85%] h-[2px] bg-[#4bbabc] rounded-full" /></div>
        </div>

        {/* Central Brain Square */}
        <div className="absolute top-[160px] left-[590px] w-[120px] h-[120px] bg-[#0c1622]/90 border-[2.5px] border-[#4bbabc] rounded-2xl -translate-y-1/2 -translate-x-1/2 flex items-center justify-center shadow-[0_0_40px_rgba(75,186,188,0.3)] z-50 backdrop-blur-md overflow-hidden">
           <img 
             src="/brain-icon-3.png" 
             alt="AI Engine Brain" 
             className="w-[110%] h-[110%] object-cover mix-blend-screen opacity-90"
           />
        </div>

        {/* Mid Small Pill */}
        <div className="absolute top-[165px] left-[720px] w-[50px] h-[28px] bg-[#46869a]/40 backdrop-blur-md border-[1.5px] border-[#4bbabc] rounded-full -translate-y-1/2 flex items-center justify-center shadow-[0_0_10px_rgba(75,186,188,0.2)]">
           <div className="w-1.5 h-1.5 bg-[#4bbabc]/70 rounded-full" />
        </div>

        {/* 3 Colored Branch Pills */}
        <div className="absolute top-[70px] left-[830px] w-[90px] h-[34px] bg-[#4bbabc]/20 backdrop-blur-md border-[1px] border-[#4bbabc] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>
        
        <div className="absolute top-[165px] left-[830px] w-[90px] h-[34px] bg-[#9a75d5]/20 backdrop-blur-md border-[1px] border-[#9a75d5] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>
        
        <div className="absolute top-[260px] left-[830px] w-[90px] h-[34px] bg-[#4bbabc]/20 backdrop-blur-md border-[1px] border-[#4bbabc] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>

        {/* 5 Final Output Pills */}
        <div className="absolute top-[35px] left-[980px] w-[90px] h-[34px] bg-[#e5a962]/20 backdrop-blur-md border-[1px] border-[#e5a962] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>
        
        <div className="absolute top-[100px] left-[980px] w-[90px] h-[34px] bg-[#b96b79]/20 backdrop-blur-md border-[1px] border-[#b96b79] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>
        
        <div className="absolute top-[165px] left-[980px] w-[90px] h-[34px] bg-[#e5a962]/20 backdrop-blur-md border-[1px] border-[#e5a962] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
           <div className="absolute top-1/2 left-3 -translate-y-1/2 w-1.5 h-1.5 bg-[#e5a962]/70 rounded-full" />
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>
        
        <div className="absolute top-[230px] left-[980px] w-[90px] h-[34px] bg-[#b96b79]/20 backdrop-blur-md border-[1px] border-[#b96b79] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>
        
        <div className="absolute top-[295px] left-[980px] w-[90px] h-[34px] bg-[#9a75d5]/20 backdrop-blur-md border-[1px] border-[#9a75d5] rounded-full -translate-y-1/2 shadow-lg overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
