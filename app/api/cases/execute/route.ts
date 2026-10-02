import { notImplemented } from "@/lib/api/not-implemented";

/**
 * POST /api/cases/execute
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Scaffold only — returns HTTP 501 until the full six-rule evaluator is complete.
 * Local evaluation: import evaluateExpenseCase from lib/rules/engine and fixtures from /mocks.
 * Do not call this API for demo evaluation until Member 1 integrates the completed Member 2 evaluator.
 */
export async function POST(request: Request) {
  void request;
  return notImplemented("POST /api/cases/execute", "Member 1 (Platform / Backend)");
}
