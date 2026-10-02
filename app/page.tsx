import Link from "next/link";
import { ArrowRight, FileText, GitBranch, Layers, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            RP
          </div>
          <span className="font-semibold text-lg tracking-tight">RulePilot AI</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            MVP Setup
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/policies/upload"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Upload Policy
          </Link>
          <Link
            href="/workflows"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Workflows
          </Link>
          <Link
            href="/cases"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Execute Case
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Hackathon MVP Foundation Ready
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Turn company rules into <span className="text-indigo-400">actionable execution</span>.
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg">
            Upload policy PDFs, extract structured rules with Gemini, generate visual workflows, and deterministically evaluate business cases with exact grounded citations.
          </p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              Enter Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/policies/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-all border border-zinc-700"
            >
              <FileText className="w-4 h-4" /> Upload Policy
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-16">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="text-indigo-400 font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Member 1: Platform
            </div>
            <p className="text-xs text-zinc-400">
              Supabase, storage buckets, Next.js API routes, persistence, and Vercel deployment.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="text-emerald-400 font-semibold text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Member 2: AI Engine
            </div>
            <p className="text-xs text-zinc-400">
              Gemini structured extraction, pgvector RAG citations, and deterministic rule evaluation.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="text-sky-400 font-semibold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Member 3: Product UI
            </div>
            <p className="text-xs text-zinc-400">
              App shell, policy cards, upload UX, expense case form, and decision screens.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="text-amber-400 font-semibold text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Member 4: Workflow UX
            </div>
            <p className="text-xs text-zinc-400">
              React Flow graph rendering, agent execution timeline, action triggers, and QA.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        RulePilot AI · Hackathon Foundation
      </footer>
    </div>
  );
}
