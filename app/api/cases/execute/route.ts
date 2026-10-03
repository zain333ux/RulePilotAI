import { handleExecuteCase } from "@/lib/cases/execute";
import {
  createCase,
  getPolicyRulesByDocumentId,
  getWorkflowById,
  saveCaseResult,
} from "@/lib/repositories";

export const runtime = "nodejs";

/**
 * POST /api/cases/execute
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Loads authoritative persisted rules, evaluates through Member 2's engine,
 * and persists both the case and its result.
 */
export async function POST(request: Request) {
  return handleExecuteCase(request, {
    getWorkflowById,
    getPolicyRulesByDocumentId,
    createCase,
    saveCaseResult,
  });
}
