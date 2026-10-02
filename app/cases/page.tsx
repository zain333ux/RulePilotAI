import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import approvedCase from "@/mocks/approved-case.json";
import approvalRequiredCase from "@/mocks/approval-required-case.json";
import multipleViolationsCase from "@/mocks/multiple-violations.json";

export default function CasesPage() {
  const cases = [
    {
      name: "Approved Case",
      data: approvedCase,
      status: "APPROVED",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    },
    {
      name: "Approval Required",
      data: approvalRequiredCase,
      status: "ACTION_REQUIRED",
      color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    },
    {
      name: "Multiple Violations",
      data: multipleViolationsCase,
      status: "ACTION_REQUIRED",
      color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    },
  ];

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
              Execute Business Case
            </h1>
            <p className="text-sm text-zinc-400">
              Deterministic rule engine evaluation against submitted expense claims.
            </p>
            <p className="mt-2 text-xs text-amber-400/90 font-medium">
              Showing sample fixtures only. POST /api/cases/execute returns 501 until Member 2
              completes the six-rule engine.
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Case evaluation API not implemented yet"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg text-sm font-medium cursor-not-allowed border border-zinc-700"
          >
            Evaluate New Form Case (unavailable)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white text-base">{item.name}</h3>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${item.color}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-400">
                  <p>
                    <span className="text-zinc-500">Employee:</span> {item.data.employeeName}
                  </p>
                  <p>
                    <span className="text-zinc-500">Category:</span> {item.data.category}
                  </p>
                  <p>
                    <span className="text-zinc-500">Amount:</span> PKR{" "}
                    {item.data.amount.toLocaleString()}
                  </p>
                  <p>
                    <span className="text-zinc-500">Receipt Attached:</span>{" "}
                    {item.data.receipt ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="text-zinc-500">Manager Sign-off:</span>{" "}
                    {item.data.managerApproval ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="text-zinc-500">Finance Sign-off:</span>{" "}
                    {item.data.financeApproval ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
                Fixture:{" "}
                <code className="text-zinc-400">
                  mocks/
                  {idx === 0
                    ? "approved-case"
                    : idx === 1
                      ? "approval-required-case"
                      : "multiple-violations"}
                  .json
                </code>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 text-xs text-zinc-500">
          Module ownership: Expense form & result cards are owned by{" "}
          <span className="text-zinc-300">Member 3</span>; Rule evaluation logic in{" "}
          <code className="bg-zinc-800 px-1 py-0.5 rounded">lib/rules/</code> is owned by{" "}
          <span className="text-zinc-300">Member 2</span>.
        </div>
      </div>
    </div>
  );
}
