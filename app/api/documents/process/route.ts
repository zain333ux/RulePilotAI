import { notImplemented } from "@/lib/api/not-implemented";

/**
 * POST /api/documents/process
 * Owned by Member 1 & Member 2 (Platform & AI Engine).
 * Scaffold only — returns HTTP 501 until PDF parse / chunk / embed pipeline exists.
 */
export async function POST(request: Request) {
  void request;
  return notImplemented("POST /api/documents/process", "Member 1 & Member 2");
}
