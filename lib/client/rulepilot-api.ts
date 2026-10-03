import {
  UploadResponse,
  ProcessResponse,
  ExtractRulesResponse,
  GenerateWorkflowResponse,
  ExecuteCaseResponse,
  GenerateActionResponse,
  ApiError
} from "@/types/api";
import { ExpenseCase } from "@/types/contracts";
import { RulePilotClientError } from "./error";

async function fetchApi<T>(url: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error("Network error");
  }

  const data = await response.json();

  if (!response.ok || (data && typeof data === "object" && data.success === false)) {
    const apiError = data as ApiError;
    throw new RulePilotClientError(
      apiError.error || response.statusText || "Unknown error",
      apiError.code || response.status.toString(),
      apiError.details
    );
  }

  return data as T;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchApi<UploadResponse>("/api/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export async function processDocument(documentId: string): Promise<ProcessResponse> {
  return fetchApi<ProcessResponse>("/api/documents/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });
}

export async function extractRules(documentId: string): Promise<ExtractRulesResponse> {
  return fetchApi<ExtractRulesResponse>("/api/rules/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });
}

export async function generateWorkflow(documentId: string): Promise<GenerateWorkflowResponse> {
  return fetchApi<GenerateWorkflowResponse>("/api/workflows/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });
}

export async function executeCase(workflowId: string, expenseCase: ExpenseCase): Promise<ExecuteCaseResponse> {
  return fetchApi<ExecuteCaseResponse>("/api/cases/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflowId, expenseCase }),
  });
}

export async function generateAction(caseId: string): Promise<GenerateActionResponse> {
  return fetchApi<GenerateActionResponse>("/api/actions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId }),
  });
}
export const api = {
  documents: {
    upload: uploadDocument,
    process: processDocument,
  },
  rules: {
    extract: extractRules,
  },
  workflows: {
    generate: generateWorkflow,
  },
  cases: {
    execute: executeCase,
  },
  actions: {
    generate: generateAction,
  }
};
