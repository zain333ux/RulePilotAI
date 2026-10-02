import { AgentStep } from "@/types/contracts";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

interface AgentTimelineProps {
  steps: AgentStep[];
}

export function AgentTimeline({ steps }: AgentTimelineProps) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
      <h3 className="text-base font-semibold text-white">Agent Execution Pipeline</h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="mt-0.5">
              {step.status === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {step.status === "running" && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
              {step.status === "waiting" && <Circle className="w-5 h-5 text-zinc-600" />}
              {step.status === "failed" && <XCircle className="w-5 h-5 text-rose-500" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{step.name}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {step.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
