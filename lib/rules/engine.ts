/**
 * Deterministic Rule Evaluation Engine
 * Owned by Member 2 (AI / RAG / Rule Engine).
 *
 * CORE PRINCIPLE:
 * The LLM extracts and interprets natural language policy into structured PolicyRule[].
 * This deterministic TypeScript code evaluates business cases against those rules.
 *
 * PARTIAL PROTOTYPE STATUS (setup phase):
 * - Implemented today: EXP-001, EXP-002, EXP-003, EXP-006
 * - NOT yet implemented: EXP-004 (hotel nightly cap), EXP-005 (14-day submission window)
 *
 * EXP-004 (ADR-008 FROZEN): ExpenseCase.hotelNightlyRate?: number; hotelNights?: number.
 * Evaluate: if hotelNightlyRate is defined and hotelNightlyRate > 25000 → violate.
 * PolicyRule.field = "hotelNightlyRate". Never derive rate from amount/nights; never assume 1 night.
 * When hotelNightlyRate is omitted, skip EXP-004.
 *
 * EXP-005: Member 2 should compute calendar-day delta from expenseDate → submissionDate
 * and compare against rule.value (14). Keep disconnected from API scaffolds until complete.
 *
 * API routes currently return HTTP 501. Tests exercise only this partial prototype.
 * UI uses mocks/case-results.json until Member 1 integrates the completed evaluator.
 */
import { ExpenseCase, PolicyRule, CaseResult, RuleViolation } from "@/types/contracts";

export function evaluateExpenseCase(
  expenseCase: ExpenseCase,
  rules: PolicyRule[]
): CaseResult {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    // Check EXP-001: Receipt requirement
    if (rule.id === "EXP-001" && rule.field === "amount") {
      const threshold = Number(rule.value);
      if (expenseCase.amount > threshold && !expenseCase.receipt) {
        violations.push({
          ruleId: rule.id,
          message: `Receipt is mandatory for expenses exceeding PKR ${threshold.toLocaleString()}.`,
          action: "Submit itemized merchant receipt.",
          citation: rule.citation,
        });
      }
    }

    // Check EXP-002: Manager approval requirement
    if (rule.id === "EXP-002" && rule.field === "amount") {
      const threshold = Number(rule.value);
      if (expenseCase.amount > threshold && !expenseCase.managerApproval) {
        violations.push({
          ruleId: rule.id,
          message: `Department manager approval required for claims exceeding PKR ${threshold.toLocaleString()}.`,
          action: "Request manager sign-off.",
          citation: rule.citation,
        });
      }
    }

    // Check EXP-003: Finance approval requirement
    if (rule.id === "EXP-003" && rule.field === "amount") {
      const threshold = Number(rule.value);
      if (expenseCase.amount > threshold && !expenseCase.financeApproval) {
        violations.push({
          ruleId: rule.id,
          message: `Finance executive approval required for claims exceeding PKR ${threshold.toLocaleString()}.`,
          action: "Route to Finance Executive for formal approval.",
          citation: rule.citation,
        });
      }
    }

    // Check EXP-006: International travel pre-approval
    if (rule.id === "EXP-006") {
      if (expenseCase.internationalTravel && !expenseCase.preApproval) {
        violations.push({
          ruleId: rule.id,
          message: "International travel requires prior documented approval.",
          action: "Attach approved international travel authorization form.",
          citation: rule.citation,
        });
      }
    }
  }

  return {
    status: violations.length === 0 ? "APPROVED" : "ACTION_REQUIRED",
    violations,
  };
}
