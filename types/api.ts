/** Shared HTTP envelopes. Domain interfaces remain in contracts.ts. See ADR-010. */
import type { CaseResult, ExpenseCase, PolicyDocument, PolicyRule, WorkflowDefinition } from "./contracts";

export interface ApiError {
  success: false;
  code: string;
  error: string;
  details?: string;
}

/** Upload request is FormData with one PDF named `file`. */
export interface UploadResponse {
  success: true;
  documentId: string;
  storagePath: string;
  document: PolicyDocument;
}

export interface DocumentRequest { documentId: string }
export interface ProcessResponse extends DocumentRequest {
  success: true;
  status: "processed";
  pageCount: number;
  chunkCount: number;
}
export interface ExtractRulesResponse extends DocumentRequest {
  success: true;
  rules: PolicyRule[];
}
export interface GenerateWorkflowResponse extends DocumentRequest {
  success: true;
  workflowId: string;
  workflow: WorkflowDefinition;
}
export interface ExecuteCaseRequest {
  workflowId: string;
  expenseCase: ExpenseCase;
}
export interface ExecuteCaseResponse {
  success: true;
  caseId: string;
  caseResult: CaseResult;
}
export interface GenerateActionRequest { caseId: string }
export interface GenerateActionResponse {
  success: true;
  caseId: string;
  action: string;
  template: string;
  webhookTriggered: boolean;
}
