# Role

Member 1: Platform / Backend / API Integration.

# Current Objective

Prepare the live-verified backend for cross-team review and deployment integration. No backend feature work remains.

## Backend Status

**COMPLETE — live verified.** All six API routes use real server-side persistence and domain functions. No route returns scaffold or mock success.

## Current Role

Integration and deployment support only: preserve the verified contracts, help Members 3 and 4 consume the APIs, and support the integration lead's `dev` merge.

## APIs

- `POST /api/documents/upload`
- `POST /api/documents/process`
- `POST /api/rules/extract`
- `POST /api/workflows/generate`
- `POST /api/cases/execute`
- `POST /api/actions/generate`

## Current State

- All six API routes now have real implementations.
- Supabase schema, private Storage, repositories, atomic chunk/rule replacement, upload, case execution, and action generation remain intact.
- Member 2's `origin/feature/ai-engine` is merged into the integration branch.
- Normal validation is credential-independent and passing.
- The complete live backend pipeline is verified against the final corporate policy PDF with real Supabase and Gemini calls.

## Completed APIs

### `POST /api/documents/upload`

Validates and stores one PDF in private `policies` Storage, then creates its document row.

### `POST /api/documents/process`

- Loads the persisted private Storage path, sets status to `processing`, downloads bytes, and calls `processPolicyPdf(pdfBytes)`.
- Atomically persists embedded chunks with `replaceDocumentChunks` and sets status/page count to `processed`.
- A failure after processing starts attempts to set status to `failed`.
- Returns actual page count and persisted chunk count.

### `POST /api/rules/extract`

- Requires a processed document.
- Downloads the original PDF, calls `extractPdfPages(pdfBytes)`, then `extractPolicyRulesFromPages(pages)`.
- Rejects empty or ungrounded output and atomically persists rules with `replacePolicyRules`.
- Existing rules remain unchanged if parsing, Gemini, grounding, or replacement fails.

### `POST /api/workflows/generate`

- Loads persisted rules; client rules are never accepted.
- Calls `generateWorkflowFromRules(rules)`, saves the returned `WorkflowDefinition`, and returns its persisted workflow ID.
- React Flow positions remain outside the shared contract for Member 4.

### `POST /api/cases/execute`

Loads authoritative workflow rules, calls `evaluateExpenseCase`, and persists the case and result.

### `POST /api/actions/generate`

Loads the stored case/result, calls `generateNextAction`, and returns `webhookTriggered: false` until Member 4 supplies automation.

## Integration Dependencies

- `processPolicyPdf` from `lib/rag/processor.ts`
- `extractPdfPages` from `lib/rag/pdf-parser.ts`
- `extractPolicyRulesFromPages` from `lib/ai/gemini.ts`
- `generateWorkflowFromRules` from `lib/rules/workflow.ts`
- Existing routes continue using `evaluateExpenseCase` and `generateNextAction` from `lib/rules/engine.ts`.

## Files Created/Modified

- `lib/supabase/policy-storage.ts`: server-only private PDF download returning `Uint8Array`.
- `lib/documents/process.ts`: processing orchestration, status recovery, and safe error mapping.
- `lib/rules/extract-document.ts`: page-aware extraction and atomic persistence orchestration.
- `lib/workflows/generate.ts`: persisted-rule workflow generation and persistence.
- Three corresponding `app/api/**/route.ts` files now wire production dependencies.
- `tests/platform/policy-pipeline-api.test.ts`: 26 credential-free route-boundary tests.
- `tests/foundation.test.ts`: replaces obsolete 501 assertions with real-route validation.
- `lib/rag/retriever.ts`: integration fix for the current admin-client module path.
- `package.json` / `package-lock.json`: retain platform scripts and Member 2's `unpdf` dependency.

## Live End-to-End Verification

- Source PDF: `RulePilot_Shared_Corporate_Expense_Policy.pdf`.
- Document ID: `302136c4-e986-417d-a888-ea598f24b245`.
- Processing: passed with 8 pages and 24 persisted page-aware chunks. Every chunk references the document, has a 1-based page, nonempty content, and a 768-dimensional embedding.
- Extracted/persisted rule IDs: `EXP-001`, `EXP-002`, `EXP-003`, `EXP-004`, `EXP-005`, `EXP-006`; exactly six unique rows remained after atomic replacement.
- Citation grounding: passed against the eight extracted source pages. Persisted verbatim text and page numbers survived the repository round trip.
- Workflow ID: `e4288c91-494e-44b4-a9b1-5e197ce130fa`; 14 nodes and 19 edges. Start/end cardinality, rule IDs, unique node/edge IDs, and all edge endpoints passed.
- Case A `43b21f83-08a8-494a-b7ea-96483e33a04e`: `APPROVED`.
- Case B `f7a7a90a-ddab-4d70-a57c-6a01f17409c6`: `ACTION_REQUIRED` for missing receipt.
- Case C `5bd416a0-18c1-480f-ac90-a68580a2b5c5`: `REJECTED` for hotel cap.
- Case D `61158a09-ce47-4a0b-a79e-947572a780e1`: `REJECTED` for late submission.
- Case E `72047469-a38a-4401-80d5-c33d0df1f14d`: `ACTION_REQUIRED` for international travel without pre-approval.
- Action generation passed for approved, action-required, and rejected results. Stored case/results were used and every response kept `webhookTriggered: false`.
- Member 2 smoke test: PASS, all 12 steps; eight pages, 24 chunks, 768-dimensional embedding, six grounded rules, and a 14-node/19-edge workflow.
- Database verification: document, chunks, rules, workflow, five cases, and five results were read back with matching relationships.

## Tests Run

- `npm run typecheck`
- `npm run lint`
- `npm run test:platform`
- `npm run test:rules`
- `npm test`
- `npm run build`
- `node --conditions=react-server --import tsx --test tests/platform/policy-pipeline-api.test.ts`
- Live HTTP upload and process attempt against the final corporate policy PDF

## Test Results

- TypeScript and ESLint passed.
- New route tests: 28 passed, 0 failed.
- Platform suite: 76 passed, 0 failed.
- Expanded rule/RAG suite: all 5 test files passed.
- Full suite: 82 passed, 0 failed.
- Production build passed; all six API routes compile as dynamic routes.
- Live pipeline and database verification passed with no mock fallback data.

## Known Problems

- Google retired the original `text-embedding-004` and restricted `gemini-2.5-flash`; defaults were updated to the live-verified `gemini-embedding-001` and `gemini-3.6-flash` while retaining environment overrides.
- Temporary Gemini 503 capacity responses now retain HTTP 503 instead of being flattened to 502.
- Seven duplicate documents from failed verification attempts remain in Supabase. Automated approval review rejected permanent cleanup because explicit deletion authorization was absent.

## Dependencies on Other Members

- Member 2 owns provider model compatibility, PDF/RAG logic, extraction prompts, grounding, rule engine, and workflow transformation.
- Member 4 owns workflow rendering and webhook automation.

## Next Exact Step

Have the integration lead review `integration/backend-dev` and decide whether to merge it into `dev`.

## Provider Recovery — 2026-10-04

- Production logs showed `POST /api/rules/extract` returning HTTP 503 while the Vercel runtime remained healthy.
- `lib/ai/gemini.ts` now retries Gemini HTTP 503 twice with bounded delays. It does not retry quota HTTP 429 responses.
- If Gemini remains unavailable or rate-limited and `GROQ_API_KEY` is configured, extraction shifts to Groq using `GROQ_MODEL` or `openai/gpt-oss-20b`.
- Both providers feed the same `PolicyRule` validation and exact source citation grounding before atomic persistence. No mock rules or citations are used.
- Added focused tests for Gemini recovery, persistent-503 Groq fallback, and immediate 429 fallback.
- Production activation still requires `GROQ_API_KEY` in Vercel Production and a deployment of this patch.

## Remaining Work

- Review and merge the isolated `integration/backend-dev` candidate into `dev`.
- Connect Member 3's frontend to the six real HTTP contracts without simulated success.
- Connect Member 4's renderer to the returned `WorkflowDefinition` and later add the optional automation adapter.
- Configure deployment environment variables and run deployment smoke checks after cross-team integration.

# Session History

- 2026-10-03: Completed the Supabase foundation, upload, repositories, atomic replacement RPCs, case API, and action API on `feature/platform`.
- 2026-10-03: Created `integration/platform-ai`, merged `origin/feature/ai-engine`, fixed the admin-client import mismatch, implemented the final three routes, and added 26 route tests.
- 2026-10-03: Live final-PDF upload succeeded; processing failed closed because `GEMINI_API_KEY` is empty.
- 2026-10-03: Verified the full live backend pipeline with real providers, fixed retired provider defaults and HTTP 503 propagation, and confirmed persisted chunks, rules, workflow, cases, results, citations, and actions.
- 2026-10-03: Created `integration/backend-dev` from latest `origin/dev`, merged the verified backend without conflicts, revalidated 76 platform tests, all rule/RAG tests, 82 full-suite tests, the production build, security boundaries, and cross-team handoff notes.
