import "server-only";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { PolicyDocument, PolicyRule } from "@/types/contracts";
import {
  createRepositoryStore,
  type CreateCaseInput,
  type CreateDocumentInput,
  type DocumentChunkInput,
  type SaveCaseResultInput,
  type SaveWorkflowInput,
} from "./repositories";

export {
  RepositoryError,
  RepositoryNotFoundError,
} from "./repositories";
export type {
  CaseRecord,
  CaseResultRecord,
  CreateCaseInput,
  CreateDocumentInput,
  DocumentChunkInput,
  DocumentChunkRecord,
  DocumentRecord,
  SaveCaseResultInput,
  SaveWorkflowInput,
  StoredCaseStatus,
  WorkflowRecord,
} from "./repositories";

function repositories() {
  return createRepositoryStore(getAdminSupabase());
}

export const createDocument = (input: CreateDocumentInput) =>
  repositories().createDocument(input);
export const getDocumentById = (id: string) =>
  repositories().getDocumentById(id);
export const updateDocumentProcessingStatus = (
  id: string,
  status: PolicyDocument["status"],
  pageCount?: number
) => repositories().updateDocumentProcessingStatus(id, status, pageCount);

export const insertDocumentChunks = (documentId: string, chunks: DocumentChunkInput[]) =>
  repositories().insertDocumentChunks(documentId, chunks);
export const getDocumentChunksByDocumentId = (documentId: string) =>
  repositories().getDocumentChunksByDocumentId(documentId);
export const replaceDocumentChunks = (documentId: string, chunks: DocumentChunkInput[]) =>
  repositories().replaceDocumentChunks(documentId, chunks);
export const deleteDocumentChunksByDocumentId = (documentId: string) =>
  repositories().deleteDocumentChunksByDocumentId(documentId);

export const replacePolicyRules = (
  documentId: string,
  rules: PolicyRule[]
) => repositories().replacePolicyRules(documentId, rules);
export const getPolicyRulesByDocumentId = (documentId: string) =>
  repositories().getPolicyRulesByDocumentId(documentId);

export const saveWorkflow = (input: SaveWorkflowInput) =>
  repositories().saveWorkflow(input);
export const getWorkflowByDocumentId = (documentId: string) =>
  repositories().getWorkflowByDocumentId(documentId);
export const getWorkflowById = (id: string) =>
  repositories().getWorkflowById(id);

export const createCase = (input: CreateCaseInput) =>
  repositories().createCase(input);
export const getCaseById = (id: string) =>
  repositories().getCaseById(id);

export const saveCaseResult = (input: SaveCaseResultInput) =>
  repositories().saveCaseResult(input);
export const getCaseResultByCaseId = (caseId: string) =>
  repositories().getCaseResultByCaseId(caseId);
