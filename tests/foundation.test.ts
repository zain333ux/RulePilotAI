import assert from "node:assert/strict";
import { test } from "node:test";
import { POST as processDocument } from "../app/api/documents/process/route";
import { POST as extract } from "../app/api/rules/extract/route";
import { POST as workflow } from "../app/api/workflows/generate/route";

// Confirm the former scaffolds now enforce the shared request contract.
for (const [name, handler] of Object.entries({ processDocument, extract, workflow })) {
  test(`${name} rejects a malformed document ID through the real route`, async () => {
    const response = await handler(new Request(`http://localhost/api/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: "sample" }),
    }));
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "INVALID_REQUEST");
    assert.equal(typeof body.error, "string");
  });
}
