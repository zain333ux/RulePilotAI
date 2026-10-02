import assert from "node:assert/strict";
import { test } from "node:test";
import { POST as upload } from "../app/api/documents/upload/route";
import { POST as processDocument } from "../app/api/documents/process/route";
import { POST as extract } from "../app/api/rules/extract/route";
import { POST as workflow } from "../app/api/workflows/generate/route";
import { POST as execute } from "../app/api/cases/execute/route";
import { POST as action } from "../app/api/actions/generate/route";

// Prevent scaffolds from claiming that an upload, AI extraction or decision happened.
for (const [name, handler] of Object.entries({ upload, processDocument, extract, workflow, execute, action })) {
  test(`${name} reports unavailable without fabricating success`, async () => {
    const response = await handler(new Request(`http://localhost/api/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: "sample", amount: 4500, caseResult: { status: "APPROVED", violations: [] } }),
    }));
    assert.equal(response.status, 501);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "NOT_IMPLEMENTED");
    assert.equal(typeof body.error, "string");
    assert.equal("caseResult" in body, false);
  });
}
