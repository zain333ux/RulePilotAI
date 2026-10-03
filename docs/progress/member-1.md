# Role

Member 1: Platform / Backend / API Integration.

# Current Objective

Integrate Member 2's policy-processing exports with the final three platform routes on `integration/platform-ai`.

## Current State

- All six API routes now have real implementations.
- Supabase schema, private Storage, repositories, atomic chunk/rule replacement, upload, case execution, and action generation remain intact.
- Member 2's `origin/feature/ai-engine` is merged into the integration branch.
- Normal validation is credential-independent and passing.
- Live upload succeeded, but the remaining live pipeline is blocked because `GEMINI_API_KEY` is empty in ignored `.env.local`.

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

## End-to-End Verification

- Source PDF: `RulePilot_Shared_Corporate_Expense_Policy.pdf`.
- Live upload: passed; document ID `4e50440c-ff93-4943-82f9-77bb72cb4cb4`.
- Processing: correctly returned HTTP 503 `PROVIDER_NOT_CONFIGURED` because `GEMINI_API_KEY` is empty.
- Failure recovery: the document was not left at `processing`.
- Page count, chunk count, six-rule extraction, citation grounding, workflow counts, case result, and action result remain unverified live until the key is configured. No values were fabricated.

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
- New route tests: 26 passed, 0 failed.
- Platform suite: 74 passed, 0 failed.
- Expanded rule/RAG suite: all 5 test files passed.
- Full suite: 80 passed, 0 failed.
- Production build passed; all six API routes compile as dynamic routes.
- Live upload passed. Live provider-dependent processing is blocked by missing Gemini configuration.

## Known Problems

- `GEMINI_API_KEY` is empty in `.env.local`, so live embeddings and extraction cannot run.
- The failed live test document remains as an auditable upload with status `failed`; it has no fabricated chunks, rules, or workflow.

## Dependencies on Other Members

- Member 2 owns provider model compatibility, PDF/RAG logic, extraction prompts, grounding, rule engine, and workflow transformation.
- Member 4 owns workflow rendering and webhook automation.

## Next Exact Step

Set `GEMINI_API_KEY` in ignored `.env.local`, restart Next.js, and rerun the live upload to action flow.

# Session History

- 2026-10-03: Completed the Supabase foundation, upload, repositories, atomic replacement RPCs, case API, and action API on `feature/platform`.
- 2026-10-03: Created `integration/platform-ai`, merged `origin/feature/ai-engine`, fixed the admin-client import mismatch, implemented the final three routes, and added 26 route tests.
- 2026-10-03: Live final-PDF upload succeeded; processing failed closed because `GEMINI_API_KEY` is empty.
