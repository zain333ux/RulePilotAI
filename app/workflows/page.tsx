import Link from "next/link";
import { ArrowLeft, GitBranch } from "lucide-react";
import mockWorkflow from "@/mocks/workflow.json";

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

        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Generated Visual Workflows
            </h1>
            <p className="text-sm text-zinc-400">
              Interactive rule hierarchy rendered with React Flow.
            </p>
            <p className="mt-2 text-xs text-amber-400/90 font-medium">
              Sample workflow fixture preview — full React Flow canvas owned by Member 4.
            </p>
          </div>
          <div className="text-xs px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400">
            {mockWorkflow.nodes.length} Nodes · {mockWorkflow.edges.length} Edges
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 min-h-[450px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              Employee Travel & Expense Reimbursement Workflow
            </div>
            <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">
              Sample data
            </span>
          </div>

          <div className="my-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {mockWorkflow.nodes.slice(0, 4).map((node) => (
              <div
                key={node.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-1"
              >
                <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400">
                  {node.type}
                </span>
                <p className="text-xs font-medium text-zinc-200">{node.label}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800/80 pt-4 text-xs text-zinc-500 flex items-center justify-between">
            <span>
              Primary ownership: <strong>Member 4 (Workflow / Agent UX)</strong>
            </span>
            <span>
              Input source:{" "}
              <code className="bg-zinc-800 px-1 py-0.5 rounded">mocks/workflow.json</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
