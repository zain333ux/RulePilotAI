import { handleDocumentUpload } from "@/lib/documents/upload";
import { createSupabaseDocumentUploadPersistence } from "@/lib/supabase/document-upload";

export const runtime = "nodejs";

/**
 * POST /api/documents/upload
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Accepts one PDF, stores it privately, and creates its documents row.
 */
export async function POST(request: Request) {
  return handleDocumentUpload(request, createSupabaseDocumentUploadPersistence);
}
