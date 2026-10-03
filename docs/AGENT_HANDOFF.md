# RulePilot AI agent handoff

Read immediately after the PRD, then complete the playbook/development rules/member progress checklist before coding. Root AGENTS.md points here.

## CURRENT STATE

- Project: RulePilot AI.
- Phase: shared foundation review complete; product features remain member milestones.
- Current branch: shared baseline is `dev`; active Member 1 work is on `feature/platform`. Confirm `git status -sb` when resuming.
- Working architecture: one root Next.js 16.3.8 / React 19.2.8 / TypeScript / Tailwind v4 app, shadcn configuration, Supabase JS, React Flow, and Lucide. Supabase upload/persistence and the case/action APIs are live; PDF/AI route integration remains unfinished.
- Completed: requested folder structure, frozen domain types including ADR-008 hotel fields, typed HTTP envelopes in types/api.ts, six rules and workflow/case fixtures, live Supabase schema and restricted `policies` bucket, separated Supabase clients, real PDF upload, server-only repositories, atomic rule/chunk replacement, authoritative case execution, and deterministic action generation.
- Unfinished: the document-processing, rule-extraction, and workflow-generation routes; connected product UI; full workflow renderer; and optional automation.
- Known blockers: no blocker to case/action API development. The remaining three 501 routes need the accepted Member 2 exports from `origin/feature/ai-engine`; Gemini integration also needs its server credential.
- Known limitations: webhook dispatch remains disabled and `webhookTriggered` is always false. Case creation and result insertion are separate repository operations, so a result-insert failure can leave a persisted case without a result; the route returns 500 and logs the case ID. Use static expected result fixtures for mock UI until branches are integrated.
- Decisions: LLM interprets policy; deterministic code executes rules. Member 1 owns every route. Workflow/case IDs bind rules and decisions to their documents. Server-only secret modules; private policy storage and server-only DB access baseline. See ADR-010 through ADR-012.
- Environment: no credentials needed for build/unit tests. Server-only GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY and optional MAKE_WEBHOOK_URL; public NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. All `.env*` files are ignored except `.env.example`. Supabase credentials are configured locally and the live upload was manually verified; never print or commit them.
- Database: all four repository migrations were executed through the SQL Editor in the live `RulePilotAI` project on 2026-10-03. Live SQL confirmed all six tables, expected foreign keys and constraints, pgvector 0.8.2 in `extensions`, `vector(768)`, the atomic rule and chunk RPCs, RLS, and service-role-only access. Both replacement RPCs are `SECURITY INVOKER` and unavailable to anon/authenticated. The private `policies` bucket accepts PDFs up to 4 MiB. SQL Editor execution is not listed in dashboard migration history. Embedding model selection remains Member 2 work.
- API: document upload returns HTTP 201; case execution and action generation return HTTP 200 using authoritative persisted data. Document processing, rule extraction, and workflow generation remain explicit 501 scaffolds.
- Contract status: types/contracts.ts unchanged by this review. Additive types/api.ts formalizes transport envelopes; changes recorded in ADR-010. Mock citations are authored fictional demo references, never live PDF evidence.
- Packages: existing dependencies retained; added server-only (0.0.1) for framework-enforced import boundaries. package-lock.json updated.
- Tests: focused mocked tests cover upload, repositories, 14 case-execution scenarios, and 8 action-generation scenarios. The separate live repository smoke remains excluded from `npm test`. Three unfinished endpoints retain 501 coverage.
- Validation: typecheck, lint, 48 platform tests, 54 full-suite tests, and production build passed on 2026-10-03. Live SQL previously verified both atomic RPC signatures and grants.
- Last verified working commands: `npm run typecheck`; `npm run lint`; `npm run test:platform`; `npm test`; `npm run build`.
- Exact next task: integrate Member 2's `processPolicyPdf` with private Storage download and `replaceDocumentChunks` in `/api/documents/process` after the AI branch is accepted. Pull requests target `dev`.
- Parallel readiness: yes for independent mock-based work from the published dev baseline; the live MVP remains unfinished.

## 2. Chronological Session Log

### Session 1 — Initial Setup & Foundation
- **Date:** 2026-10-02
- **Agent:** Initial Setup Engineer
- **Summary:** Bootstrapped Next.js root app, contracts, mocks, docs, partial engine, API skeletons (then claiming success), migration, starter UI.

### Session 2 — Shared Foundation Review & Hardening
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

### Session 3 — ADR-008 Hotel Field Consensus
- **Date:** 2026-10-02
- **Agent:** Initial Setup Engineer
- **Summary:**
  - Froze additive ExpenseCase fields: `hotelNightlyRate?: number`, `hotelNights?: number`
  - EXP-004 evaluation: `hotelNightlyRate > 25000` (do not derive from amount/nights)
  - Updated `mocks/policy-rules.json` EXP-004 `field` → `hotelNightlyRate`
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
