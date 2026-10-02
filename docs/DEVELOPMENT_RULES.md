# RulePilot AI — Development Rules & Working Protocol

All team members (human developers and coding AI agents) MUST read, understand, and strictly comply with these rules.

---

## Mandatory Reading Order Before Any Coding Session

Before starting any future coding session or prompt, you MUST read the following documents in order:
1. **PRD** (`RulePilot AI — PRD.html`)
2. **Member-wise implementation plan / Playbook** (`RulePilot_AI_Team_Implementation_Playbook.docx`)
3. `docs/DEVELOPMENT_RULES.md` (this file)
4. `docs/AGENT_HANDOFF.md`
5. Your assigned progress file (`docs/progress/member-X.md`)

---

## The 18 Team Rules

1. **Four developers are working in parallel.** Work within your assigned ownership boundary. Never make assumptions about another member's ongoing work.
2. **Do not perform broad unrelated refactors.** Only change files within your designated subsystem or feature branch.
3. **Do not rename shared folders without a team decision.** The shared folder structure (`app/`, `components/`, `lib/`, `types/`, `mocks/`, `supabase/`, `tests/`) is frozen.
4. **Do not change the agreed technology stack.** The stack is Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui primitives, Supabase (PostgreSQL, Storage, pgvector), Google Gemini API, React Flow (`@xyflow/react`), and Vercel.
5. **`/types/contracts.ts` is a shared frozen contract.** All data models exchanged between subsystems (`PolicyRule`, `WorkflowDefinition`, `ExpenseCase`, `CaseResult`, `Citation`, etc.) must strictly adhere to this file.
6. **Changes to contracts must be explicitly documented.** Never silently modify `types/contracts.ts`. Any necessary changes require team consensus and an update in `docs/PROJECT_DECISIONS.md`.
7. **Build against mocks if another person's subsystem is unavailable.** Every developer has dedicated mock data in `/mocks`. Never block your work waiting for another member's live API or database.
8. **Do not expose secrets client-side.** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must strictly be accessed only in server-side API routes or Server Actions. Never prefix them with `NEXT_PUBLIC_` or import them in client components (`"use client"`).
9. **Never commit `.env.local` or secret files.** All secret values remain local. Only update `.env.example` with variable names (never values).
10. **Keep modules isolated.** Maintain clear interfaces so modules can be developed, tested, and updated independently.
11. **Run lint/typecheck/build before declaring work complete.** Every coding agent must verify with `npm run typecheck`, `npm run lint`, and `npm run build` (or relevant test suites) before stopping work.
12. **Update the relevant progress markdown before stopping work.** Every member agent must update `docs/progress/member-X.md` after every meaningful milestone with detailed technical context.
13. **Update `docs/AGENT_HANDOFF.md` whenever overall project state changes.** Reflect newly completed features, updated blockers, or architecture adjustments in the master handoff file.
14. **Do not delete another member's work to solve local issues.** Resolve problems within your own module's boundary.
15. **Prefer a working hackathon MVP over unnecessary abstractions.** Build the narrow, reliable, high-impact hero demo. Avoid over-engineering.
16. **No microservices for the MVP.** RulePilot AI is a single unified Next.js repository deployed directly on Vercel.
17. **AI interprets policy; deterministic code executes structured rules wherever possible.** The LLM understands natural-language policy text and outputs structured JSON rules. JavaScript/TypeScript executes thresholds, logic operators, and case compliance. RAG provides grounded page and section evidence.
18. **Never fabricate policy citations, page numbers, thresholds, or sections.** If citation metadata or evidence is missing or uncertain, mark it explicitly as unverified rather than hallucinating facts.
