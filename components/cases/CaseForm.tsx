"use client";

import { useState } from "react";
import { ExpenseCase } from "@/types/contracts";
import { Button } from "@/components/ui/button";

interface CaseFormProps {
  onSubmit?: (expenseCase: ExpenseCase) => void;
  isLoading?: boolean;
}

export function CaseForm({ onSubmit, isLoading = false }: CaseFormProps) {
  const [formData, setFormData] = useState<ExpenseCase>({
    employeeName: "Sarah Khan",
    category: "Client Entertainment",
    amount: 68000,
    receipt: true,
    managerApproval: false,
    financeApproval: false,
    internationalTravel: false,
    preApproval: false,
    expenseDate: "2026-09-28",
    submissionDate: "2026-10-02",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4"
    >
      <h3 className="text-base font-semibold text-white">Expense Claim Input</h3>
      <p className="text-xs text-amber-400/90">
        Sample fixture defaults — evaluation wiring owned by Member 3 + Member 2. Hotel inputs
        (ADR-008): optional <code className="text-zinc-300">hotelNightlyRate</code> /{" "}
        <code className="text-zinc-300">hotelNights</code>; rule is{" "}
        <code className="text-zinc-300">hotelNightlyRate &gt; 25000</code>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="employeeName" className="block text-xs font-medium text-zinc-400 mb-1">
            Employee Name
          </label>
          <input
            id="employeeName"
            type="text"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={formData.employeeName}
            onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-xs font-medium text-zinc-400 mb-1">
            Expense Category
          </label>
          <input
            id="category"
            type="text"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-xs font-medium text-zinc-400 mb-1">
            Amount (PKR)
          </label>
          <input
            id="amount"
            type="number"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
          />
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2">
          <label htmlFor="receipt" className="inline-flex items-center gap-2 text-xs text-zinc-300">
            <input
              id="receipt"
              type="checkbox"
              checked={formData.receipt}
              onChange={(e) => setFormData({ ...formData, receipt: e.target.checked })}
              className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
            />
            Original Receipt Attached
          </label>

          <label
            htmlFor="managerApproval"
            className="inline-flex items-center gap-2 text-xs text-zinc-300"
          >
            <input
              id="managerApproval"
              type="checkbox"
              checked={formData.managerApproval}
              onChange={(e) => setFormData({ ...formData, managerApproval: e.target.checked })}
              className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
            />
            Manager Approval Attached
          </label>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isLoading || !onSubmit} className="w-full">
          {!onSubmit
            ? "Evaluate unavailable — wire Member 2 engine / API"
            : isLoading
              ? "Evaluating Policy Rules..."
              : "Submit for Rule Evaluation"}
        </Button>
      </div>
    </form>
  );
}
