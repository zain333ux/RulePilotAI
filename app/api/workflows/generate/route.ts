import { getDocumentById, getPolicyRulesByDocumentId, saveWorkflow } from "@/lib/repositories";
import { generateWorkflowFromRules } from "@/lib/rules/workflow";
import { handleGenerateWorkflow } from "@/lib/workflows/generate";

export const runtime = "nodejs";

/**
 * POST /api/workflows/generate
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Loads authoritative persisted rules, generates a deterministic workflow, and
 * persists the shared WorkflowDefinition for Member 4's renderer.
 */
export async function POST(request: Request) {
  return handleGenerateWorkflow(request, {
    getDocumentById,
    getPolicyRulesByDocumentId,
    generateWorkflowFromRules,
    saveWorkflow,
  });
}
