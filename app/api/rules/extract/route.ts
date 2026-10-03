import { extractPolicyRulesFromPages } from "@/lib/ai/gemini";
import { extractPdfPages } from "@/lib/rag/pdf-parser";
import { getDocumentById, replacePolicyRules } from "@/lib/repositories";
import { handleExtractRules } from "@/lib/rules/extract-document";
import { downloadPolicyPdf } from "@/lib/supabase/policy-storage";

export const runtime = "nodejs";

/**
 * POST /api/rules/extract
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Re-reads source pages for strict citation grounding and atomically replaces
 * persisted policy rules only after successful extraction.
 */
export async function POST(request: Request) {
  return handleExtractRules(request, {
    getDocumentById,
    downloadPolicyPdf,
    extractPdfPages,
    extractPolicyRulesFromPages,
    replacePolicyRules,
  });
}
