import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CaseResult,
  CaseStatus,
  ExpenseCase,
  PolicyDocument,
  PolicyRule,
  WorkflowDefinition,
} from "@/types/contracts";

export class RepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RepositoryError";
  }
}

export class RepositoryNotFoundError extends RepositoryError {
  constructor(readonly entity: string, readonly id: string) {
    super(`${entity} was not found.`);
    this.name = "RepositoryNotFoundError";
  }
}

export interface CreateDocumentInput {
  id?: string;
  name: string;
  storagePath?: string;
  fileUrl?: string;
  status?: PolicyDocument["status"];
}

export interface DocumentRecord extends PolicyDocument {
  storagePath?: string;
  updatedAt: string;
}

export interface DocumentChunkInput {
  pageNumber: number;
  section?: string;
  content: string;
  embedding?: number[];
}

export interface DocumentChunkRecord extends DocumentChunkInput {
  id: string;
  documentId: string;
  createdAt: string;
}

export interface WorkflowRecord {
  id: string;
  documentId: string;
  name: string;
  workflow: WorkflowDefinition;
  createdAt: string;
}

export interface SaveWorkflowInput {
  documentId: string;
  name: string;
  workflow: WorkflowDefinition;
}

export type StoredCaseStatus = "PENDING" | CaseStatus;

export interface CaseRecord {
  id: string;
  workflowId?: string;
  expenseCase: ExpenseCase;
  status: StoredCaseStatus;
  createdAt: string;
}

export interface CreateCaseInput {
  workflowId?: string;
  expenseCase: ExpenseCase;
  status?: StoredCaseStatus;
}

export interface CaseResultRecord {
  id: string;
  caseId: string;
  result: CaseResult;
  reason?: string;
  evidence: unknown[];
  action?: string;
  createdAt: string;
}

export interface SaveCaseResultInput {
  caseId: string;
  result: CaseResult;
  reason?: string;
  evidence?: unknown[];
  action?: string;
}

interface DocumentRow {
  id: string;
  name: string;
  file_url: string | null;
  storage_path: string | null;
  status: PolicyDocument["status"];
  page_count: number | null;
  created_at: string;
  updated_at: string;
}

interface DocumentChunkRow {
  id: string;
  document_id: string;
  page_number: number;
  section: string | null;
  content: string;
  embedding: number[] | string | null;
  created_at: string;
}

interface PolicyRuleRow {
  rule_code: string;
  rule_name: string;
  field_name: string;
  operator: PolicyRule["operator"];
  value: PolicyRule["value"];
  action: string;
  citation_page: number;
  citation_section: string | null;
  raw_rule_text: string;
}

interface WorkflowRow {
  id: string;
  document_id: string;
  name: string;
  workflow_json: WorkflowDefinition;
  created_at: string;
}

interface CaseRow {
  id: string;
  workflow_id: string | null;
  input_json: ExpenseCase;
  status: StoredCaseStatus;
  created_at: string;
}

interface CaseResultRow {
  id: string;
  case_id: string;
  decision: CaseStatus;
  reason: string | null;
  violations_json: CaseResult["violations"];
  evidence_json: unknown[];
  action: string | null;
  created_at: string;
}

function databaseFailure(message: string, cause: unknown): never {
  throw new RepositoryError(message, { cause });
}

function mapDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    name: row.name,
    ...(row.file_url ? { fileUrl: row.file_url } : {}),
    ...(row.storage_path ? { storagePath: row.storage_path } : {}),
    status: row.status,
    ...(row.page_count === null ? {} : { pageCount: row.page_count }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseEmbedding(value: DocumentChunkRow["embedding"]): number[] | undefined {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "number")
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

function mapChunk(row: DocumentChunkRow): DocumentChunkRecord {
  const embedding = parseEmbedding(row.embedding);
  return {
    id: row.id,
    documentId: row.document_id,
    pageNumber: row.page_number,
    ...(row.section ? { section: row.section } : {}),
    content: row.content,
    ...(embedding ? { embedding } : {}),
    createdAt: row.created_at,
  };
}

function mapRule(row: PolicyRuleRow): PolicyRule {
  return {
    id: row.rule_code,
    name: row.rule_name,
    field: row.field_name,
    operator: row.operator,
    value: row.value,
    action: row.action,
    citation: {
      page: row.citation_page,
      ...(row.citation_section ? { section: row.citation_section } : {}),
      text: row.raw_rule_text,
    },
  };
}

function mapWorkflow(row: WorkflowRow): WorkflowRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    name: row.name,
    workflow: row.workflow_json,
    createdAt: row.created_at,
  };
}

function mapCase(row: CaseRow): CaseRecord {
  return {
    id: row.id,
    ...(row.workflow_id ? { workflowId: row.workflow_id } : {}),
    expenseCase: row.input_json,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapCaseResult(row: CaseResultRow): CaseResultRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    result: { status: row.decision, violations: row.violations_json },
    ...(row.reason ? { reason: row.reason } : {}),
    evidence: row.evidence_json,
    ...(row.action ? { action: row.action } : {}),
    createdAt: row.created_at,
  };
}

export function createRepositoryStore(client: SupabaseClient) {
  async function createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
    const { data, error } = await client
      .from("documents")
      .insert({
        ...(input.id ? { id: input.id } : {}),
        name: input.name,
        storage_path: input.storagePath ?? null,
        file_url: input.fileUrl ?? null,
        status: input.status ?? "uploaded",
      })
      .select("id, name, file_url, storage_path, status, page_count, created_at, updated_at")
      .single();
    if (error || !data) databaseFailure("Could not create document.", error);
    return mapDocument(data as DocumentRow);
  }

  async function getDocumentById(id: string): Promise<DocumentRecord> {
    const { data, error } = await client
      .from("documents")
      .select("id, name, file_url, storage_path, status, page_count, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (error) databaseFailure("Could not read document.", error);
    if (!data) throw new RepositoryNotFoundError("Document", id);
    return mapDocument(data as DocumentRow);
  }

  async function updateDocumentProcessingStatus(
    id: string,
    status: PolicyDocument["status"],
    pageCount?: number
  ): Promise<DocumentRecord> {
    const { data, error } = await client
      .from("documents")
      .update({
        status,
        ...(pageCount === undefined ? {} : { page_count: pageCount }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, name, file_url, storage_path, status, page_count, created_at, updated_at")
      .maybeSingle();
    if (error) databaseFailure("Could not update document status.", error);
    if (!data) throw new RepositoryNotFoundError("Document", id);
    return mapDocument(data as DocumentRow);
  }

  async function insertDocumentChunks(
    documentId: string,
    chunks: DocumentChunkInput[]
  ): Promise<DocumentChunkRecord[]> {
    if (chunks.length === 0) return [];
    const { data, error } = await client
      .from("document_chunks")
      .insert(chunks.map((chunk) => ({
        document_id: documentId,
        page_number: chunk.pageNumber,
        section: chunk.section ?? null,
        content: chunk.content,
        embedding: chunk.embedding ?? null,
      })))
      .select("id, document_id, page_number, section, content, embedding, created_at");
    if (error || !data) databaseFailure("Could not insert document chunks.", error);
    return (data as DocumentChunkRow[]).map(mapChunk);
  }

  async function getDocumentChunksByDocumentId(documentId: string): Promise<DocumentChunkRecord[]> {
    const { data, error } = await client
      .from("document_chunks")
      .select("id, document_id, page_number, section, content, embedding, created_at")
      .eq("document_id", documentId)
      .order("page_number", { ascending: true });
    if (error) databaseFailure("Could not read document chunks.", error);
    return ((data ?? []) as DocumentChunkRow[]).map(mapChunk);
  }

  async function replaceDocumentChunks(
    documentId: string,
    chunks: DocumentChunkInput[]
  ): Promise<DocumentChunkRecord[]> {
    const { data, error } = await client.rpc("replace_document_chunks_atomic", {
      p_document_id: documentId,
      p_chunks: chunks,
    });
    if (error || !data) databaseFailure("Could not replace document chunks.", error);
    return (data as DocumentChunkRow[]).map(mapChunk);
  }

  async function deleteDocumentChunksByDocumentId(documentId: string): Promise<void> {
    const { error } = await client
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);
    if (error) databaseFailure("Could not delete document chunks.", error);
  }

  async function replacePolicyRules(documentId: string, rules: PolicyRule[]): Promise<PolicyRule[]> {
    const { data, error } = await client.rpc("replace_policy_rules_atomic", {
      p_document_id: documentId,
      p_rules: rules,
    });
    if (error || !data) databaseFailure("Could not replace policy rules.", error);
    return (data as PolicyRuleRow[]).map(mapRule);
  }

  async function getPolicyRulesByDocumentId(documentId: string): Promise<PolicyRule[]> {
    const { data, error } = await client
      .from("policy_rules")
      .select("rule_code, rule_name, field_name, operator, value, action, citation_page, citation_section, raw_rule_text")
      .eq("document_id", documentId)
      .order("rule_code", { ascending: true });
    if (error) databaseFailure("Could not read policy rules.", error);
    return ((data ?? []) as PolicyRuleRow[]).map(mapRule);
  }

  async function saveWorkflow(input: SaveWorkflowInput): Promise<WorkflowRecord> {
    const { data, error } = await client
      .from("workflows")
      .insert({
        document_id: input.documentId,
        name: input.name,
        workflow_json: input.workflow,
      })
      .select("id, document_id, name, workflow_json, created_at")
      .single();
    if (error || !data) databaseFailure("Could not save workflow.", error);
    return mapWorkflow(data as WorkflowRow);
  }

  async function getWorkflowByDocumentId(documentId: string): Promise<WorkflowRecord> {
    const { data, error } = await client
      .from("workflows")
      .select("id, document_id, name, workflow_json, created_at")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) databaseFailure("Could not read workflow.", error);
    if (!data) throw new RepositoryNotFoundError("Workflow", documentId);
    return mapWorkflow(data as WorkflowRow);
  }

  async function getWorkflowById(id: string): Promise<WorkflowRecord> {
    const { data, error } = await client
      .from("workflows")
      .select("id, document_id, name, workflow_json, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) databaseFailure("Could not read workflow.", error);
    if (!data) throw new RepositoryNotFoundError("Workflow", id);
    return mapWorkflow(data as WorkflowRow);
  }

  async function createCase(input: CreateCaseInput): Promise<CaseRecord> {
    const { data, error } = await client
      .from("cases")
      .insert({
        workflow_id: input.workflowId ?? null,
        employee_name: input.expenseCase.employeeName,
        category: input.expenseCase.category,
        amount: input.expenseCase.amount,
        input_json: input.expenseCase,
        status: input.status ?? "PENDING",
      })
      .select("id, workflow_id, input_json, status, created_at")
      .single();
    if (error || !data) databaseFailure("Could not create case.", error);
    return mapCase(data as CaseRow);
  }

  async function getCaseById(id: string): Promise<CaseRecord> {
    const { data, error } = await client
      .from("cases")
      .select("id, workflow_id, input_json, status, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) databaseFailure("Could not read case.", error);
    if (!data) throw new RepositoryNotFoundError("Case", id);
    return mapCase(data as CaseRow);
  }

  async function saveCaseResult(input: SaveCaseResultInput): Promise<CaseResultRecord> {
    const { data, error } = await client
      .from("case_results")
      .insert({
        case_id: input.caseId,
        decision: input.result.status,
        reason: input.reason ?? null,
        violations_json: input.result.violations,
        evidence_json: input.evidence ?? [],
        action: input.action ?? null,
      })
      .select("id, case_id, decision, reason, violations_json, evidence_json, action, created_at")
      .single();
    if (error || !data) databaseFailure("Could not save case result.", error);
    return mapCaseResult(data as CaseResultRow);
  }

  async function getCaseResultByCaseId(caseId: string): Promise<CaseResultRecord> {
    const { data, error } = await client
      .from("case_results")
      .select("id, case_id, decision, reason, violations_json, evidence_json, action, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) databaseFailure("Could not read case result.", error);
    if (!data) throw new RepositoryNotFoundError("Case result", caseId);
    return mapCaseResult(data as CaseResultRow);
  }

  return {
    createDocument,
    getDocumentById,
    updateDocumentProcessingStatus,
    insertDocumentChunks,
    getDocumentChunksByDocumentId,
    replaceDocumentChunks,
    deleteDocumentChunksByDocumentId,
    replacePolicyRules,
    getPolicyRulesByDocumentId,
    saveWorkflow,
    getWorkflowByDocumentId,
    getWorkflowById,
    createCase,
    getCaseById,
    saveCaseResult,
    getCaseResultByCaseId,
  };
}

export type RepositoryStore = ReturnType<typeof createRepositoryStore>;
