import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_POLICY_PDF_BYTES,
  handleDocumentUpload,
  type DocumentUploadPersistence,
} from "../../lib/documents/upload";

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

function requestWith(files: File[] = []): Request {
  const formData = new FormData();
  for (const file of files) formData.append("file", file);
  return new Request("http://localhost/api/documents/upload", {
    method: "POST",
    body: formData,
  });
}

function persistence(overrides: Partial<DocumentUploadPersistence> = {}) {
  const calls = { uploaded: [] as string[], inserted: 0, removed: [] as string[] };
  const adapter: DocumentUploadPersistence = {
    async upload(storagePath) {
      calls.uploaded.push(storagePath);
    },
    async insertDocument(input) {
      calls.inserted += 1;
      return {
        id: input.id,
        name: input.name,
        storagePath: input.storagePath,
        status: "uploaded",
        createdAt: "2026-10-03T08:00:00.000Z",
      };
    },
    async remove(storagePath) {
      calls.removed.push(storagePath);
    },
    ...overrides,
  };
  return { adapter, calls };
}

test("rejects a request without a file", async () => {
  const { adapter, calls } = persistence();
  const response = await handleDocumentUpload(requestWith(), () => adapter);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    code: "FILE_REQUIRED",
    error: "Provide exactly one PDF in the file field.",
  });
  assert.equal(calls.uploaded.length, 0);
});

test("rejects non-PDF content", async () => {
  const { adapter, calls } = persistence();
  const file = new File(["plain text"], "policy.txt", { type: "text/plain" });
  const response = await handleDocumentUpload(requestWith([file]), () => adapter);

  assert.equal(response.status, 415);
  assert.equal((await response.json()).code, "UNSUPPORTED_MEDIA_TYPE");
  assert.equal(calls.uploaded.length, 0);
});

test("rejects a PDF above the 4 MiB limit", async () => {
  const { adapter, calls } = persistence();
  const bytes = new Uint8Array(MAX_POLICY_PDF_BYTES + 1);
  bytes.set(PDF_BYTES);
  const file = new File([bytes], "large.pdf", { type: "application/pdf" });
  const response = await handleDocumentUpload(requestWith([file]), () => adapter);

  assert.equal(response.status, 413);
  assert.equal((await response.json()).code, "FILE_TOO_LARGE");
  assert.equal(calls.uploaded.length, 0);
});

test("uploads a valid PDF and returns the shared response contract", async () => {
  const { adapter, calls } = persistence();
  const file = new File([PDF_BYTES], "Travel Policy (Final).PDF", {
    type: "application/pdf",
  });
  const response = await handleDocumentUpload(requestWith([file]), () => adapter, {
    createId: () => "3aef1505-612d-480d-8957-a73b594b52b4",
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    success: true,
    documentId: "3aef1505-612d-480d-8957-a73b594b52b4",
    storagePath: "3aef1505-612d-480d-8957-a73b594b52b4/travel-policy-final.pdf",
    document: {
      id: "3aef1505-612d-480d-8957-a73b594b52b4",
      name: "Travel Policy (Final).PDF",
      status: "uploaded",
      createdAt: "2026-10-03T08:00:00.000Z",
    },
  });
  assert.deepEqual(calls.uploaded, [
    "3aef1505-612d-480d-8957-a73b594b52b4/travel-policy-final.pdf",
  ]);
  assert.equal(calls.inserted, 1);
});

test("removes the stored PDF when the database insert fails", async () => {
  const { adapter, calls } = persistence({
    async insertDocument() {
      throw new Error("database unavailable");
    },
  });
  const file = new File([PDF_BYTES], "policy.pdf", { type: "application/pdf" });
  const response = await handleDocumentUpload(requestWith([file]), () => adapter, {
    createId: () => "3aef1505-612d-480d-8957-a73b594b52b4",
    logger: { error() {} },
  });

  assert.equal(response.status, 500);
  assert.equal((await response.json()).code, "PERSISTENCE_FAILED");
  assert.deepEqual(calls.removed, [
    "3aef1505-612d-480d-8957-a73b594b52b4/policy.pdf",
  ]);
});

test("returns 503 when Supabase configuration cannot be loaded", async () => {
  const file = new File([PDF_BYTES], "policy.pdf", { type: "application/pdf" });
  const response = await handleDocumentUpload(requestWith([file]), () => {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }, { logger: { error() {} } });

  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "SERVICE_UNAVAILABLE");
});
