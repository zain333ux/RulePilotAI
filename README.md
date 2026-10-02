# RulePilot AI

> **Companies already have rules. RulePilot makes those rules executable.**

RulePilot AI is an agentic business-process automation platform built for a 36-hour hackathon. Upload a policy or SOP PDF, extract business rules as structured logic, generate a visual workflow, submit a business case, and receive a deterministic decision with exact document citations.

---

## 🚀 Core MVP Flow

```
Upload Expense Policy PDF
        ↓
Extract Rules + Citations (Gemini AI)
        ↓
Generate Visual Workflow (React Flow)
        ↓
Submit Expense Case
        ↓
Deterministic Rule Engine Evaluation
        ↓
Decision + Exact Policy Evidence
        ↓
Generate Next Action (Approval Request)
        ↓
Optional Make/Zapier Webhook
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Application | Next.js 16 + TypeScript (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui + Lucide React |
| Workflow Visualization | React Flow (`@xyflow/react`) |
| AI / LLM | Google Gemini API (structured JSON outputs) |
| Database & Storage | Supabase PostgreSQL + Storage |
| Vector Search | Supabase pgvector (768-dim embeddings) |
| Deployment | Vercel |
| Automation (optional) | Make / Zapier webhook |

---

## 📁 Project Structure

```
rulepilot-ai/
├── app/
│   ├── dashboard/          # Member 3 — Dashboard UI
│   ├── policies/upload/    # Member 1 & 3 — PDF upload
│   ├── workflows/          # Member 4 — React Flow workflow
│   ├── cases/              # Member 2 & 3 — Case execution
│   └── api/                # Member 1 — Backend API routes
├── components/
│   ├── ui/                 # Shared UI primitives
│   ├── layout/             # Shared layout (Navbar)
│   ├── policy/             # Member 3 — Policy cards
│   ├── cases/              # Member 3 — Expense form
│   ├── workflow/           # Member 4 — React Flow nodes
│   └── agents/             # Member 4 — Agent timeline
├── lib/
│   ├── ai/                 # Member 2 — Gemini extraction
│   ├── rag/                # Member 2 — pgvector retrieval
│   ├── rules/              # Member 2 — Deterministic engine
│   ├── embeddings/         # Member 2 — Vector generation
│   ├── supabase/           # Member 1 — DB clients
│   └── automation/         # Member 4 — Webhooks
├── types/
│   └── contracts.ts        # ⚠️ FROZEN — Shared data contracts
├── mocks/                  # Shared demo fixtures
├── tests/
│   ├── rules/              # Rule engine unit tests
│   └── e2e/                # End-to-end flow tests
├── supabase/
│   └── migrations/         # SQL schema and pgvector setup
└── docs/                   # Architecture, handoffs, team docs
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js 24 LTS (reviewed with 24.15.0)
- npm v11+
- Supabase and Gemini credentials only for live member milestones; foundation builds/tests need neither.

### 1. Clone & Install

```bash
git clone https://github.com/zain333ux/RulePilotAI.git
cd RulePilotAI
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

```env
# SERVER-ONLY — never use NEXT_PUBLIC_ prefix
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MAKE_WEBHOOK_URL=your_optional_make_webhook_url

# Public (browser-safe)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Server-only secrets:** `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_WEBHOOK_URL`  
**Never commit** `.env.local`. The repo builds and tests without credentials (APIs return HTTP 501).

### 3. Database Setup

1. Create a Supabase project.
2. Run `supabase/migrations/20261002000000_initial_schema.sql` in the SQL editor.
3. Create a private Storage bucket named `policies`; see `supabase/README.md` for setup and mapping details.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Agent / human reading order

1. `RulePilot AI — PRD.html`
2. `RulePilot_AI_Team_Implementation_Playbook.docx`
3. `docs/DEVELOPMENT_RULES.md`
4. `docs/AGENT_HANDOFF.md`
5. `docs/progress/member-X.md` (your assignment)

---

## 🧪 Testing

```bash
# Run deterministic rule engine unit tests
npm run test:rules

# TypeScript type checking
npm run typecheck

# ESLint
npm run lint

# Production build
npm run build
```

---

## 👥 Team Ownership

| Member | Role | Branch | Owned Areas |
|---|---|---|---|
| Member 1 | Platform / Backend | `feature/platform` | `app/api/`, `lib/supabase/`, `supabase/` |
| Member 2 | AI / RAG / Rule Engine | `feature/ai-engine` | `lib/ai/`, `lib/rag/`, `lib/rules/`, `lib/embeddings/` |
| Member 3 | Frontend / Product UI | `feature/frontend` | `app/dashboard/`, `app/policies/`, `app/cases/`, `components/layout/`, `components/policy/`, `components/cases/`, `components/ui/` |
| Member 4 | Workflow / Agent UX | `feature/workflow` | `components/workflow/`, `components/agents/`, `lib/automation/` |

> ⚠️ `types/contracts.ts` is a **frozen shared contract**. Changes require team consensus.

---

## 📚 Documentation

| File | Purpose |
|---|---|
| `docs/AGENT_HANDOFF.md` | Master handoff for AI agents and team members |
| `docs/ARCHITECTURE.md` | System architecture and design principles |
| `docs/API_CONTRACTS.md` | Request/response schemas for all endpoints |
| `docs/DEVELOPMENT_RULES.md` | 18 team rules all members must follow |
| `docs/PROJECT_DECISIONS.md` | Architectural decision records (ADRs) |
| `docs/MEMBER_OWNERSHIP.md` | Module ownership boundaries |
| `docs/progress/member-X.md` | Per-member progress tracking |

---

## 🎯 Demo Cases

| Case | Input | Expected Result |
|---|---|---|
| Approved | PKR 4,500, no receipt | `APPROVED` (under receipt threshold) |
| Manager Approval | PKR 68,000, receipt ✓, manager ✗ | `ACTION_REQUIRED` → manager approval |
| Multiple Violations | PKR 120,000, no receipt, no manager/finance | `ACTION_REQUIRED` → 3 violations |

---

## 🔑 Core Design Principle

> **LLM = interprets natural-language policy.**  
> **Deterministic application code = executes structured rules.**

The same validated inputs should produce repeatable results. The current engine is partial; full evaluation and live evidence remain member work.

## Current foundation and parallel start

All six APIs deliberately return HTTP 501. AI and RAG functions are explicit stubs. The workflow test validates fixture data, not browser rendering. Supabase SQL has not been applied or live-tested. Read docs/AGENT_HANDOFF.md for the latest verified status.

The shared domain types include agreed hotelNightlyRate and hotelNights fields. HTTP envelopes are separately frozen in types/api.ts. Member 1 owns every route; Members 2 and 4 supply domain functions. Offline screens use mocks/case-results.json instead of the incomplete engine.

The integration lead merges the reviewed foundation, creates dev from accepted main, and shares that baseline. Each member uses a separate clone/worktree and creates their feature branch from dev. Pull requests target dev; integration validation precedes main, as the team playbook specifies. Branches are not automatically created for other members.

Run all checks:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

The repository retains ignore-scripts=true in .npmrc. Verify any dependency requiring a native install step before adding it; do not enable all dependency scripts to work around one package.

See docs/MEMBER_OWNERSHIP.md for shared files, AGENTS.md for future coding agents, and docs/API_CONTRACTS.md for request/error semantics.
