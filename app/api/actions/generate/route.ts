import { notImplemented } from "@/lib/api/not-implemented";

/**
 * POST /api/actions/generate
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Scaffold only — returns HTTP 501 until action templates + optional webhook are wired.
 */
export async function POST(request: Request) {
  void request;
  return notImplemented("POST /api/actions/generate", "Member 1 (Platform / Backend)");
}
