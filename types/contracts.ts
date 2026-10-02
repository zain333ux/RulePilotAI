/**
 * RulePilot AI - Shared Data Contracts
 * 
 * CRITICAL: These interfaces represent the frozen contract between all 4 team members
 * and subsystems (AI Engine, Rule Engine, Visual Workflow, and Platform APIs).
 * Do NOT modify these contracts without explicit coordination across team members.
 */

export interface Citation {
  page: number;
  section?: string;
  text: string;
}

export type RuleOperator =
  | ">"
  | "<"
  | ">="
  | "<="
  | "=="
  | "!=";

export interface PolicyRule {
  id: string;
  name: string;
  field: string;
  operator: RuleOperator;
  value: string | number | boolean;
  action: string;
  citation: Citation;
}

export type WorkflowNodeType =
  | "start"
  | "condition"
  | "action"
  | "approval"
  | "end";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  ruleId?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExpenseCase {
  employeeName: string;
  category: string;
  amount: number;

  receipt: boolean;
  managerApproval: boolean;
  financeApproval: boolean;

  internationalTravel: boolean;
  preApproval: boolean;

  expenseDate: string;
  submissionDate: string;
}

export interface RuleViolation {
  ruleId: string;
  message: string;
  action: string;
  citation: Citation;
}

export type CaseStatus =
  | "APPROVED"
  | "ACTION_REQUIRED"
  | "REJECTED";

export interface CaseResult {
  status: CaseStatus;
  violations: RuleViolation[];
}

// Agent timeline execution states
export type AgentStepStatus = "waiting" | "running" | "completed" | "failed";

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  status: AgentStepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Document record metadata
export interface PolicyDocument {
  id: string;
  name: string;
  fileUrl?: string;
  status: "uploaded" | "processing" | "processed" | "failed";
  pageCount?: number;
  createdAt: string;
}
