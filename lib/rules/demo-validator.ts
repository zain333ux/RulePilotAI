import { PolicyRule } from "@/types/contracts";

export class DemoPolicyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoPolicyValidationError";
  }
}

/**
 * Validates that an array of PolicyRule objects conforms to the agreed
 * semantics of the RulePilot AI corporate travel & expense demo policy.
 *
 * Rules verified:
 * - EXP-001: Receipt required for amount > 5,000
 * - EXP-002: Manager approval required for amount > 50,000
 * - EXP-003: Finance approval required for amount > 100,000
 * - EXP-004: Hotel nightly rate cap at 25,000 (hotelNightlyRate > 25,000)
 * - EXP-005: Expense claim submission within 14 calendar days
 * - EXP-006: International travel requires pre-approval
 *
 * This validator is decoupled from generic AI extraction, ensuring
 * that generic extraction remains usable for arbitrary policies while
 * providing a strict semantic barrier for the hackathon demo policy.
 */
export function validateDemoExpensePolicyRules(rules: PolicyRule[]): PolicyRule[] {
  if (!Array.isArray(rules) || rules.length === 0) {
    throw new DemoPolicyValidationError("Demo policy validation failed: rules array is empty.");
  }

  const ruleMap = new Map<string, PolicyRule>();
  for (const rule of rules) {
    ruleMap.set(rule.id, rule);
  }

  const requiredIds = ["EXP-001", "EXP-002", "EXP-003", "EXP-004", "EXP-005", "EXP-006"];
  const missing = requiredIds.filter(id => !ruleMap.has(id));
  if (missing.length > 0) {
    throw new DemoPolicyValidationError(
      `Demo policy validation failed: missing required demo rules: ${missing.join(", ")}.`
    );
  }

  // 1. EXP-001: Amount > 5,000 requires receipt
  const exp001 = ruleMap.get("EXP-001")!;
  if (exp001.field !== "amount" || exp001.operator !== ">" || Number(exp001.value) !== 5000) {
    throw new DemoPolicyValidationError(
      `EXP-001 semantic mismatch: expected field="amount", operator=">", value=5000; received field="${exp001.field}", operator="${exp001.operator}", value=${exp001.value}.`
    );
  }
  if (!/receipt/i.test(exp001.action) && !/receipt/i.test(exp001.name)) {
    throw new DemoPolicyValidationError(
      `EXP-001 semantic mismatch: rule action or name must reference receipt requirement; received action="${exp001.action}".`
    );
  }

  // 2. EXP-002: Amount > 50,000 requires manager approval
  const exp002 = ruleMap.get("EXP-002")!;
  if (exp002.field !== "amount" || exp002.operator !== ">" || Number(exp002.value) !== 50000) {
    throw new DemoPolicyValidationError(
      `EXP-002 semantic mismatch: expected field="amount", operator=">", value=50000; received field="${exp002.field}", operator="${exp002.operator}", value=${exp002.value}.`
    );
  }
  if (!/manager/i.test(exp002.action) && !/manager/i.test(exp002.name)) {
    throw new DemoPolicyValidationError(
      `EXP-002 semantic mismatch: rule action or name must reference manager approval; received action="${exp002.action}".`
    );
  }

  // 3. EXP-003: Amount > 100,000 requires finance approval
  const exp003 = ruleMap.get("EXP-003")!;
  if (exp003.field !== "amount" || exp003.operator !== ">" || Number(exp003.value) !== 100000) {
    throw new DemoPolicyValidationError(
      `EXP-003 semantic mismatch: expected field="amount", operator=">", value=100000; received field="${exp003.field}", operator="${exp003.operator}", value=${exp003.value}.`
    );
  }
  if (!/finance/i.test(exp003.action) && !/finance/i.test(exp003.name)) {
    throw new DemoPolicyValidationError(
      `EXP-003 semantic mismatch: rule action or name must reference finance approval; received action="${exp003.action}".`
    );
  }

  // 4. EXP-004: Hotel nightly rate cap at 25,000
  const exp004 = ruleMap.get("EXP-004")!;
  if (exp004.field !== "hotelNightlyRate" || exp004.operator !== ">" || Number(exp004.value) !== 25000) {
    throw new DemoPolicyValidationError(
      `EXP-004 semantic mismatch: expected field="hotelNightlyRate", operator=">", value=25000; received field="${exp004.field}", operator="${exp004.operator}", value=${exp004.value}.`
    );
  }

  // 5. EXP-005: Submission delay > 14 days
  const exp005 = ruleMap.get("EXP-005")!;
  const validExp005Fields = ["submissionWindowDays", "submissionDate", "expenseDate"];
  if (!validExp005Fields.includes(exp005.field) || exp005.operator !== ">" || Number(exp005.value) !== 14) {
    throw new DemoPolicyValidationError(
      `EXP-005 semantic mismatch: expected field in [${validExp005Fields.join(", ")}], operator=">", value=14; received field="${exp005.field}", operator="${exp005.operator}", value=${exp005.value}.`
    );
  }

  // 6. EXP-006: International travel requires pre-approval
  const exp006 = ruleMap.get("EXP-006")!;
  if (exp006.field !== "internationalTravel" || (exp006.operator !== "==" && exp006.operator !== "!=")) {
    throw new DemoPolicyValidationError(
      `EXP-006 semantic mismatch: expected field="internationalTravel", operator="=="; received field="${exp006.field}", operator="${exp006.operator}".`
    );
  }
  if (!/pre[-_ ]?approval/i.test(exp006.action) && !/pre[-_ ]?approval/i.test(exp006.name) && !/international/i.test(exp006.action)) {
    throw new DemoPolicyValidationError(
      `EXP-006 semantic mismatch: rule action must reference international pre-approval; received action="${exp006.action}".`
    );
  }

  return rules;
}
