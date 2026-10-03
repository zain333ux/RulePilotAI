import { handleProcessDocument } from "@/lib/documents/process";
import { processPolicyPdf } from "@/lib/rag/processor";
import { getDocumentById, replaceDocumentChunks, updateDocumentProcessingStatus } from "@/lib/repositories";
import { downloadPolicyPdf } from "@/lib/supabase/policy-storage";

export const runtime = "nodejs";

/**
 * POST /api/documents/process
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Downloads the persisted private PDF, runs Member 2's processor, and atomically
 * replaces page-aware chunks while maintaining the document processing status.
 */
export async function POST(request: Request) {
  return handleProcessDocument(request, {
    getDocumentById,
    updateDocumentProcessingStatus,
    downloadPolicyPdf,
    processPolicyPdf,
    replaceDocumentChunks,
  });
}
