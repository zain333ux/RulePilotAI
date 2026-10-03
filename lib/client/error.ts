import { ApiError } from "@/types/api";

export class RulePilotClientError extends Error {
  public code: string;
  public details?: string;

  constructor(message: string, code: string = "UNKNOWN_ERROR", details?: string) {
    super(message);
    this.name = "RulePilotClientError";
    this.code = code;
    this.details = details;
  }
}

export function normalizeApiError(error: unknown, defaultMessage = "RulePilot is temporarily unavailable. Please try again."): string {
  if (error instanceof RulePilotClientError) {
    // Convert known backend code/errors into customer-friendly UI text
    if (error.code === "503" || error.message.includes("503")) {
      return "Policy analysis is temporarily unavailable due to high demand. Please try again.";
    }
    if (error.code === "DOCUMENT_UNREADABLE") {
      return "We couldn't read this policy document. Please ensure it's a valid PDF.";
    }
    if (error.code === "EXTRACTION_FAILED") {
      return "We couldn't finish analyzing this document.";
    }
    if (error.code === "EVALUATION_FAILED") {
      return "Case evaluation could not be completed.";
    }
    // Fallback to the provided safe error message from the backend if it's deemed customer-friendly, 
    // or just return the default. (For this product, we prefer sanitized messages).
    return error.message || defaultMessage;
  }

  if (error instanceof Error) {
    // Handle standard JS errors (e.g., fetch failed)
    if (error.message.includes("fetch") || error.message.includes("Network")) {
      return "Network error. Please check your connection and try again.";
    }
    // Avoid showing raw stack traces or internal errors
    return defaultMessage;
  }

  return defaultMessage;
}
