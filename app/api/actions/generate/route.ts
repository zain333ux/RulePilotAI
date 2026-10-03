import { handleGenerateAction } from "@/lib/actions/generate";
import { getCaseById, getCaseResultByCaseId } from "@/lib/repositories";

export const runtime = "nodejs";

/**
 * POST /api/actions/generate
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Loads the authoritative stored case and result, then uses Member 2's
 * deterministic action generator. Webhook delivery remains disabled.
 */
export async function POST(request: Request) {
  return handleGenerateAction(request, { getCaseById, getCaseResultByCaseId });
}
