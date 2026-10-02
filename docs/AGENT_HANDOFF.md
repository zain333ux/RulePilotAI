# RulePilot AI agent handoff

Read immediately after the PRD, then complete the playbook/development rules/member progress checklist before coding. Root AGENTS.md points here.

## CURRENT STATE

- Project: RulePilot AI.
- Phase: shared foundation review complete; product features remain member milestones.
- Current branch: dev. Shared baseline includes review commit d2b45b3 and this publication handoff. main and dev start from the same accepted foundation. Confirm `git status -sb` when resuming.
- Working architecture: one root Next.js 16.3.8 / React 19.2.8 / TypeScript / Tailwind v4 app, shadcn configuration, Supabase JS, React Flow, Lucide. SQL/AI integrations remain offline.
- Completed: requested folder structure, frozen domain types including ADR-008 hotel fields, typed HTTP envelopes in types/api.ts, six rules and workflow/case fixtures, sample policy text, expected case results, route scaffolds, Supabase migration files, agent handoff and member starting instructions.
- Unfinished: actual PDF upload/parsing, Gemini extraction, RAG/embeddings, persistence, complete deterministic engine, connected product UI, full workflow renderer, action generation and optional automation. Do not build unrelated features during setup.
- Known blockers: no blocker to independent mock development. Live integration needs Supabase/Gemini credentials and migration execution. The shared baseline is available through origin/dev after publication; member branches should start there.
- Known limitations: engine implements EXP-001/002/003/006 only and ignores generic operators; EXP-004/005 and input validation remain Member 2 work. Use static expected result fixtures for mock UI. Workflow fixture covers three threshold branches. Existing webhook helper is disconnected and needs timeout/failure tests. Browser visual QA and live database validation have not been performed in this review.
- Decisions: LLM interprets policy; deterministic code executes rules. Member 1 owns every route. Workflow/case IDs bind rules and decisions to their documents. Server-only secret modules; private policy storage and server-only DB access baseline. See ADR-010 through ADR-012.
- Environment: no credentials needed for build/tests. Server-only GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY and optional MAKE_WEBHOOK_URL; public NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. All .env* ignored except .env.example.
- Database: six-table schema + vector(768) RPC prepared. New server-access migration enables RLS and restricts table/RPC access. Neither migration has been executed here; follow supabase/README.md. Embedding model must be selected and dimension verified by Member 2.
- API: all six POST endpoints intentionally return 501 NOT_IMPLEMENTED. Target request/response/error shapes are in types/api.ts and docs/API_CONTRACTS.md; no processing occurs yet.
- Contract status: types/contracts.ts unchanged by this review. Additive types/api.ts formalizes transport envelopes; changes recorded in ADR-010. Mock citations are authored fictional demo references, never live PDF evidence.
- Packages: existing dependencies retained; added server-only (0.0.1) for framework-enforced import boundaries. package-lock.json updated.
- Tests: npm test passes three existing engine fixtures, existing workflow structural check, six API scaffold tests and three new fixture integrity tests. A CRLF-sensitive citation test failed initially and was corrected to normalize line endings. These checks do not prove six-rule execution or browser interaction.
- Validation: npm install server-only succeeded (0 audit vulnerabilities); lint/typecheck and production build passed. Initial install failed on sandbox network access and succeeded with permitted access. Production HTTP smoke checks passed: five page GETs returned 200 and all six API POSTs returned 501 with the expected error envelope. The first npm start invocation lost flags in PowerShell; direct Next CLI start succeeded.
- Last verified working commands: npm run lint; npm run typecheck; npm test; npm run build; node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100 (HTTP smoke checks passed).
- Exact next task: each member fetches origin, creates their assigned feature branch from origin/dev in a separate clone/worktree, and follows docs/progress/member-X.md. Use feature/platform, feature/ai-engine, feature/frontend or feature/workflow. Pull requests target dev.
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
### Member 4 Workflow Update — 2026-10-03

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