import { evaluateExpenseCase } from "../../lib/rules/engine";
import mockRules from "../../mocks/policy-rules.json";
import approvedCase from "../../mocks/approved-case.json";
import approvalRequiredCase from "../../mocks/approval-required-case.json";
import multipleViolationsCase from "../../mocks/multiple-violations.json";
import { PolicyRule } from "../../types/contracts";

const rules = mockRules as PolicyRule[];

export function runRulesVerification() {
  console.log("=== Testing Deterministic Rule Engine ===");

  // Test 1: Approved Case
  const resultApproved = evaluateExpenseCase(approvedCase, rules);
  console.log("Test 1 (Approved Case): Status =", resultApproved.status, "Violations =", resultApproved.violations.length);
  if (resultApproved.status !== "APPROVED" || resultApproved.violations.length !== 0) {
    throw new Error(`Test 1 Failed: Expected APPROVED with 0 violations, got ${resultApproved.status}`);
  }

  // Test 2: Approval Required Case (PKR 68,000)
  const resultApprovalReq = evaluateExpenseCase(approvalRequiredCase, rules);
  console.log("Test 2 (Approval Required): Status =", resultApprovalReq.status, "Violations =", resultApprovalReq.violations.length);
  if (resultApprovalReq.status !== "ACTION_REQUIRED" || resultApprovalReq.violations.length !== 1) {
    throw new Error(`Test 2 Failed: Expected ACTION_REQUIRED with 1 violation, got ${resultApprovalReq.status}`);
  }
  if (resultApprovalReq.violations[0].ruleId !== "EXP-002") {
    throw new Error(`Test 2 Failed: Expected violation EXP-002, got ${resultApprovalReq.violations[0].ruleId}`);
  }

  // Test 3: Multiple Violations (PKR 120,000, no receipt, no manager, no finance)
  const resultMultiple = evaluateExpenseCase(multipleViolationsCase, rules);
  console.log("Test 3 (Multiple Violations): Status =", resultMultiple.status, "Violations =", resultMultiple.violations.length);
  if (resultMultiple.status !== "ACTION_REQUIRED" || resultMultiple.violations.length !== 3) {
    throw new Error(`Test 3 Failed: Expected ACTION_REQUIRED with 3 violations, got ${resultMultiple.violations.length}`);
  }

  console.log("✅ All deterministic rule engine tests passed successfully!");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runRulesVerification();
}
