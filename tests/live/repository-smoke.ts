import {
  getDocumentById,
  updateDocumentProcessingStatus,
} from "../../lib/repositories";
import { readSupabaseUrl, requireEnvironmentVariable } from "../../lib/supabase/config";
import type { PolicyDocument } from "../../types/contracts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readDocumentId(): string {
  const documentId = process.argv[2]?.trim()
    || process.env.RULEPILOT_SMOKE_DOCUMENT_ID?.trim();

  if (!documentId) {
    throw new Error(
      "Missing document ID. Set RULEPILOT_SMOKE_DOCUMENT_ID or pass the UUID after --."
    );
  }
  if (!UUID_PATTERN.test(documentId)) {
    throw new Error("The repository smoke document ID must be a valid UUID.");
  }
  return documentId;
}

function temporaryStatus(
  originalStatus: PolicyDocument["status"]
): PolicyDocument["status"] {
  return originalStatus === "processing" ? "uploaded" : "processing";
}

async function main(): Promise<void> {
  readSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  requireEnvironmentVariable(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const documentId = readDocumentId();

  const original = await getDocumentById(documentId);
  const testStatus = temporaryStatus(original.status);
  let primaryFailure: unknown;

  console.log(`Repository smoke: found ${original.name} with status ${original.status}.`);

  try {
    const updated = await updateDocumentProcessingStatus(documentId, testStatus);
    if (updated.status !== testStatus) {
      throw new Error(`Status update returned ${updated.status}; expected ${testStatus}.`);
    }

    const reread = await getDocumentById(documentId);
    if (reread.status !== testStatus) {
      throw new Error(`Status read-back returned ${reread.status}; expected ${testStatus}.`);
    }

    console.log(`Repository smoke: status changed and read back as ${testStatus}.`);
  } catch (error) {
    primaryFailure = error;
  } finally {
    try {
      await updateDocumentProcessingStatus(documentId, original.status);
      const restored = await getDocumentById(documentId);
      if (restored.status !== original.status) {
        throw new Error(
          `Status restoration returned ${restored.status}; expected ${original.status}.`
        );
      }
      console.log(`Repository smoke: restored original status ${original.status}.`);
    } catch (restoreError) {
      if (primaryFailure) {
        throw new AggregateError(
          [primaryFailure, restoreError],
          "Repository smoke failed and the original document status could not be restored."
        );
      }
      throw restoreError;
    }
  }

  if (primaryFailure) throw primaryFailure;
  console.log("Repository smoke: passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown repository smoke failure.";
  console.error(`Repository smoke: failed. ${message}`);
  process.exitCode = 1;
});
