# Role

Member 1: Platform / Backend / Supabase.

# Current Objective

Real case execution and deterministic action generation APIs are complete on `feature/platform`. PDF processing, rule extraction, and workflow generation remain separate milestones.

## Current State

- The live Supabase project has the six MVP tables, required relationships and constraints, pgvector, RLS, and service-role-only access.
- The private `policies` bucket accepts PDFs up to 4 MiB.
- `POST /api/documents/upload` is implemented and was manually verified against the live project with HTTP 201. The uploaded corporate RulePilot PDF appeared in Supabase Storage and its `documents` row was created.
- The upload adapter now creates document rows through the shared repository layer. Its request and response behavior is unchanged.
- `npm run smoke:repository` provides an explicit live check for document read/status update/read-back/restoration. It is not part of `npm test`.
- `replacePolicyRules(documentId, rules)` now calls the live `replace_policy_rules_atomic` RPC. Replacement, clearing, validation, and rollback occur inside one PostgreSQL function call.
- `replaceDocumentChunks(documentId, chunks)` now calls the live `replace_document_chunks_atomic` RPC. Replacement, clearing, validation, and rollback occur inside one PostgreSQL function call.
- `POST /api/cases/execute` loads the workflow and persisted policy rules, validates the expense case, calls Member 2's `evaluateExpenseCase`, and persists the case and authoritative result.
- `POST /api/actions/generate` loads the persisted case and result, calls Member 2's `generateNextAction`, and returns a deterministic draft with `webhookTriggered: false`.
- `/api/documents/process`, `/api/rules/extract`, and `/api/workflows/generate` remain explicit HTTP 501 stubs.
- `types/contracts.ts` and `types/api.ts` were not changed.

## APIs Implemented

### `/api/cases/execute`

- Request: `{ workflowId: string, expenseCase: ExpenseCase }`.
- Validation: UUID workflow ID; required strings; finite nonnegative amount and optional hotel rate; strict booleans; real `YYYY-MM-DD` calendar dates; submission on or after expense date; positive integer optional hotel nights; hotel/lodging claims require `hotelNightlyRate`.
- Repositories: `getWorkflowById`, `getPolicyRulesByDocumentId`, `createCase`, and `saveCaseResult`.
- Member 2 function: `evaluateExpenseCase(expenseCase, rules)` from `lib/rules/engine.ts`, synchronized from `origin/feature/ai-engine`.
- Success: HTTP 200 `ExecuteCaseResponse` with the persisted `caseId` and saved `CaseResult`.
- Errors: 400 invalid request, 404 missing workflow, 409 rules not ready, and 500 safe persistence failures. If result persistence fails after case creation, the route reports failure and logs the partial case ID server-side.

### `/api/actions/generate`

- Request: `{ caseId: string }` with UUID validation.
- Repositories: `getCaseById` and `getCaseResultByCaseId`; client-provided decisions are never accepted.
- Member 2 function: `generateNextAction(caseResult, expenseCase)` from `lib/rules/engine.ts`.
- Success: HTTP 200 `GenerateActionResponse` with action, template, and `webhookTriggered: false`.
- Errors: 400 invalid request, 404 missing case, 409 result not ready, and 500 safe repository failures.
- Webhook: intentionally disabled until Member 4 provides a stable server adapter. Action generation does not depend on external automation.

## Repository Layer Completed

`lib/repositories/repositories.ts` contains database mappings and a dependency-injected repository factory for tests. `lib/repositories/index.ts` is the server-only public entry point and creates repositories with `getAdminSupabase()`.

Repositories contain persistence and row mapping only. They do not parse PDFs, create chunks, generate embeddings or rules, evaluate cases, or generate workflows.

Database failures throw `RepositoryError` with safe messages. Single-record reads throw `RepositoryNotFoundError` when no row exists. List reads return an empty array only when the database query succeeds with no rows.

## Functions Available

Import server-side functions from `@/lib/repositories`:

- Documents: `createDocument`, `getDocumentById`, `updateDocumentProcessingStatus`
- Chunks: `insertDocumentChunks`, `replaceDocumentChunks`, `getDocumentChunksByDocumentId`, `deleteDocumentChunksByDocumentId`
- Rules: `replacePolicyRules`, `getPolicyRulesByDocumentId`
- Workflows: `saveWorkflow`, `getWorkflowByDocumentId`, `getWorkflowById`
- Cases: `createCase`, `getCaseById`
- Results: `saveCaseResult`, `getCaseResultByCaseId`

Repository input and record types are exported from the same entry point. Application data uses `PolicyRule`, `WorkflowDefinition`, `ExpenseCase`, and `CaseResult` from `types/contracts.ts`.

## Files Created/Modified

- `lib/repositories/repositories.ts`: typed database mappings, safe errors, repository factory, and all six persistence areas.
- `lib/repositories/index.ts`: server-only public repository functions backed by the admin Supabase client.
- `lib/supabase/document-upload.ts`: document insert now uses `createRepositoryStore(...).createDocument(...)`; Storage handling remains in the upload adapter.
- `tests/platform/repositories.test.ts`: mocked Supabase repository tests.
- `package.json`: added `test:repositories`; repository tests are also included through `test:platform` and `npm test`.
- `docs/AGENT_HANDOFF.md`: records the shared persistence layer and live upload verification.
- `tests/live/repository-smoke.ts`: opt-in live repository read/update/restore verification.
- `.env.example`: documents the optional `RULEPILOT_SMOKE_DOCUMENT_ID` without values.
- `package.json`: adds `smoke:repository` without adding it to the normal test chain.
- `supabase/migrations/20261003000000_atomic_policy_rule_replacement.sql`: adds the validated, service-role-only atomic replacement RPC.
- `supabase/migrations/20261003010000_atomic_document_chunk_replacement.sql`: adds validated, service-role-only atomic chunk replacement.
- `lib/repositories/repositories.ts`: replaces the separate policy-rule delete/insert queries with one RPC call while preserving the public TypeScript signature.
- `lib/repositories/repositories.ts` and `lib/repositories/index.ts`: add `replaceDocumentChunks` while retaining `insertDocumentChunks` append semantics.
- `tests/platform/repositories.test.ts`: covers successful atomic replacement, empty replacement, RPC failure, safe error mapping, and confirms the old direct delete path is unused.
- `supabase/README.md`: records all four live migrations and RPC access boundaries.
- `lib/cases/execute.ts`: validates and orchestrates authoritative workflow/rule lookup, case evaluation, and persistence.
- `lib/actions/generate.ts`: loads stored case/result data and calls the deterministic action generator.
- `app/api/cases/execute/route.ts` and `app/api/actions/generate/route.ts`: replace the 501 scaffolds with Node.js route handlers.
- `lib/rules/engine.ts`: synchronizes Member 2's completed six-rule evaluator and `generateNextAction` export from `origin/feature/ai-engine`.
- `tests/platform/case-action-api.test.ts`: 22 mocked route-boundary tests for success, validation, missing data, persistence failures, and webhook state.
- `tests/foundation.test.ts`: retains 501 coverage only for the three routes that remain scaffolds.

## Upload Endpoint

`POST /api/documents/upload` accepts exactly one `multipart/form-data` PDF in `file`. It validates MIME, `%PDF-` signature, nonempty content, and the 4 MiB limit. It stores the object as `<document-id>/<safe-name>.pdf`, creates the document through the repository, and removes the object if document creation fails.

## Tests Run

- `npm run test:repositories`
- `npm run typecheck`
- `npm run lint`
- `npm run test:platform`
- `npm test`
- `npm run build`
- `git diff --check`
- `npm run smoke:repository -- <existing-document-uuid>`
- `npx tsx --test tests/platform/case-action-api.test.ts`

## Test Results

- Repository tests: 16 passed, 0 failed.
- Case/action route tests: 22 passed, 0 failed.
- Platform tests: 48 passed, 0 failed.
- Full suite: 54 tests passed, 0 failed, plus the existing deterministic engine and workflow checks.
- TypeScript: passed with no errors.
- ESLint: passed with no warnings or errors.
- Next.js production build: passed; all expected static pages and six dynamic API routes compiled.
- Git whitespace check: passed with only expected Windows line-ending notices.
- Live repository smoke: passed against `RulePilot_Shared_Corporate_Expense_Policy.pdf`. It read the original `uploaded` status, changed it to `processing`, confirmed the change through a second read, restored `uploaded`, and confirmed restoration.
- Atomic-rule migration: applied successfully to the live project through SQL Editor. Verification returned `replace_policy_rules_atomic(uuid,jsonb)`, `security_definer=false`, service-role execute `true`, anon execute `false`, and authenticated execute `false`.
- Live failure check: malformed rule JSON was rejected; the existing document's rule count remained unchanged at zero.
- Atomic-chunk migration: applied successfully to the live project through SQL Editor. Verification returned `replace_document_chunks_atomic(uuid,jsonb)`, `security_definer=false`, service-role execute `true`, anon execute `false`, and authenticated execute `false`.
- Live chunk failure check: a one-value embedding was rejected and the selected document's chunk count remained unchanged at zero.

## Live Smoke Test

Required local variables in ignored `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RULEPILOT_SMOKE_DOCUMENT_ID` unless the UUID is passed after `--`

Run with the environment variable:

```text
npm run smoke:repository
```

Or pass an existing document UUID without storing it:

```text
npm run smoke:repository -- <existing-document-uuid>
```

The script reads the selected document, temporarily switches its status, verifies a second read, and restores the original status in `finally`. It prints document metadata and status only; it never prints credentials.

## Member 2 Integration Points

When Member 2's parser and RAG code is ready, it can call these server-side functions:

1. `getDocumentById(documentId)` to read the Storage path and current status.
2. `updateDocumentProcessingStatus(documentId, "processing")` before processing.
3. `replaceDocumentChunks(documentId, chunks)` for safe reprocessing. Each chunk uses `{ pageNumber, section?, content, embedding? }`; `pageNumber` is a positive integer, `content` is nonempty, and an embedding must be a JSON array of exactly 768 numbers. Omitting `embedding` stores SQL `NULL`. An empty array atomically clears the document's chunks.
4. `insertDocumentChunks(documentId, chunks)` remains available only for intentional append behavior.
5. `replacePolicyRules(documentId, rules)` with validated `PolicyRule[]`. The call is atomic and returns the stored rules. An empty array atomically clears the document's rules. On failure it throws `RepositoryError` and preserves the previous rows.
6. `updateDocumentProcessingStatus(documentId, "processed", pageCount)` only after chunk and rule persistence succeeds.

Member 2 must not pass fake vectors, invented citations, or generated placeholder chunks. Empty embeddings are allowed during parsing only when the integration deliberately stores chunks before embedding.

## Known Issues

- The deployed SQL was applied through Supabase SQL Editor and is not represented in dashboard migration history.
- The live smoke covers document read and status update only. Other repositories remain covered by mocked tests so normal validation never depends on live credentials.

## Remaining Blockers

- `/api/documents/process` needs Member 2's `processPolicyPdf(pdfBytes)` export integrated with private Storage download and `replaceDocumentChunks`.
- `/api/rules/extract` needs Member 2's `extractPolicyRulesFromPages(pages)` export integrated with `replacePolicyRules`.
- `/api/workflows/generate` needs Member 2's `generateWorkflowFromRules(rules)` export integrated with `saveWorkflow`.
- These functions exist on `origin/feature/ai-engine`; they are not copied into this Member 1 milestone because the requested scope covers only case and action routes.

## Next Exact Step

Integrate `processPolicyPdf` with private Storage download and `replaceDocumentChunks` in `/api/documents/process` after the Member 2 branch is accepted for integration.

# Session History

- 2026-10-02: Shared setup created route scaffolds, Supabase helpers, migrations, API contracts, and security boundaries.
- 2026-10-03: Audited the platform baseline and created `feature/platform` from `origin/dev`.
- 2026-10-03: Applied and verified the live schema, created the restricted bucket, separated Supabase clients, and added environment validation tests.
- 2026-10-03: Implemented and tested the real PDF upload endpoint with private Storage, document persistence, and compensating cleanup.
- 2026-10-03: Confirmed the live upload returned HTTP 201 and appeared in Supabase, then added the reusable repository layer for documents, chunks, rules, workflows, cases, and case results.
- 2026-10-03: Added and ran the opt-in live repository smoke test against the existing corporate policy document; status read, update, read-back, restoration, and restoration verification all passed.
- 2026-10-03: Added and deployed `replace_policy_rules_atomic(uuid,jsonb)`, restricted it to service-role execution, switched the repository to the RPC, and verified malformed input leaves live rules unchanged.
- 2026-10-03: Added and deployed `replace_document_chunks_atomic(uuid,jsonb)`, exposed `replaceDocumentChunks`, retained append-only insertion, and verified an invalid embedding leaves live chunks unchanged.
- 2026-10-03: Replaced the case/action 501 scaffolds with real validated routes, reused Member 2's six-rule evaluator and action generator, persisted authoritative results, and added 22 mocked route tests.
