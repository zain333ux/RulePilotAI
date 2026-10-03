import { PolicyRule, WorkflowDefinition, WorkflowNode, WorkflowEdge } from "@/types/contracts";

export class WorkflowGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowGenerationError";
  }
}

/**
 * Format a human-readable condition label from a PolicyRule.
 */
function formatConditionLabel(rule: PolicyRule): string {
  const fieldNames: Record<string, string> = {
    amount: "Amount",
    hotelNightlyRate: "Hotel Nightly Rate",
    expenseDate: "Submission Window",
    submissionDate: "Submission Window",
    internationalTravel: "International Travel",
  };

  const field = fieldNames[rule.field] || rule.field;
  const val = typeof rule.value === "number" ? `PKR ${rule.value.toLocaleString()}` : String(rule.value);

  if (rule.field === "amount" || rule.field === "hotelNightlyRate") {
    return `${field} ${rule.operator} ${val}?`;
  }
  if (rule.field === "internationalTravel") {
    return "International Travel Claim?";
  }
  if (rule.id === "EXP-005") {
    return "Submitted within 14 Calendar Days?";
  }

  return `${rule.name || field} ${rule.operator} ${val}?`;
}

/**
 * Format an action/approval label from a PolicyRule.
 */
function formatActionLabel(rule: PolicyRule, isApproval: boolean): string {
  if (rule.id === "EXP-001") return "Validate Itemized Receipt";
  if (rule.id === "EXP-002") return "Department Manager Approval";
  if (rule.id === "EXP-003") return "Finance Executive Approval";
  if (rule.id === "EXP-004") return "Hotel Rate Cap Exception Approval";
  if (rule.id === "EXP-005") return "Late Submission Justification Review";
  if (rule.id === "EXP-006") return "Vice-Presidential Pre-Approval Verification";

  if (isApproval) {
    return `${rule.name.replace(/Requirement|Threshold/gi, "").trim()} Approval`;
  }

  return rule.name || rule.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Deterministically generates a WorkflowDefinition graph from structured PolicyRule[].
 *
 * Rules:
 * - Pure transformation, deterministic ordering and IDs
 * - One "start" node (node-1)
 * - Pair of (condition, action/approval) nodes for each PolicyRule preserving ruleId
 * - One "end" node (Claim Processing Complete)
 * - Directed edges modeling conditional branching and progression
 * - Rejects duplicate rule IDs explicitly
 * - Handles empty rule lists safely
 * - Zero React Flow UI coords (Member 4 handles layout)
 */
export function generateWorkflowFromRules(
  rules: PolicyRule[]
): WorkflowDefinition {
  if (!Array.isArray(rules) || rules.length === 0) {
    return {
      nodes: [
        { id: "node-1", type: "start", label: "Expense Submitted" },
        { id: "node-2", type: "end", label: "Claim Processing Complete" },
      ],
      edges: [
        { id: "edge-1", source: "node-1", target: "node-2" },
      ],
    };
  }

  // Guard against duplicate rule IDs
  const seenRuleIds = new Set<string>();
  for (const rule of rules) {
    if (seenRuleIds.has(rule.id)) {
      throw new WorkflowGenerationError(`Duplicate rule ID detected: ${rule.id}`);
    }
    seenRuleIds.add(rule.id);
  }

  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  // 1. Start node
  nodes.push({
    id: "node-1",
    type: "start",
    label: "Expense Submitted",
  });

  const totalRules = rules.length;
  const endNodeId = `node-${2 + totalRules * 2}`;

  // 2. Build condition and action/approval nodes for each rule
  for (let i = 0; i < totalRules; i++) {
    const rule = rules[i];
    const condNodeId = `node-${2 + i * 2}`;
    const actionNodeId = `node-${3 + i * 2}`;

    const isApproval =
      /approval|sign-off|approve|manager|finance|vp|vice-presidential/i.test(rule.action) ||
      /approval|sign-off|approve|manager|finance|vp|vice-presidential/i.test(rule.name);

    nodes.push({
      id: condNodeId,
      type: "condition",
      label: formatConditionLabel(rule),
      ruleId: rule.id,
    });

    nodes.push({
      id: actionNodeId,
      type: isApproval ? "approval" : "action",
      label: formatActionLabel(rule, isApproval),
      ruleId: rule.id,
    });
  }

  // 3. End node
  nodes.push({
    id: endNodeId,
    type: "end",
    label: "Claim Processing Complete",
  });

  // 4. Edges
  let edgeIndex = 1;

  // Start -> first condition
  edges.push({
    id: `edge-${edgeIndex++}`,
    source: "node-1",
    target: "node-2",
  });

  for (let i = 0; i < totalRules; i++) {
    const rule = rules[i];
    const condNodeId = `node-${2 + i * 2}`;
    const actionNodeId = `node-${3 + i * 2}`;
    const nextTargetId = i + 1 < totalRules ? `node-${2 + (i + 1) * 2}` : endNodeId;

    const valFormatted =
      typeof rule.value === "number" ? rule.value.toLocaleString() : String(rule.value);

    // Yes edge: condition -> action/approval
    edges.push({
      id: `edge-${edgeIndex++}`,
      source: condNodeId,
      target: actionNodeId,
      label: `Yes (${rule.operator} ${valFormatted})`,
    });

    // No edge: condition -> next step
    edges.push({
      id: `edge-${edgeIndex++}`,
      source: condNodeId,
      target: nextTargetId,
      label: `No (Compliant)`,
    });

    // Progression edge: action/approval -> next step
    edges.push({
      id: `edge-${edgeIndex++}`,
      source: actionNodeId,
      target: nextTargetId,
    });
  }

  return { nodes, edges };
}
