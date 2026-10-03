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
import { ExpenseCase, PolicyRule, CaseResult, RuleViolation, RuleOperator, CaseStatus } from "@/types/contracts";

/**
 * Compare two values strictly according to RuleOperator.
 * Avoids JavaScript loose coercion.
 */
export function evaluateOperator(
  left: number | string | boolean,
  operator: RuleOperator,
  right: number | string | boolean
): boolean {
  switch (operator) {
    case ">":
      return typeof left === "number" && typeof right === "number" && left > right;
    case "<":
      return typeof left === "number" && typeof right === "number" && left < right;
    case ">=":
      return typeof left === "number" && typeof right === "number" && left >= right;
    case "<=":
      return typeof left === "number" && typeof right === "number" && left <= right;
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    default:
      return false;
  }
}

/**
 * Calculate difference in calendar days between two ISO date strings (endDate - startDate).
 */
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NaN;
  }
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates an ExpenseCase deterministically against an array of PolicyRule items.
 *
 * Status precedence:
 * - 0 violations => "APPROVED"
 * - Any hard cap (EXP-004) or deadline (EXP-005) violation => "REJECTED"
 * - Missing approvals / documentation (EXP-001, EXP-002, EXP-003, EXP-006) => "ACTION_REQUIRED"
 */
export function evaluateExpenseCase(
  expenseCase: ExpenseCase,
  rules: PolicyRule[]
): CaseResult {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    // Check EXP-001: Receipt requirement (amount > 5,000 requires receipt)
    if (rule.id === "EXP-001" && rule.field === "amount") {
      const threshold = Number(rule.value);
      if (evaluateOperator(expenseCase.amount, rule.operator, threshold) && !expenseCase.receipt) {
        violations.push({
          ruleId: rule.id,
          message: `Receipt is mandatory for expenses exceeding PKR ${threshold.toLocaleString()}.`,
          action: "Submit itemized merchant receipt.",
          citation: rule.citation,
        });
      }
    }

    // Check EXP-002: Manager approval requirement (amount > 50,000 requires managerApproval)
    if (rule.id === "EXP-002" && rule.field === "amount") {
      const threshold = Number(rule.value);
      if (evaluateOperator(expenseCase.amount, rule.operator, threshold) && !expenseCase.managerApproval) {
        violations.push({
          ruleId: rule.id,
          message: `Department manager approval required for claims exceeding PKR ${threshold.toLocaleString()}.`,
          action: "Request manager sign-off.",
          citation: rule.citation,
        });
      }
    }

    // Check EXP-003: Finance approval requirement (amount > 100,000 requires financeApproval)
    if (rule.id === "EXP-003" && rule.field === "amount") {
      const threshold = Number(rule.value);
      if (evaluateOperator(expenseCase.amount, rule.operator, threshold) && !expenseCase.financeApproval) {
        violations.push({
          ruleId: rule.id,
          message: `Finance executive approval required for claims exceeding PKR ${threshold.toLocaleString()}.`,
          action: "Route to Finance Executive for formal approval.",
          citation: rule.citation,
        });
      }
    }

    // Check EXP-004: Hotel daily rate cap (hotelNightlyRate > 25,000 is a policy violation)
    // ADR-008: hotelNightlyRate is optional; only evaluate when provided. Never derive from amount/nights.
    if (rule.id === "EXP-004" && rule.field === "hotelNightlyRate") {
      if (expenseCase.hotelNightlyRate !== undefined && expenseCase.hotelNightlyRate !== null) {
        const cap = Number(rule.value);
        if (evaluateOperator(expenseCase.hotelNightlyRate, rule.operator, cap)) {
          violations.push({
            ruleId: rule.id,
            message: `Hotel nightly rate of PKR ${expenseCase.hotelNightlyRate.toLocaleString()} exceeds the maximum daily cap of PKR ${cap.toLocaleString()} per night.`,
            action: "Adjust hotel expense to maximum PKR 25,000/night or submit rate exception approval.",
            citation: rule.citation,
          });
        }
      }
    }

    // Check EXP-005: Submission timeliness window (claims must be submitted within 14 calendar days)
    if (rule.id === "EXP-005") {
      if (expenseCase.expenseDate && expenseCase.submissionDate) {
        const days = calculateDaysBetween(expenseCase.expenseDate, expenseCase.submissionDate);
        const maxDays = Number(rule.value);
        if (!isNaN(days) && evaluateOperator(days, rule.operator, maxDays)) {
          violations.push({
            ruleId: rule.id,
            message: `Expense claim submitted ${days} days after expense date, exceeding the ${maxDays}-calendar-day submission limit.`,
            action: "Submit late filing justification or appeal for policy exception.",
            citation: rule.citation,
          });
        }
      }
    }

    // Check EXP-006: International travel pre-approval
    if (rule.id === "EXP-006" && rule.field === "internationalTravel") {
      if (expenseCase.internationalTravel && !expenseCase.preApproval) {
        violations.push({
          ruleId: rule.id,
          message: "International travel expenses require documented vice-presidential pre-approval.",
          action: "Attach approved international travel authorization form.",
          citation: rule.citation,
        });
      }
    }
  }

  // Determine overall status with REJECTED taking precedence over ACTION_REQUIRED
  let status: CaseStatus = "APPROVED";
  if (violations.length > 0) {
    const hasRejection = violations.some(
      v => v.ruleId === "EXP-004" || v.ruleId === "EXP-005"
    );
    status = hasRejection ? "REJECTED" : "ACTION_REQUIRED";
  }

  return {
    status,
    violations,
  };
}

/**
 * Generate action recommendation text and communication template for a CaseResult.
 */
export function generateNextAction(
  caseResult: CaseResult,
  expenseCase?: ExpenseCase
): { action: string; template: string } {
  if (caseResult.status === "APPROVED") {
    return {
      action: "Process payment disbursement",
      template: `Expense claim for ${expenseCase?.employeeName || "employee"} in the amount of PKR ${(expenseCase?.amount || 0).toLocaleString()} complies with all travel and expense policy rules. Approved for automated disbursement.`,
    };
  }

  if (caseResult.status === "REJECTED") {
    const reasons = caseResult.violations.map(v => `• ${v.message}`).join("\n");
    return {
      action: "Issue claim rejection notice",
      template: `Dear ${expenseCase?.employeeName || "Employee"},\n\nYour expense claim of PKR ${(expenseCase?.amount || 0).toLocaleString()} has been rejected due to the following policy violations:\n${reasons}\n\nPlease review the attached policy citations or submit an executive exception appeal.`,
    };
  }

  // ACTION_REQUIRED
  const actions = caseResult.violations.map(v => `• ${v.action} (${v.message})`).join("\n");
  const citations = caseResult.violations
    .map(v => `  [Policy Page ${v.citation.page}${v.citation.section ? `, Section ${v.citation.section}` : ""}: "${v.citation.text}"]`)
    .join("\n");

  return {
    action: "Request required approvals and documentation",
    template: `ACTION REQUIRED: Expense claim for ${expenseCase?.employeeName || "Employee"} (PKR ${(expenseCase?.amount || 0).toLocaleString()}) requires the following actions before processing:\n\n${actions}\n\nSupporting Policy Evidence:\n${citations}`,
  };
}
