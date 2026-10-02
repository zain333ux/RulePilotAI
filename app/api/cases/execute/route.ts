import { notImplemented } from "@/lib/api/not-implemented";

/**
 * POST /api/cases/execute
 * Owned by Member 2 (Rule Engine).
 * Scaffold only — returns HTTP 501 until the full six-rule evaluator is complete.
 * Local evaluation: import evaluateExpenseCase from lib/rules/engine and fixtures from /mocks.
 * Do not call this API for demo evaluation until Member 2 marks it implemented.
 */
export async function POST(request: Request) {
  void request;
  return notImplemented("POST /api/cases/execute", "Member 2 (AI / RAG / Rule Engine)");
}
