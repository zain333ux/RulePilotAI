# RulePilot AI — AI Agent Master Handoff

> **ATTENTION CODING AGENTS:**  
> This is the first file you must read after reading the PRD (`RulePilot AI — PRD.html`) and Team Implementation Playbook (`RulePilot_AI_Team_Implementation_Playbook.docx`).  
> Before writing any code, consult `docs/DEVELOPMENT_RULES.md` and your assigned progress file in `docs/progress/member-X.md`.

---

## 1. Current State (Latest Snapshot)

- **Project Name:** RulePilot AI
- **Current Phase:** Shared foundation review complete — ready for parallel development
- **Current Branch:** `main` (create feature branches from main after pull)
- **Current Working Architecture:**
  - Next.js 16 App Router + TypeScript + Tailwind CSS v4 + React 19 at repo root
  - Frozen contracts in `types/contracts.ts` (unchanged)
  - Realistic fixtures in `mocks/` (approval case = Client Entertainment, not Hotel)
  - Partial deterministic engine in `lib/rules/engine.ts` (EXP-001/002/003/006 only)
  - React Flow starter in `components/workflow/WorkflowGraph.tsx`
  - Supabase schema + pgvector in `supabase/migrations/20261002000000_initial_schema.sql`
  - All six API routes return **HTTP 501 NOT_IMPLEMENTED** (safe scaffolds)
  - AI/RAG/embedding stubs **throw** when called — no fabricated citations or zero-vector fakes
- **Completed Features:**
  - [x] Next.js foundation + Tailwind + shadcn-style `components.json` / button primitive
  - [x] Frozen `types/contracts.ts` + documented ADRs
  - [x] Mock rules, workflow, three expense fixtures
  - [x] Partial rule engine + `npm run test:rules`
  - [x] Workflow structure test + foundation 501 API tests
  - [x] Migration with CHECK/UNIQUE constraints + setup comments
  - [x] Env example + gitignore for secrets; server Supabase throws if unconfigured
  - [x] Starter UI pages marked as sample/unavailable where APIs are unfinished
  - [x] Full docs suite + progress handoff system
- **Current Unfinished Work (Members):**
  - Member 1: Real PDF upload → Storage `policies` → `documents` row
  - Member 2: Gemini extract, RAG, complete EXP-004/005 after hotel field agreement, wire `/api/cases/execute`
  - Member 3: Product UI against mocks, then APIs when ready
  - Member 4: Full React Flow custom nodes + timeline + optional webhook
- **Known Blockers:**
  - **ADR-008:** Hotel nightly cap needs additive ExpenseCase fields before EXP-004 demo
- **Known Bugs:**
  - None in foundation validation at last pass
- **Important Architectural Decisions:**
  - ADR-001 monolith · ADR-002 LLM interpret / code execute · ADR-003 frozen contracts
  - ADR-004 demo rules + citation provenance · ADR-005 Supabase/pgvector · ADR-006 React Flow
  - ADR-007 optional webhook · ADR-008 hotel field · ADR-009 API 501 scaffolds
- **Environment Variables Required (`.env.local`):**
  - Server-only: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_WEBHOOK_URL`
  - Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Database Status:** Migration ready; not applied until team creates Supabase project
- **API Status:** All six endpoints respond **501** with `code: "NOT_IMPLEMENTED"`
- **Tests Status:**
  - `npm run typecheck`: PASSED
  - `npm run lint`: PASSED (0 errors; unused-arg warnings cleaned)
  - `npm run test:rules`: PASSED (3/3)
  - `npm run test:workflow`: PASSED
  - `npm run test:foundation`: PASSED (6/6 HTTP 501 scaffolds)
  - `npm run build`: PASSED
- **Last Verified Working Command:** `npm run typecheck && npm run test && npm run build`
- **Exact Recommended Next Task:** Members 1–4 pull `main`, create `feature/platform` | `feature/ai-engine` | `feature/frontend` | `feature/workflow`, start first milestones in `docs/progress/member-X.md`

---

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
