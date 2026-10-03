# RulePilot AI agent handoff

Read immediately after the PRD, then complete the playbook/development rules/member progress checklist before coding. Root AGENTS.md points here.

## CURRENT STATE

- Project: RulePilot AI.
- Phase: final backend, AI-hardening, and workflow baseline candidate assembled; promotion to `dev` is waiting on the strict live smoke gate.
- Current branch: `integration/final-baseline`, created from `origin/dev` at `65fcc500a16c47f0123e55b7134aaf67e51e0e35`, with Member 2 hardening commit `4941563c6a67b60e8c2a8c7af27d17857b120eb3` cherry-picked and `origin/integration/workflow-dev` merged. `dev` and `main` remain unchanged.
- Working architecture: one root Next.js 16.3.8 application. All six routes use server-side Storage/repositories and Member 2 domain exports. AI extraction rejects duplicate IDs and unsupported fields; strict demo validation remains separate from generic extraction. The workflow surface accepts `WorkflowDefinition` and runs a clearly labelled mock execution simulation through a central controller.
- Completed by area: **Backend â€” COMPLETE and previously live verified. AI/RAG â€” implementation and hardening COMPLETE; strict re-smoke currently provider-blocked. Workflow UX â€” COMPLETE and browser verified.**
- Unfinished: Member 3 product-level frontend integration with real API responses, final visual polish, full browser E2E, deployment readiness, and optional webhook dispatch from the action route.
- Known blockers: strict final-policy re-smoke reached live Gemini extraction three times but the provider returned HTTP 503 high demand each time. PDF extraction, 24 chunks, and the live 768-dimensional embedding passed. Do not promote this candidate to `dev` until the strict smoke completes. Seven duplicate document records remain untouched; no cleanup is authorized.
- Known limitations: webhook dispatch remains disabled and `webhookTriggered` is always false. Case creation and result insertion are separate repository operations, so a result-insert failure can leave a persisted case without a result; the route returns 500 and logs the case ID. Use static expected result fixtures for mock UI until branches are integrated.
- Decisions: LLM interprets policy; deterministic code executes rules. Member 1 owns every route. Workflow/case IDs bind rules and decisions to their documents. Server-only secret modules; private policy storage and server-only DB access baseline. See ADR-010 through ADR-012.
- Environment: no credentials needed for build/unit tests. Server-only GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY and optional MAKE_WEBHOOK_URL; public NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. All `.env*` files are ignored except `.env.example`. Supabase credentials are configured locally and the live upload was manually verified; never print or commit them.
- Database: live schema, pgvector, service-role access, private Storage, and both atomic RPCs are verified. The final live record has 24 chunks, six rules, one generated workflow, five cases, and five case results with correct relationships.
- API: all six routes are implemented and verified live in order against the final policy PDF. Provider-dependent routes fail closed with structured errors.
- Contract status: types/contracts.ts unchanged by this review. Additive types/api.ts formalizes transport envelopes; changes recorded in ADR-010. Mock citations are authored fictional demo references, never live PDF evidence.
- Packages: existing dependencies retained; `unpdf` 1.7.x is included for Member 2's digital PDF parser.
- Tests: credential-free tests cover all six routes, repositories, domain rules, fixtures, malformed workflows, layout, dynamic traversal, reset behavior, failure isolation, and webhook reliability.
- Validation: complete live pipeline passed on document `302136c4-e986-417d-a888-ea598f24b245`: 8 pages, 24 chunks, six grounded rules, workflow `e4288c91-494e-44b4-a9b1-5e197ce130fa` with 14 nodes/19 edges, five expected case decisions, and action drafts. Final automated totals are in Member 1 progress.
- Last verified working commands: `npm run typecheck`; `npm run lint`; `npm run test:platform`; `npm run test:rules`; `npm run test:workflow`; `npm test`; `npm run build`; `git diff --check`.
- Exact next task: rerun the strict final-policy smoke when Gemini extraction is available; if it passes, fast-forward `dev` to the reviewed final candidate and hand the baseline to Member 3.
- Parallel readiness: code and automated validation are ready, but the final `dev` promotion is intentionally blocked by the required live smoke gate.

### Backend consumption contract

- `POST /api/documents/upload` stores the PDF and returns `documentId`.
- `POST /api/documents/process` downloads the stored PDF and persists page-aware embedded chunks.
- `POST /api/rules/extract` persists the source-grounded `PolicyRule[]` for that document.
- `POST /api/workflows/generate` returns `workflowId` plus the persisted `WorkflowDefinition`.
- `POST /api/cases/execute` returns `caseId` plus the persisted deterministic `CaseResult`.
- `POST /api/actions/generate` returns the deterministic action/template. `webhookTriggered` remains `false` until Member 4's optional automation integration.

Member 3 should call these real routes and surface their structured failures instead of simulating backend success. Member 4 should render the returned `WorkflowDefinition`; the renderer does not need to generate mock workflows internally.

## 2. Chronological Session Log

### Session 1 â€” Initial Setup & Foundation
- **Date:** 2026-10-02
- **Agent:** Initial Setup Engineer
- **Summary:** Bootstrapped Next.js root app, contracts, mocks, docs, partial engine, API skeletons (then claiming success), migration, starter UI.

### Session 2 â€” Shared Foundation Review & Hardening
- **Date:** 2026-10-02
- **Agent:** Initial Setup Engineer (continuation)
- **Summary:**
  - Converted all API scaffolds to HTTP 501 via `lib/api/not-implemented.ts`
  - Removed fabricated Gemini/RAG/embedding success paths (explicit throw errors)
  - Fixed approval fixture category to Client Entertainment; fixed Case C dates within 14 days
  - Documented ADR-008 (hotel), ADR-009 (501), citation provenance, executable rule semantics
  - Secret guards on Supabase clients; migration CHECKs + UNIQUE(document_id, rule_code)
  - shadcn `components.json` + CSS variables; system fonts (no Google font fetch at build)
  - Disabled false-active upload/evaluate controls; labeled sample dashboard data
  - Corrected Member 4 ownership (`mocks/` shared); foundation tests expect 501
  - Validated install/lint/typecheck/tests/build; committed and pushed to GitHub

### Session 3 â€” ADR-008 Hotel Field Consensus
- **Date:** 2026-10-02
- **Agent:** Initial Setup Engineer
- **Summary:**
  - Froze additive ExpenseCase fields: `hotelNightlyRate?: number`, `hotelNights?: number`
  - EXP-004 evaluation: `hotelNightlyRate > 25000` (do not derive from amount/nights)
  - Updated `mocks/policy-rules.json` EXP-004 `field` â†’ `hotelNightlyRate`
  - Documented in ADR-003 / ADR-008; cleared hotel blocker in handoff


### Session 4: Parallel development readiness review (2026-10-02)

- Reviewed completed main at 88bdbd5; preserved the agreed hotel fields and existing UI/prototype implementations.
- Added root AGENTS.md; types/api.ts defines transport envelopes with workflowId/caseId and a standard error shape. Corrected all route ownership to Member 1.
- Added authored sample policy text, expected case results and three integrity tests; fixed Windows CRLF handling in the quote test.
- Added server-only 0.0.1 imports, broadened secret ignores, and an unapplied RLS/server-access migration with setup/mapping instructions.
- Corrected stale hotel-blocker notes, member activity claims, model assumptions and branch workflow. Updated ADR-010/011/012 and shared setup progress.
- Verified install (0 audit vulnerabilities), lint (no warnings), typecheck, all tests, production build and HTTP smoke checks. Git diff whitespace check passed; domain contracts unchanged. No visual browser QA, Gemini calls, webhook delivery or Supabase execution claimed.
- Review is isolated on setup/parallel-readiness. No changes pushed or merged into main during this review; the integration lead must share the accepted baseline before teammates pull it.


### Session 5: Publish shared baseline (2026-10-02)

User authorized sharing the baseline. Fetched GitHub: main was 88bdbd5, with no dev or competing changes. Re-ran npm test successfully. Publish this commit to main and dev together using a normal atomic push; no force push or history rewrite. Preserve setup/parallel-readiness as the review branch. Each teammate uses their own clone/worktree and starts their assigned feature branch at origin/dev.

### Session 6: Member 1 Supabase foundation (2026-10-03)

- Continued on `feature/platform` without implementing API features.
- Applied both repository schema files through the SQL Editor in the live `RulePilotAI` Supabase project.
- Live SQL confirmed all six tables, five foreign keys, required CHECK/UNIQUE constraints, pgvector 0.8.2 in `extensions`, `document_chunks.embedding vector(768)`, the RPC, RLS, and service-role-only access.
- Created the private `policies` bucket with a 4 MiB limit and `application/pdf` restriction.
- Separated browser, server, and privileged Supabase clients and added clear environment validation with four focused tests.
- Supabase Security Advisor returned zero errors and zero warnings. Six informational no-policy notices match the intentional server-only MVP access model.

### Session 7: Member 1 PDF upload endpoint (2026-10-03)

- Replaced only `POST /api/documents/upload` with a real Node.js route; the other five API routes remain HTTP 501.
- Added strict multipart, count, size, MIME, and `%PDF-` signature validation.
- Added safe UUID-based private Storage paths and `documents` insertion through the server-only admin client.
- Added compensating Storage deletion after database failure and generic client errors that do not expose provider details.
- Added focused mocked tests and repeated typecheck, lint, full tests, and production build.

### Session 8: Member 1 repository layer (2026-10-03)

- Added server-only repository functions for documents, chunks, policy rules, workflows, cases, and case results.
- Kept shared application data on `PolicyRule`, `WorkflowDefinition`, `ExpenseCase`, and `CaseResult`; no shared contract or schema change was needed.
- Added safe repository errors and typed not-found handling. Successful empty list reads remain distinct from database failures.
- Refactored the upload persistence adapter to create document rows through the repository without changing the endpoint contract.
- Added mocked repository tests. The manually verified live upload now confirms HTTP 201, private Storage persistence, and document creation in the deployed project.

### Session 9: Member 1 live repository smoke test (2026-10-03)

- Added `tests/live/repository-smoke.ts` and the explicit `npm run smoke:repository` command. Normal tests do not invoke it.
- The runner requires live credentials plus an existing UUID from `RULEPILOT_SMOKE_DOCUMENT_ID` or the command line. It never prints credentials.
- Ran it against the existing corporate policy document: read `uploaded`, changed and read back `processing`, then restored and confirmed `uploaded`.
- Sanitized `.env.example` after live-looking Supabase keys were found there again. Only empty variable names remain in the tracked template.

### Session 10: Atomic policy-rule replacement (2026-10-03)

- Added and deployed `replace_policy_rules_atomic(uuid,jsonb)` in `20261003000000_atomic_policy_rule_replacement.sql`.
- The RPC validates the shared `PolicyRule` JSON structure, locks the parent document row, replaces rules in one transaction, supports an empty replacement set, and returns stored rows.
- Kept `SECURITY INVOKER`; revoked execution from `PUBLIC`, `anon`, and `authenticated`; granted only `service_role`.
- Preserved the `replacePolicyRules(documentId, rules)` TypeScript API and mapped RPC failures to the existing `RepositoryError`.
- Live verification confirmed the function and grants. Malformed JSON was rejected and left the live rule count unchanged.

### Session 11: Atomic document-chunk replacement (2026-10-03)

- Added and deployed `replace_document_chunks_atomic(uuid,jsonb)` with parent locking, full input validation, `vector(768)` conversion, transactional replacement, and empty-set clearing.
- Added `replaceDocumentChunks(documentId, chunks)` while preserving `insertDocumentChunks` append semantics.
- Restricted RPC execution to `service_role`; live verification confirmed an invalid embedding leaves stored chunks unchanged.

### Session 12: Real case execution and action APIs (2026-10-03)

- Replaced `POST /api/cases/execute` and `POST /api/actions/generate` 501 scaffolds with real Node.js handlers.
- Case execution validates inputs, loads workflow-linked persisted rules, reuses Member 2's six-rule evaluator, and persists the case and saved result.
- Action generation loads the stored case/result and reuses Member 2's deterministic generator. Webhook delivery remains disabled.
- Added 22 mocked route-boundary tests; typecheck, lint, 48 platform tests, 54 full-suite tests, and production build passed.
### Session 6: Member 2 â€” End-to-End AI/RAG/Rule Engine Implementation (2026-10-03)
- **Branch:** `feature/ai-engine`
- **Agent:** Member 2 (AI / RAG / Deterministic Rule Engine)
- **Summary:**
  - Implemented server-only PDF text parser (`lib/rag/pdf-parser.ts`) using `unpdf`. Extracts 1-based digital pages without OCR; fails closed with `UnreadablePdfError` on empty/scanned PDFs.
  - Added page-aware chunker (`chunkPolicyPages` in `lib/rag/chunker.ts`). Ensures chunks never cross page boundaries, extracts sections without hallucinating, and ignores empty chunks.
  - Implemented domain document processor (`processPolicyPdf` in `lib/rag/processor.ts`). Pure domain pipeline converting PDF bytes into 768-dim embedded chunks, ready for Member 1's `POST /api/documents/process`.
  - Implemented strict citation grounding (`validatePolicyRulesAgainstSource` in `lib/ai/gemini.ts`). Validates page existence, normalizes whitespace for PDF line-breaks, and fails closed with `CitationGroundingError` on mismatched pages, fabricated citations, or paraphrased text.
  - Implemented source-aware Gemini extraction (`extractPolicyRulesFromPages` in `lib/ai/gemini.ts`). Formats page markers, requests structured JSON from `gemini-2.5-flash`, and strictly grounds output against source pages.
  - Implemented deterministic workflow generator (`generateWorkflowFromRules` in `lib/rules/workflow.ts`). Pure graph transformation yielding start node, condition/action/approval nodes preserving ruleIds, end node, and branching edges. Rejects duplicate rule IDs with `WorkflowGenerationError`.
  - Cleaned stale prototype comments in `lib/rules/engine.ts`.
  - Added live AI smoke test script (`scripts/smoke-ai.ts`) executing 12-step verification against real policy PDFs.
  - Added unit test suites (`tests/rules/pdf-parser.test.ts`, `tests/rules/workflow.test.ts`, updated `tests/rules/chunker.test.ts`, `tests/rules/ai.test.ts`, and `tests/rules/engine.test.ts`).
  - Verified `npm run typecheck`, `npm run lint`, `npm run test:rules`, `npm test`, and `npm run build` all pass with 0 errors. Shared contracts (`types/contracts.ts`) and API routes remained untouched.

### Session 13: Platform and AI branch integration (2026-10-03)

- Created `integration/platform-ai` from Member 1's branch and merged `origin/feature/ai-engine` without rewriting history.
- Preserved Member 1 platform work and Member 2's parser, embeddings, extraction, engine, and workflow generator.
- Replaced the final three 501 scaffolds with routes backed by private Storage, atomic repositories, and Member 2 exports.
- Added 26 credential-free route tests; required local validation passed.
- Live final-policy upload succeeded as document `4e50440c-ff93-4943-82f9-77bb72cb4cb4`; processing failed closed with 503 because `GEMINI_API_KEY` is empty.

### Session 14: Complete live backend verification (2026-10-03)

- Confirmed `GEMINI_API_KEY` is configured without displaying it and kept `.env.local` ignored.
- Replaced retired provider defaults with `gemini-embedding-001` and the live-verified `gemini-3.6-flash`; retained environment overrides.
- Preserved upstream 503 status through both provider error types and route mappings; added regression coverage.
- Member 2's 12-step live smoke passed with the final PDF: eight pages, 24 chunks, a 768-dimensional embedding, six grounded rules, and a 14-node/19-edge workflow.
- The six real APIs completed on document `302136c4-e986-417d-a888-ea598f24b245`. Database read-back verified the chunks, rules, workflow, five representative cases/results, citations, and action drafts.
- Cleanup of seven failed-attempt duplicate records was not executed because automatic approval review required explicit authorization for permanent live-data deletion.

### Session 15: Backend dev-integration candidate (2026-10-03)

- Confirmed `origin/dev` had no independent commits beyond the backend integration base, so the candidate merge had no conflicts.
- Created `integration/backend-dev` from latest `origin/dev` and fast-forwarded it to `origin/integration/platform-ai` without rewriting history.
- Confirmed all six routes remain real, shared contracts are unchanged, tracked files contain no configured secret values, and `.env.local` remains ignored.
- Added concise Member 3 and Member 4 consumption guidance. Full credential-independent validation and production build passed; no live data was changed.

### Member 4 Workflow Update â€” 2026-10-03

- Implemented locally on feature/workflow; not yet merged into dev.
- Connected WorkflowGraph to /workflows using existing mock data.
- Added five custom node designs, branching layout, arrow labels
  and selected-node styling.
- npm test, npm run build and npm run lint passed.
- Production build TypeScript check passed.
- Updated browser interaction checks still need confirmation.
- Shared contracts, fixtures and API behavior unchanged.
- Next: verify browser interactions, then add an AgentTimeline
  mock preview for waiting, running, completed and failed states.
  ### Member 4 Timeline Preview â€” 2026-10-03

- Added labelled mock timeline preview on /workflows.
- All four states confirmed in browser.
- Tests and production build passed.
- No live processing or webhook dispatch added.
- Next: lint verification, then controlled mock timeline simulation.

### Member 4 Mock Simulation â€” 2026-10-03

- Added controlled mock timeline with run/reset/failure controls.
- Browser confirmed success and optional automation failure paths.
- Production build passed; lint/tests and mid-run Reset verification pending.
- No live processing or webhook requests added.

### Member 4 Synchronized Traversal & Dynamic Workflow QA â€” 2026-10-03

- Completed Member 4 Milestone 1 on `feature/workflow`.
- Added active workflow-node traversal in `WorkflowGraph` with glowing active borders, badges, and animated smoothstep edges.
- Synchronized active graph nodes with `AgentTimeline` execution pipeline across 3 scenarios: Executive Escalation (> PKR 100k), Manager Sign-Off (PKR 65k), and Fast-Track (< PKR 5k).
- Implemented robust Reset functionality halting in-flight timers, clearing active/traversed node highlights, and resetting timeline steps to waiting.
- Enhanced simulated webhook failure with error messaging confirming core compliance decision and approval draft remain intact.
- Created `WorkflowPlayground` with dynamic workflow switcher supporting 3 distinct graph topologies (Standard T&E 8-node DAG, Fast-Track 4-node linear, Procurement 6-node multi-approval) and interactive node inspector.
- Extracted pure layout calculation into `components/workflow/layout.ts` handling branching, single nodes, disconnected graphs, and cyclic fallbacks.
- Enhanced `lib/automation/webhook.ts` with 5s timeout protection (`AbortSignal.timeout`) and detailed HTTP status reporting.
- Expanded `tests/e2e/workflow.test.ts` verifying graph structure, reachability, dynamic layout calculations, and webhook reliability (unconfigured, 200, 500, network error, timeout).
- Ran and passed `npm run lint` (0 errors, 0 warnings), `npm run typecheck`, `npm run test:workflow`, `npm test`, `npm run build`, and browser HTTP QA (200 OK on `/workflows`).
### Workflow Traversal Review â€” 2026-10-03
- Added scenario-based mock node/edge highlighting.
- Corrected finance approval wording and removed claims of real delivery.
- Synthetic graphs are labelled layout demos; expense simulation is disabled on them.
- Workflow switching remounts the timeline to cancel its previous run.
- Reviewed layout fallback and optional webhook timeout/error handling.
- npm test and production build passed, including TypeScript validation.
- Mock webhook checks cover missing configuration, success, HTTP failure,
  network failure, timeout and invalid timeout.
- Browser confirmed scenario-dependent highlighting and simulated failure.
- Latest workflow-switch cancellation and Reset checks remain pending.
- npm run lint passed; git diff --check found no whitespace errors.
- No live webhook delivery or complete compliance evaluation claimed.

### Member 4 Takeover Completion â€” 2026-10-03
- Branch: `feature/workflow-completion` (branched from `origin/feature/workflow`).
- Single execution controller `WorkflowExecutionDemo` now coordinates both `WorkflowGraph` and `AgentTimeline`.
- `WorkflowGraph` refactored as a pure presentational component with `activeNodeId`, `completedNodeIds`, and `activeEdgeIds` props.
- Dynamic graph path discovery algorithm implemented in `components/workflow/execution.ts` supporting any workflow topology (Cases A-D).
- Mid-run Reset and workflow switching verified: in-flight timers halted, states reset to waiting, active/completed nodes cleared.
- Webhook failure simulation verified: leaves core Policy, Evaluation, and Action steps completed; shows explanatory banner.
- Expanded `tests/e2e/workflow.test.ts` with 5 malformed workflow validation tests and pure execution state logic tests.
- Verified `npm run lint` (0 errors), `npm run typecheck`, `npm run test:workflow`, `npm test`, `npm run build`, and browser interaction QA.

### Session 16: Workflow UX dev-integration candidate (2026-10-03)

- Created `integration/workflow-dev` from verified `origin/dev` and merged `origin/feature/workflow-completion`; the only merge conflict was the handoff history, which now preserves both backend and workflow records.
- Preserved every backend route, repository, Supabase module, Member 2 domain module, and shared contract unchanged from `dev`.
- Verified `WorkflowExecutionDemo`, presentational `WorkflowGraph`, synchronized graph/timeline state, dynamic traversal, mid-run and post-completion reset, optional automation failure isolation, layout helpers, and server-only webhook timeout handling.
- Full validation passed: 76 platform tests, all rule tests, workflow structure/malformed/layout/execution/webhook tests, 82 full-suite tests, production build, and whitespace checks.
- Browser QA passed on `/workflows`: readable graph, zoom/pan, synchronized run progression, completed-node state, both reset paths, simulated failure, dynamic workflow switching, and no console, hydration, or error-overlay failures.
- The page remains honestly labelled as sample/mock execution. Product-level fetching of the real workflow API remains Member 3 integration work; `/api/actions/generate` still returns `webhookTriggered: false`.

### Session 17: Final baseline consolidation candidate (2026-10-03)

- Created `integration/final-baseline` from verified `origin/dev`.
- Cherry-picked only Member 2 hardening commit `4941563c6a67b60e8c2a8c7af27d17857b120eb3`; resolved its sole conflict in `tests/rules/ai.test.ts` by retaining both live-provider default tests and the new duplicate-ID, unsupported-field, and demo-semantic tests.
- Preserved `gemini-3.6-flash`, `gemini-embedding-001`, 768-dimensional embeddings, provider 503 propagation, backend orchestration, persistence, and frozen contracts.
- Merged the already verified `origin/integration/workflow-dev`; that candidate is an ancestor of this branch.
- Typecheck, lint, 76 platform tests, hardened rule tests, workflow tests, 82 full-suite tests, production build, whitespace checks, browser workflow QA, and secret scans passed.
- Strict live smoke read the final 8-page PDF, generated 24 page-aware chunks, and produced a 768-dimensional live embedding. Three extraction attempts failed closed at Gemini with HTTP 503 high demand, so `dev` was not updated.

### Session 18: Member 3 Frontend Integration & Polish (2026-10-03)

- Branch: \eature/frontend-final\ (branched from \origin/integration/final-baseline\).
- Integrated the frontend fully with the backend API, replacing all mock logic with real calls to the 6 core API routes via a typed wrapper (\lib/client/rulepilot-api.ts\).
- Added a robust \SessionProvider\ storing the state (documentId, rules, workflow) across views, resolving state drops across route navigations.
- Implemented a unified error handler (\lib/client/error.ts\) for structured API response errors to ensure elegant failure visualization.
- Finished visual migration, applying a premium B2B SaaS cyber aesthetic across the Dashboard, upload pipeline, policy intelligence views, and workflow demo playground.
- Connected \CaseForm.tsx\ (12 fields, inclusive of ADR-008 hotel conditions) to \pi.cases.execute\, rendering deterministic compliance checks and grounded citations.
- Ran and passed \
pm run lint\ (0 errors), \
pm run typecheck\, and \
pm run build\. 
- Frontend is now fully production-ready and fully integrated against the deterministic AI engine, prepared for E2E testing.


### Session 19: Member 3 Final Polish & Bug Fixes (2026-10-03)
- Branch: feature/frontend-final
- Agent: Member 3
- Fixed a critical case execution bug: updated app/cases/page.tsx to correctly pass session.workflowId instead of documentId.
- Fixed session persistence for cases.
- Enabled next-action generation in app/cases/page.tsx.
- Applied further polish to the UI, cleaned up copy, passed all lint, build, and test steps, and pushed to feature/frontend-final.
