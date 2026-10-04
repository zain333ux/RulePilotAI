# RulePilot AI — Project Decisions & Architectural Records (ADR)

This document tracks all foundational architectural, technical, and interface decisions agreed upon for RulePilot AI.

---

## ADR-001: Unified Monolith with Next.js App Router
- **Status:** Accepted / Frozen
- **Context:** A 36-hour hackathon requires minimal operational overhead and zero inter-service deployment complexity.
- **Decision:** Build a single unified Next.js (TypeScript) project using the App Router. Deployable directly to Vercel with zero infrastructure cost.
- **Consequences:** Backend API routes live under `app/api/`, shared libraries in `lib/`, and frontend pages in `app/`. No separate microservices or separate backend servers.

---

## ADR-002: AI Interprets Policy; Deterministic Code Executes Rules
- **Status:** Accepted / Core Principle
- **Context:** LLMs are prone to hallucinations, non-deterministic number comparisons, and fluctuating edge-case logic when directly evaluating monetary business compliance.
- **Decision:**
  1. **Google Gemini LLM** is strictly used to parse unstructured natural language policy documents into structured JSON (`PolicyRule[]`).
  2. **Deterministic application code** (`lib/rules/engine.ts`) executes mathematical and logical operators (`>`, `<`, `>=`, `<=`, `==`, `!=`) against business case inputs (`ExpenseCase`).
  3. **RAG & pgvector** retrieve grounded page-aware snippets (`Citation`) as audit evidence.
- **Consequences:** The same validated inputs produce repeatable decisions. Correctness still depends on complete rule execution and verified source evidence.

---

## ADR-003: Frozen Shared Contracts (`types/contracts.ts`)
- **Status:** Accepted / Frozen
- **Context:** 4 developers are building asynchronously. Contract mismatches will break parallel development.
- **Decision:** The interfaces in `types/contracts.ts` are frozen:
  - `Citation { page: number; section?: string; text: string; }`
  - `RuleOperator = ">" | "<" | ">=" | "<=" | "==" | "!="`
  - `PolicyRule { id: string; name: string; field: string; operator: RuleOperator; value: string | number | boolean; action: string; citation: Citation; }`
  - `WorkflowNodeType = "start" | "condition" | "action" | "approval" | "end"`
  - `WorkflowNode { id: string; type: WorkflowNodeType; label: string; ruleId?: string; }`
  - `WorkflowEdge { id: string; source: string; target: string; label?: string; }`
  - `WorkflowDefinition { nodes: WorkflowNode[]; edges: WorkflowEdge[]; }`
  - `ExpenseCase { employeeName: string; category: string; amount: number; receipt: boolean; managerApproval: boolean; financeApproval: boolean; internationalTravel: boolean; preApproval: boolean; expenseDate: string; submissionDate: string; hotelNightlyRate?: number; hotelNights?: number; }`
  - `RuleViolation { ruleId: string; message: string; action: string; citation: Citation; }`
  - `CaseStatus = "APPROVED" | "ACTION_REQUIRED" | "REJECTED"`
  - `CaseResult { status: CaseStatus; violations: RuleViolation[]; }`
- **Consequences:** All members develop against these exact interfaces. Any change requires explicit consensus and documentation in this file.
- **Additive update (2026-10-02):** Optional hotel fields added under ADR-008 (team consensus before parallel split).

---

## ADR-004: Ground-Truth Hackathon Demo Rules & Fixtures
- **Status:** Accepted / Frozen
- **Context:** The live demo requires consistent, predictable execution against a sample Employee Travel & Expense Policy.
- **Agreed Rules:**
  1. `EXP-001`: Receipt required above PKR 5,000.
  2. `EXP-002`: Manager approval required above PKR 50,000.
  3. `EXP-003`: Finance approval required above PKR 100,000.
  4. `EXP-004`: Hotel expenses cannot exceed PKR 25,000/night.
  5. `EXP-005`: Expense claims must be submitted within 14 days.
  6. `EXP-006`: International travel requires pre-approval.
- **Executable rule semantics (partial engine today):**
  - `EXP-001`–`EXP-003`: amount thresholds + boolean attachment flags (`receipt`, `managerApproval`, `financeApproval`).
  - `EXP-006`: `internationalTravel == true` implies `preApproval` must be true.
  - `EXP-004` (agreed semantics, Member 2 to implement): if `hotelNightlyRate` is provided and `hotelNightlyRate > 25000`, violate. Field on `PolicyRule` is `hotelNightlyRate`. Do **not** compute rate from `amount / hotelNights`. Do **not** assume 1 night. `hotelNights` is optional supporting metadata for UI/display.
  - `EXP-005`: Member 2 to implement calendar-day delta `expenseDate` → `submissionDate` vs 14 days.
- **Citation provenance:** Citations in `mocks/policy-rules.json` are **demo-policy references** (fake Employee Travel & Expense Policy pages/sections). They are internally consistent for the hackathon demo. They did **not** come from a real uploaded PDF. Never present them as live RAG evidence until Member 2 retrieves real chunks.
- **Agreed Demo Test Cases:**
  - **Case A (Approved):** PKR 4,500, category Meals, no receipt (under threshold), dates within 14 days. Passes implemented rules. (`mocks/approved-case.json`)
  - **Case B (Manager Approval Required):** PKR 68,000, category **Client Entertainment**, receipt yes, manager no. Violates `EXP-002` only. (`mocks/approval-required-case.json`)
  - **Case C (Multiple Violations):** PKR 120,000, no receipt/manager/finance, expenseDate `2026-09-25` → submissionDate `2026-10-02` (within 14 days so EXP-005 does not fire when implemented). Violates `EXP-001`, `EXP-002`, `EXP-003`. (`mocks/multiple-violations.json`)
  - **Hotel (EXP-004) fixtures:** Member 2/3 may add optional hotel fixtures using `hotelNightlyRate` / `hotelNights`. Existing Cases A–C omit hotel fields (undefined = EXP-004 does not apply).

---

## ADR-008: Hotel Nightly Cap — Additive ExpenseCase Fields
- **Status:** Accepted / Frozen (team consensus 2026-10-02)
- **Context:** Demo rule `EXP-004` caps hotel at PKR 25,000 **per night**. Total `amount` alone cannot express a nightly rate without forbidden assumptions.
- **Decision (agreed fields):**
  ```ts
  hotelNightlyRate?: number; // PKR per night — primary EXP-004 input
  hotelNights?: number;      // optional supporting metadata (UI / totals display)
  ```
  - **Evaluation rule:** `hotelNightlyRate > 25000` → violation (`EXP-004`).
  - **Mock rule field:** `PolicyRule.field = "hotelNightlyRate"` (updated in `mocks/policy-rules.json`).
  - **Rejected alternatives:** deriving rate from `amount / nights`; `hotelTotalAmount` as the sole comparator; assuming 1 night when nights are missing.
  - **When fields are omitted:** EXP-004 does not fire (non-hotel claims).
- **Owner follow-through:**
  - **Member 2:** implement EXP-004 in `lib/rules/engine.ts` + tests using `hotelNightlyRate`.
  - **Member 3:** expose optional hotel inputs on the expense form when category is hotel/lodging.
- **Consequences:** Contract is frozen; Members 2 and 3 must not invent competing hotel field names.

---

## ADR-009: API Scaffolds Return HTTP 501
- **Status:** Accepted
- **Context:** Fake success responses (mock storage URLs, fabricated chunk counts, partial rule evaluation that skipped hotel/deadline) are unsafe starting contracts.
- **Decision:** All six `app/api/**` scaffolds return `{ success: false, code: "NOT_IMPLEMENTED" }` with HTTP **501**. Member 1 implements handlers using the other members' domain functions. Parallel UI work uses `/mocks`, including explicit expected case results; the partial engine remains a Member 2 prototype.
- **Consequences:** No endpoint pretends production behavior during foundation phase.

---


## ADR-005: Database Schema & Vector Search (Supabase + pgvector)
- **Status:** Accepted
- **Context:** Need storage for uploaded PDFs, page-aware text chunks, vector embeddings for citation search, structured rules, workflows, and evaluation histories.
- **Decision:**
  - Supabase PostgreSQL with the `vector` extension installed in the `extensions` schema (`vector(768)` as the repository dimension contract; Member 2 must select a currently supported model and explicitly request/verify 768 output dimensions).
  - Storage bucket: `policies`.
  - Tables: `documents`, `document_chunks`, `policy_rules`, `workflows`, `cases`, `case_results`.
  - Migration script: `supabase/migrations/20261002000000_initial_schema.sql`.
  - Client separation: `lib/supabase/client.ts` uses only public browser credentials; `lib/supabase/server.ts` is a server-only anon-key client that respects RLS; `lib/supabase/admin.ts` is the only service-role client and is reserved for trusted persistence adapters. All factories fail with named configuration errors when required values are missing.
  - Live status (2026-10-03): both schema files were executed through the Supabase SQL Editor for the `RulePilotAI` project. SQL verification confirmed all six tables, five foreign keys, required CHECK/UNIQUE constraints, pgvector 0.8.2 in `extensions`, `document_chunks.embedding vector(768)`, the RPC, RLS, and service-role-only table access. The private `policies` bucket is limited to 4 MiB PDFs.

---

## ADR-006: React Flow for Visual Workflow Graph
- **Status:** Accepted
- **Context:** Clear visual workflow is a primary differentiator and hackathon "wow" factor.
- **Decision:** Use `@xyflow/react` (React Flow 12) for rendering the workflow nodes and edges derived from `WorkflowDefinition`.

---

## ADR-007: Optional Webhook Automation Fallback
- **Status:** Accepted
- **Context:** External automation (Make/Zapier) can experience network delays, quota limits, or configuration failures during live judging.
- **Decision:** The core RulePilot AI pipeline MUST work completely standalone without external services. Webhook notifications are purely an optional bonus trigger (`lib/automation/webhook.ts`) that will never block or break the evaluation loop.

## ADR-010: Integration envelopes and one route owner

- Accepted during the 2026-10-02 readiness review, before member implementation. `types/contracts.ts` is unchanged. New `types/api.ts` freezes HTTP envelopes in `docs/API_CONTRACTS.md`.
- Member 1 owns all route handlers and API transport tests. Member 2 supplies domain functions; Member 4 supplies renderer and optional automation functions. This resolves conflicting route comments and API ownership labels.
- Workflow generation returns workflowId; execution accepts `{ workflowId, expenseCase }` and returns caseId. Action generation accepts caseId and loads the authoritative stored result. This ties document, workflow, case and result together without changing domain types.
- No metadata-only upload success and no client-supplied rule/result overrides. Private bucket paths persist; signed URLs are temporary. Use a 4 MiB function upload limit; direct uploads for larger PDFs need a coordinated follow-up.
- Target errors use ApiError. Initial routes were 501 scaffolds. As of 2026-10-03, document upload, case execution, and action generation are real; document processing, rule extraction, and workflow generation remain 501.
- For future execution: hotel/lodging input missing hotelNightlyRate is invalid, not a non-hotel exemption. The optional field keeps non-hotel fixtures valid. Finite nonnegative amounts/rates, real ISO calendar dates, nonnegative date deltas and positive integer supplied nights are required.
- Target status mapping: all clear APPROVED; missing prerequisites ACTION_REQUIRED; hotel cap/late claim REJECTED, with all violations retained. Unsupported rules or unresolved citations return a 422 error, never automatic approval.

## ADR-011: Shared files and integration workflow

- Follow the playbook: feature/* branches merge into dev; the integration lead validates dev before merging into main. A branch name in documentation does not mean it already exists.
- Each developer uses a separate clone or worktree. Shared package files, lockfile, config and contracts require coordination. Member 1 coordinates dependencies, CI and deployments; Member 3 owns shared UI primitives/root layout; Member 4 owns app/workflows.
- Add root AGENTS.md to route future coding agents into the persistent handoff system. Member progress files are starter templates, not claims of active work.
- UI development uses static CaseResult examples. Existing partial rule code is preserved for Member 2 but is not a complete compliance service.
- Server-only imports enforce the boundary around secrets. `.env*` is ignored except `.env.example`.

## ADR-012: Database access baseline

- Keep private policy storage, enable RLS on the six tables, and restrict table/RPC access to the server service role through the additive migration 20261002010000_server_access.sql. No auth or user policy system is introduced.
- The migration is prepared but not live-tested. Member 1 applies both migrations and verifies access before using public credentials. Original schema relationships remain unchanged.
- The repository pins the 768-dimensional storage shape, not a provider model. Member 2 chooses a supported model and verifies output size before embedding real chunks.

Implementation references checked during review: [Next.js server/client boundaries](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector), [shadcn manual configuration](https://ui.shadcn.com/docs/installation/manual).

---

## ADR-013: Policy extraction provider recovery

- **Status:** Accepted on 2026-10-04 for demo reliability.
- **Context:** The production Gemini generation endpoint returned repeated HTTP 503 responses during rule extraction. Upload, PDF processing, embeddings, Supabase persistence, and the remaining API routes were healthy.
- **Decision:** Retry Gemini rule extraction twice after HTTP 503 with short bounded delays. Do not retry Gemini HTTP 429 responses. When Gemini still returns 503, or returns 429, use Groq only when the server-only `GROQ_API_KEY` is configured. The default Groq model is `openai/gpt-oss-20b` and can be overridden with `GROQ_MODEL`.
- **Safety:** Groq is an extraction transport fallback only. Its output passes the same `PolicyRule` validation, supported-field and duplicate-ID checks, strict source-page citation grounding, demo semantic validation, and atomic persistence as Gemini output. Groq does not replace the Gemini 768-dimensional embedding path. Provider keys remain server-only.
- **Consequence:** A temporary Gemini generation outage no longer stops rule extraction when Groq is configured. If neither provider succeeds, the route still fails closed and existing persisted rules remain unchanged.
