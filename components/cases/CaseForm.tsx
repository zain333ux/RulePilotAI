"use client";

import { useState } from "react";
import { ExpenseCase } from "@/types/contracts";
import { Activity } from "lucide-react";

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
    managerApproval: true,
    financeApproval: false,
    internationalTravel: false,
    preApproval: false,
    expenseDate: "2026-09-28",
    submissionDate: "2026-10-02",
    hotelNightlyRate: undefined,
    hotelNights: undefined,
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
      className="p-8 rounded-3xl border border-[#2b5a6c]/30 bg-[#0d1b2a]/40 backdrop-blur-md shadow-[0_0_30px_rgba(43,90,108,0.1)] relative overflow-hidden group space-y-8"
    >
      {/* Animated subtle inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4bbabc]/5 via-transparent to-[#9a75d5]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div>
        <h3 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#4bbabc]" /> Expense Claim Input
        </h3>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Fill out the details of the business case. The engine will evaluate this data deterministically against the extracted rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div>
          <label htmlFor="employeeName" className="block text-xs font-semibold text-[#4bbabc] mb-2 uppercase tracking-wider">
            Employee Name
          </label>
          <input
            id="employeeName"
            type="text"
            className="w-full bg-[#0a0f18]/80 border border-[#2b5a6c]/50 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-[#4bbabc] focus:shadow-[0_0_15px_rgba(75,186,188,0.2)] transition-all placeholder-slate-500"
            value={formData.employeeName}
            onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-xs font-semibold text-[#4bbabc] mb-2 uppercase tracking-wider">
            Expense Category
          </label>
          <input
            id="category"
            type="text"
            className="w-full bg-[#0a0f18]/80 border border-[#2b5a6c]/50 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-[#4bbabc] focus:shadow-[0_0_15px_rgba(75,186,188,0.2)] transition-all placeholder-slate-500"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-xs font-semibold text-[#4bbabc] mb-2 uppercase tracking-wider">
            Amount (PKR)
          </label>
          <input
            id="amount"
            type="number"
            className="w-full bg-[#0a0f18]/80 border border-[#2b5a6c]/50 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-[#4bbabc] focus:shadow-[0_0_15px_rgba(75,186,188,0.2)] transition-all placeholder-slate-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expenseDate" className="block text-xs font-semibold text-[#4bbabc] mb-2 uppercase tracking-wider">
              Expense Date
            </label>
            <input
              id="expenseDate"
              type="date"
              className="w-full bg-[#0a0f18]/80 border border-[#2b5a6c]/50 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-[#4bbabc] focus:shadow-[0_0_15px_rgba(75,186,188,0.2)] transition-all"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="submissionDate" className="block text-xs font-semibold text-[#4bbabc] mb-2 uppercase tracking-wider">
              Submit Date
            </label>
            <input
              id="submissionDate"
              type="date"
              className="w-full bg-[#0a0f18]/80 border border-[#2b5a6c]/50 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-[#4bbabc] focus:shadow-[0_0_15px_rgba(75,186,188,0.2)] transition-all"
              value={formData.submissionDate}
              onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="hotelNightlyRate" className="block text-xs font-semibold text-[#4bbabc] mb-2 uppercase tracking-wider">
            Hotel Nightly Rate (Optional)
          </label>
          <input
            id="hotelNightlyRate"
            type="number"
            className="w-full bg-[#0a0f18]/80 border border-[#2b5a6c]/50 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-[#4bbabc] focus:shadow-[0_0_15px_rgba(75,186,188,0.2)] transition-all placeholder-slate-600"
            placeholder="e.g. 25000"
            value={formData.hotelNightlyRate || ""}
            onChange={(e) => setFormData({ ...formData, hotelNightlyRate: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        <div>
          <label htmlFor="hotelNights" className="block text-xs font-semibold text-[#4bbabc] mb-2 uppercase tracking-wider">
            Hotel Nights (Optional)
          </label>
          <input
            id="hotelNights"
            type="number"
            className="w-full bg-[#0a0f18]/80 border border-[#2b5a6c]/50 rounded-xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-[#4bbabc] focus:shadow-[0_0_15px_rgba(75,186,188,0.2)] transition-all placeholder-slate-600"
            placeholder="e.g. 3"
            value={formData.hotelNights || ""}
            onChange={(e) => setFormData({ ...formData, hotelNights: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        <div className="col-span-full pt-4 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
          <label htmlFor="receipt" className="inline-flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input
              id="receipt"
              type="checkbox"
              checked={formData.receipt}
              onChange={(e) => setFormData({ ...formData, receipt: e.target.checked })}
              className="w-5 h-5 rounded border-[#2b5a6c] bg-[#0a0f18] text-[#4bbabc] focus:ring-[#4bbabc] focus:ring-offset-[#0a0f18] cursor-pointer"
            />
            Receipt Attached
          </label>

          <label htmlFor="managerApproval" className="inline-flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input
              id="managerApproval"
              type="checkbox"
              checked={formData.managerApproval}
              onChange={(e) => setFormData({ ...formData, managerApproval: e.target.checked })}
              className="w-5 h-5 rounded border-[#2b5a6c] bg-[#0a0f18] text-[#4bbabc] focus:ring-[#4bbabc] focus:ring-offset-[#0a0f18] cursor-pointer"
            />
            Manager Approval
          </label>
          
          <label htmlFor="financeApproval" className="inline-flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input
              id="financeApproval"
              type="checkbox"
              checked={formData.financeApproval}
              onChange={(e) => setFormData({ ...formData, financeApproval: e.target.checked })}
              className="w-5 h-5 rounded border-[#2b5a6c] bg-[#0a0f18] text-[#4bbabc] focus:ring-[#4bbabc] focus:ring-offset-[#0a0f18] cursor-pointer"
            />
            Finance Approval
          </label>
          
          <label htmlFor="internationalTravel" className="inline-flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input
              id="internationalTravel"
              type="checkbox"
              checked={formData.internationalTravel}
              onChange={(e) => setFormData({ ...formData, internationalTravel: e.target.checked })}
              className="w-5 h-5 rounded border-[#2b5a6c] bg-[#0a0f18] text-[#4bbabc] focus:ring-[#4bbabc] focus:ring-offset-[#0a0f18] cursor-pointer"
            />
            International Travel
          </label>
          
          <label htmlFor="preApproval" className="inline-flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input
              id="preApproval"
              type="checkbox"
              checked={formData.preApproval}
              onChange={(e) => setFormData({ ...formData, preApproval: e.target.checked })}
              className="w-5 h-5 rounded border-[#2b5a6c] bg-[#0a0f18] text-[#4bbabc] focus:ring-[#4bbabc] focus:ring-offset-[#0a0f18] cursor-pointer"
            />
            Pre-Approval
          </label>
        </div>
      </div>

      <div className="pt-6 relative z-10 border-t border-[#2b5a6c]/30 mt-8">
        <button 
          type="submit" 
          disabled={isLoading || !onSubmit} 
          className="group/btn relative w-full flex justify-center items-center gap-2 px-8 py-4 rounded-xl mt-6 bg-gradient-to-r from-[#4bbabc] to-[#9a75d5] text-white text-base font-bold tracking-wide shadow-[0_0_20px_rgba(154,117,213,0.3)] hover:shadow-[0_0_35px_rgba(154,117,213,0.6)] transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-white/20 -translate-x-[120%] group-hover/btn:translate-x-[120%] transition-transform duration-700 ease-in-out skew-x-12" />
          <span className="relative z-10 flex items-center gap-2">
            {isLoading
                ? "Evaluating Deterministically..."
                : "Submit for Rule Evaluation"}
          </span>
        </button>
      </div>
    </form>
  );
}
