# API contracts

All six routes currently return HTTP 501. No upload, persistence, AI processing or case execution occurs. The interfaces in `types/api.ts` are the agreed target HTTP envelopes; `types/contracts.ts` contains the frozen domain objects. This foundation correction is recorded in ADR-010.

## Ownership and common behavior

Member 1 owns **every** `app/api/` handler and `lib/api/`. Member 2 implements AI, RAG and deterministic functions in owned libraries. Member 4 implements workflow rendering and automation. Contributors hand functions to Member 1 rather than independently editing the same routes.

Requests and responses use JSON except PDF upload. Identifiers in live mode are database UUIDs. All errors use `ApiError`:

```json
{"success":false,"code":"NOT_IMPLEMENTED","error":"POST /api/... is not implemented yet.","details":"Use fixtures while the route is unfinished."}
```

`details` is optional and must never contain credentials, stack traces or raw provider responses. All routes return 501 today, including for invalid input. Once implemented: 400 for malformed/invalid input, 404 for a missing referenced record, 409 for a prerequisite not ready, 415 for unsupported media, 422 for unsupported/unverifiable policy evaluation, 429 for provider quota, 502 for provider failure, 503 for missing configuration, 500 for unexpected failures. Each response uses the same error envelope; do not turn provider failures into approvals or fake evidence.

## POST /api/documents/upload

- Owner: Member 1. Request: `multipart/form-data`, exactly one nonempty PDF in `file`; validate MIME, PDF signature and size.
- Initial limit: 4 MiB for uploads passing through the Next.js function. Larger files require a separately agreed direct-storage flow. Metadata-only JSON cannot report a successful upload.
- Target 201: `UploadResponse` (`documentId`, `storagePath`, `document: PolicyDocument`, `success: true`). `document.id` equals `documentId`; status is `uploaded`; createdAt is an ISO timestamp. `fileUrl` is optional, using a temporary signed URL for private storage.
- Errors: 400 missing/invalid file; 413 over size limit; 415 non-PDF; 503 unconfigured storage/database; 500 persistence failure. Remove a newly uploaded orphan if the document insert fails.
- Do not automatically call processing. The caller explicitly invokes the next endpoint after upload succeeds.

## POST /api/documents/process

- Owner: Member 1 route; Member 2 parsing/chunk/embedding functions.
- Request: `DocumentRequest`, `{ "documentId": "<uuid>" }`.
- Target 200: `ProcessResponse`, `{ "success": true, "documentId": "<uuid>", "status": "processed", "pageCount": 7, "chunkCount": 7 }`. Counts are illustrative; return actual persisted counts.
- Errors: 400 malformed ID; 404 missing document; 409 processing already running; 422 unreadable/scanned PDF without supported text; 429/502 provider failure; 503 configuration missing; 500 storage/database failure.
- Page numbers are one-based PDF pages. Preserve section text when detectable. Do not infer page numbers from character offsets.

## POST /api/rules/extract

- Owner: Member 1 route; Member 2 extraction function.
- Request: `DocumentRequest`.
- Target 200: `ExtractRulesResponse`, `{ "success": true, "documentId": "<uuid>", "rules": [] }`; rules is `PolicyRule[]` from the document's processed chunks.
- Errors: 400 invalid ID; 404 missing document; 409 document not processed; 422 unsupported rule or missing source evidence; 429/502 provider failure; 503 configuration missing; 500 persistence failure.
- Validate operators, supported fields/actions, thresholds and citation text against source chunks before accepting results. Empty rules must not be interpreted as automatic compliance.

## POST /api/workflows/generate

- Owner: Member 1 route; Member 2 rule-to-workflow function; Member 4 renderer consumes the result.
- Request: `DocumentRequest`. Load persisted rules for that document. No client rule override in the live API.
- Target 200: `GenerateWorkflowResponse`, `{ "success": true, "documentId": "<uuid>", "workflowId": "<uuid>", "workflow": { "nodes": [], "edges": [] } }`. Empty graph here illustrates the envelope only; a successful generated workflow must contain valid nodes and edges.
- Shared interface: `WorkflowDefinition`. Keep React Flow positions and UI data in the renderer adapter, outside the shared contract.
- Errors: 400 invalid ID; 404 missing document; 409 rules not ready; 422 unsupported rule; 500 persistence failure.

## POST /api/cases/execute

- Owner: Member 1 route/persistence; Member 2 deterministic evaluator/evidence.
- Request: `ExecuteCaseRequest`, `{ "workflowId": "<uuid>", "expenseCase": <ExpenseCase> }`.
- Target 200: `ExecuteCaseResponse`, `{ "success": true, "caseId": "<uuid>", "caseResult": <CaseResult> }`.
- Load workflow, document and rules server-side via workflowId. Never accept client-supplied decisions or arbitrary policy rules as authoritative.
- Errors: 400 incomplete case, nonfinite/negative amount or rate, invalid calendar date, submission before expense date, nonpositive/noninteger supplied hotelNights; 404 missing workflow; 409 rules not ready; 422 unhandled rule or unresolved evidence; 500 persistence failure.
- Hotel/lodging claims require a hotelNightlyRate at validation time even though the domain field is optional for non-hotel claims. Missing rate must not silently bypass EXP-004. Follow ADR-008; do not derive the rate from total amount.
- Deterministic target: no violations = APPROVED; missing approvals/receipt/preapproval = ACTION_REQUIRED; hard cap or late submission = REJECTED. Accumulate all violations; REJECTED takes precedence. Equality to the cap or exactly 14 days is allowed. Compare strict typed values without JavaScript coercion.
- The current partial evaluator is not this endpoint implementation. Member 2 must add all six operators, all six rules and boundary tests first.

## POST /api/actions/generate

- Owner: Member 1 route; Member 2 next-action text; Member 4 optional webhook adapter.
- Request: `GenerateActionRequest`, `{ "caseId": "<uuid>" }`. Load stored input and result; do not trust a client-provided CaseResult.
- Target 200: `GenerateActionResponse`, `{ "success": true, "caseId": "<uuid>", "action": "Request manager approval", "template": "<draft text>", "webhookTriggered": false }`.
- Errors: 400 invalid ID; 404 missing case; 409 result not ready; 429/502 drafting provider failure; 500 persistence failure.
- Draft generation never sends email automatically. Webhook dispatch remains optional, explicit, and outside this setup. A webhook failure must preserve the generated draft and case decision.

## Independent development

Use the JSON case/rule/workflow fixtures and `mocks/case-results.json` for UI states. Do not call a 501 endpoint expecting success or use the partial engine to simulate complete compliance. When Member 1 implements a route, replace its 501 assertion in `tests/foundation.test.ts` with the real success/error tests in that same change.
