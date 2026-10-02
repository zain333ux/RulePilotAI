import { NextResponse } from "next/server";

/**
 * Shared 501 response for API scaffolds that are not yet implemented.
 * Members replace these with real handlers inside their ownership boundaries.
 */
export function notImplemented(endpoint: string, owner: string) {
  return NextResponse.json(
    {
      success: false,
      code: "NOT_IMPLEMENTED",
      error: `${endpoint} is not implemented yet.`,
      details: `Owned by ${owner}. Use fixtures in /mocks for parallel development until this endpoint is completed.`,
    },
    { status: 501 }
  );
}
