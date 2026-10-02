# RulePilot AI — Team Member Module Boundaries & Ownership

To enable four developers and their AI coding agents to work in parallel without merge conflicts or broken builds, code ownership is partitioned into four distinct modules.

---

## Member 1 — Platform / Backend / Supabase
- **Primary Branch:** `feature/platform`
- **Owned Directories & Files:**
  - `app/api/` (API routes implementation & routing)
  - `lib/supabase/` (Supabase client/server setup)
  - `supabase/` (PostgreSQL schemas, migrations, pgvector)
  - Database-related infrastructure & Vercel deployment settings
- **Avoid Modifying:**
  - Gemini prompts, RAG chunking logic, React Flow internals, visual UI styling.
- **First Milestone:**
  - PDF upload → Supabase storage → create `documents` record in DB → return mock API response.

---

## Member 2 — AI / RAG / Rule Engine
- **Primary Branch:** `feature/ai-engine`
- **Owned Directories & Files:**
  - `lib/ai/` (Gemini API integration & structured JSON extraction)
  - `lib/rag/` (Policy chunking, evidence retrieval, citation lookup)
  - `lib/rules/` (Deterministic rule evaluation engine)
  - `lib/embeddings/` (Vector embeddings generation)
  - `tests/rules/` (Unit tests for rule evaluation)
- **Avoid Modifying:**
  - Dashboard UI components, React Flow renderers, Database migration scripts.
- **First Milestone:**
  - Sample policy text → Gemini structured extraction → valid `PolicyRule[]` passing unit tests.

---

## Member 3 — Frontend / Product UI
- **Primary Branch:** `feature/frontend`
- **Owned Directories & Files:**
  - `app/dashboard/` (Dashboard view)
  - `app/policies/` (Policy upload screen & policy intelligence display)
  - `app/cases/` (Case execution screens)
  - `components/layout/` (Navbar, sidebar, page wrappers)
  - `components/policy/` (Policy cards, citation viewers)
  - `components/cases/` (Expense form, result banners, violation lists)
  - `components/ui/` (Shared UI primitives)
- **Avoid Modifying:**
  - Gemini extraction logic, Supabase database schemas, React Flow node internals.
- **First Milestone:**
  - Complete main product UI screens using mock data (`/mocks`) without waiting for backend.

---

## Member 4 — Workflow / Agent UX / Automation / QA
- **Primary Branch:** `feature/workflow`
- **Owned Directories & Files:**
  - `components/workflow/` (React Flow renderer, custom nodes/edges)
  - `components/agents/` (Agent execution pipeline timeline)
  - `lib/automation/` (Optional Make/Zapier webhook triggers & fallbacks)
  - `tests/e2e/` (End-to-end demo flow tests)
  - `app/workflows/` (workflow page shell — coordinate with Member 3 on nav)
- **Avoid Modifying:**
  - Gemini extraction prompts, backend database schemas, product dashboard layout.
- **First Milestone:**
  - `WorkflowDefinition` mock (`mocks/workflow.json`) → rendered interactive React Flow graph.

---

## Shared (All Members)
- **`types/contracts.ts`** — frozen shared contracts. Changes require consensus + `docs/PROJECT_DECISIONS.md`.
- **`mocks/`** — shared demo fixtures for parallel work. Coordinate before changing ground-truth demo cases.
- **`docs/`** — handoff and architecture docs; update progress files in your own `docs/progress/member-X.md`.

## Integration files and handoffs

| Files | Owner / coordination |
| --- | --- |
| All app/api/, lib/api/, tests/foundation.test.ts | Member 1; imports domain functions from Members 2 and 4 |
| app/page.tsx, app/layout.tsx, app/globals.css, lib/utils.ts, components.json, components/ui/ | Member 3; coordinate public component APIs with Member 4 |
| app/workflows/, workflow renderer, agent timeline | Member 4; coordinate navigation with Member 3 |
| package.json, package-lock.json, tsconfig.json, next.config.ts, ESLint, CI | Member 1 coordinates; install dependencies one change at a time |
| types/contracts.ts, types/api.ts, mocks/ | Shared; document and agree changes before other branches depend on them |

Member 2 hands Member 1 tested functions from lib/ai, lib/rag, lib/embeddings and lib/rules. Member 1 writes the route adapters. Member 4 consumes WorkflowDefinition and AgentStep via props; Member 3 imports those components without editing their internals.

First checkpoints: M1 upload persistence, M2 sample text to rules, M3 mock screens, M4 mock graph. All can start without other members' completed modules. Live service tests still require the relevant credentials.

Use separate clones/worktrees. Branch from dev once the integration lead has merged the reviewed setup into main and created dev. Submit feature/platform, feature/ai-engine, feature/frontend and feature/workflow to dev; integrate and test before main. Do not have four agents switch branches in one shared working directory.
