import { notImplemented } from "@/lib/api/not-implemented";

/**
 * POST /api/workflows/generate
 * Owned by Member 1 (HTTP routes); domain libraries keep their documented owners.
 * Scaffold only — returns HTTP 501 until workflow generation exists.
 * Use mocks/workflow.json for React Flow development.
 */
export async function POST(request: Request) {
  void request;
  return notImplemented("POST /api/workflows/generate", "Member 1 (Platform / Backend)");
}
