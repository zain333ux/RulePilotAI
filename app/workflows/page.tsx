import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WorkflowPlayground } from "@/components/workflow/WorkflowPlayground";

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Generated Visual Workflows & Execution Timeline
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Interactive rule hierarchy rendered with React Flow, synchronized with agent execution state.
          </p>
          <p className="mt-2 text-xs text-amber-400/90 font-medium">
            Controlled mock execution simulation — synchronized node traversal and optional webhook automation.
          </p>
        </div>

        <WorkflowPlayground />
      </div>
    </div>
  );
}