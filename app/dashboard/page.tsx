import Link from "next/link";
import { FileText, GitFork, CheckCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Enterprise Compliance Dashboard
            </h1>
            <p className="text-sm text-zinc-400">
              Overview of active company policies, generated workflows, and recent evaluation
              cases.
            </p>
            <p className="mt-2 text-xs text-amber-400/90 font-medium">
              Sample fixture data — not live Supabase records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/policies/upload"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Upload Policy
            </Link>
            <Link
              href="/cases"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium border border-zinc-700 transition-colors"
            >
              View Sample Cases
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-sm font-medium">Active Policies</span>
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">1</div>
            <div className="mt-1 text-xs text-zinc-500">Sample demo policy fixture</div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-sm font-medium">Extracted Rules</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">6</div>
            <div className="mt-1 text-xs text-zinc-500">From mocks/policy-rules.json</div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-sm font-medium">Active Workflows</span>
              <GitFork className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">1</div>
            <div className="mt-1 text-xs text-zinc-500">From mocks/workflow.json</div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-sm font-medium">Sample Cases</span>
              <Clock className="w-5 h-5 text-sky-400" />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">3</div>
            <div className="mt-1 text-xs text-zinc-500">Fixture cases only</div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="text-lg font-semibold text-white mb-2">Module Ownership Notice</h2>
          <p className="text-sm text-zinc-400">
            This dashboard shell is owned by{" "}
            <strong className="text-indigo-400">Member 3 (Frontend / Product UI)</strong>. Data is
            currently backed by shared contracts in{" "}
            <code className="text-xs bg-zinc-800 px-1 py-0.5 rounded">types/contracts.ts</code> and
            fixtures in <code className="text-xs bg-zinc-800 px-1 py-0.5 rounded">mocks/</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
