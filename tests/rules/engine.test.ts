import { evaluateExpenseCase, evaluateOperator, generateNextAction } from "../../lib/rules/engine";
import mockRules from "../../mocks/policy-rules.json";
import approvedCase from "../../mocks/approved-case.json";
import approvalRequiredCase from "../../mocks/approval-required-case.json";
import multipleViolationsCase from "../../mocks/multiple-violations.json";
import { PolicyRule, ExpenseCase } from "../../types/contracts";
import { runChunkerVerification } from "./chunker.test";

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

  // Test 4: Hotel Rate Cap Violation (EXP-004 > 25,000 -> REJECTED)
  const hotelViolationCase: ExpenseCase = {
    employeeName: "Farhan Ali",
    category: "Lodging",
    amount: 32000,
    hotelNightlyRate: 32000,
    hotelNights: 1,
    receipt: true,
    managerApproval: true,
    financeApproval: false,
    internationalTravel: false,
    preApproval: false,
    expenseDate: "2026-10-01",
    submissionDate: "2026-10-05",
  };
  const resultHotel = evaluateExpenseCase(hotelViolationCase, rules);
  console.log("Test 4 (EXP-004 Hotel Cap): Status =", resultHotel.status, "Violations =", resultHotel.violations.length);
  if (resultHotel.status !== "REJECTED" || !resultHotel.violations.some(v => v.ruleId === "EXP-004")) {
    throw new Error(`Test 4 Failed: Expected REJECTED with EXP-004 violation, got ${resultHotel.status}`);
  }

  // Test 5: Hotel Rate Exact Cap Boundary (PKR 25,000 is allowed)
  const hotelBoundaryCase: ExpenseCase = {
    ...hotelViolationCase,
    amount: 25000,
    hotelNightlyRate: 25000,
  };
  const resultHotelBoundary = evaluateExpenseCase(hotelBoundaryCase, rules);
  console.log("Test 5 (EXP-004 Hotel Boundary PKR 25k): Status =", resultHotelBoundary.status);
  if (resultHotelBoundary.status !== "APPROVED" || resultHotelBoundary.violations.length !== 0) {
    throw new Error(`Test 5 Failed: Expected APPROVED for rate == 25,000, got ${resultHotelBoundary.status}`);
  }

  // Test 6: Late Submission Violation (EXP-005 > 14 days -> REJECTED)
  const lateSubmissionCase: ExpenseCase = {
    employeeName: "Sarah Khan",
    category: "Meals",
    amount: 4000,
    receipt: false,
    managerApproval: false,
    financeApproval: false,
    internationalTravel: false,
    preApproval: false,
    expenseDate: "2026-09-01",
    submissionDate: "2026-09-20", // 19 days delta > 14
  };
  const resultLate = evaluateExpenseCase(lateSubmissionCase, rules);
  console.log("Test 6 (EXP-005 Late Submission): Status =", resultLate.status, "Violations =", resultLate.violations.length);
  if (resultLate.status !== "REJECTED" || !resultLate.violations.some(v => v.ruleId === "EXP-005")) {
    throw new Error(`Test 6 Failed: Expected REJECTED with EXP-005 violation, got ${resultLate.status}`);
  }

  // Test 7: Submission Exactly 14 Days Boundary (14 days is compliant)
  const exact14DaysCase: ExpenseCase = {
    ...lateSubmissionCase,
    submissionDate: "2026-09-15", // exactly 14 days
  };
  const result14Days = evaluateExpenseCase(exact14DaysCase, rules);
  console.log("Test 7 (EXP-005 Exact 14-day Boundary): Status =", result14Days.status);
  if (result14Days.status !== "APPROVED" || result14Days.violations.length !== 0) {
    throw new Error(`Test 7 Failed: Expected APPROVED for delta == 14 days, got ${result14Days.status}`);
  }

  // Test 8: International Travel Without Pre-Approval (EXP-006)
  const intlTravelCase: ExpenseCase = {
    employeeName: "Bilal Tariq",
    category: "Travel",
    amount: 45000,
    receipt: true,
    managerApproval: false,
    financeApproval: false,
    internationalTravel: true,
    preApproval: false,
    expenseDate: "2026-10-01",
    submissionDate: "2026-10-05",
  };
  const resultIntl = evaluateExpenseCase(intlTravelCase, rules);
  console.log("Test 8 (EXP-006 International Travel): Status =", resultIntl.status, "Violations =", resultIntl.violations.length);
  if (resultIntl.status !== "ACTION_REQUIRED" || !resultIntl.violations.some(v => v.ruleId === "EXP-006")) {
    throw new Error(`Test 8 Failed: Expected ACTION_REQUIRED with EXP-006, got ${resultIntl.status}`);
  }

  // Test 9: Operator Evaluation Helper
  if (
    !evaluateOperator(10, ">", 5) ||
    evaluateOperator(5, ">", 10) ||
    !evaluateOperator(5, "<=", 5) ||
    !evaluateOperator("active", "==", "active") ||
    !evaluateOperator(true, "!=", false)
  ) {
    throw new Error("Test 9 Failed: evaluateOperator logic error");
  }
  console.log("Test 9 (Operator Evaluation): Passed");

  // Test 10: Next Action Generation
  const actionApproved = generateNextAction(resultApproved, approvedCase);
  if (!actionApproved.action.includes("Process payment")) {
    throw new Error("Test 10 Failed: Expected disbursement action for approved case");
  }
  const actionRejected = generateNextAction(resultHotel, hotelViolationCase);
  if (!actionRejected.action.includes("rejection")) {
    throw new Error("Test 10 Failed: Expected rejection action for hotel cap violation");
  }
  const actionRequired = generateNextAction(resultApprovalReq, approvalRequiredCase);
  if (!actionRequired.action.includes("Request required approvals")) {
    throw new Error("Test 10 Failed: Expected approval request action");
  }
  console.log("Test 10 (Next Action Generation): Passed");

  console.log("✅ All deterministic rule engine tests (all 6 rules + boundary checks) passed successfully!");

  // Run chunker tests
  runChunkerVerification();

  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runRulesVerification();
}
