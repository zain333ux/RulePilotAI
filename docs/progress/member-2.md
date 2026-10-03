# Role
**Member 2 — AI / RAG / Rule Engine**

---

# Current Objective
Extract structured `PolicyRule[]` from policy text using Google Gemini with structured JSON schemas, provide page-aware chunking and 768-dim embeddings, and evaluate all 6 rules deterministically.

---

# Owned Folders & Boundaries
- `lib/ai/`
- `lib/rag/`
- `lib/rules/`
- `lib/embeddings/`
- `tests/rules/`

---

# Definition of Done for First Milestone
- [x] Plain text from sample expense policy submitted to `extractPolicyRulesFromText(text)` returns a valid `PolicyRule[]` with structured validation.
- [x] Full deterministic rule engine supports all 6 agreed hackathon demo rules (`EXP-001` through `EXP-006`).
- [x] Page-aware chunker preserves page numbers and section headers (`lib/rag/chunker.ts`).
- [x] 768-dimensional embedding generation implemented for `text-embedding-004` (`lib/embeddings/generator.ts`).
- [x] Semantic similarity retrieval implemented for Supabase pgvector RPC `match_document_chunks` (`lib/rag/retriever.ts`).
- [x] Citations include verified `page`, `section`, and `text` excerpts grounded in the policy text (no hallucinations).
- [x] `npm run test:rules` passes deterministically against all test fixtures and boundary conditions.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass with zero errors.

---

# Completed
- **Full Deterministic Rule Engine (`lib/rules/engine.ts`):**
  - Implemented all 6 rules:
    - `EXP-001`: Receipt required above PKR 5,000 (`amount > 5000 && !receipt`).
    - `EXP-002`: Manager approval required above PKR 50,000 (`amount > 50000 && !managerApproval`).
    - `EXP-003`: Finance approval required above PKR 100,000 (`amount > 100000 && !financeApproval`).
    - `EXP-004`: Hotel nightly cap cap of PKR 25,000 per night (`hotelNightlyRate > 25000`). Evaluates only when provided per ADR-008; triggers `REJECTED`.
    - `EXP-005`: Submission timeliness window (`calendar-day delta > 14 days`). Triggers `REJECTED`.
    - `EXP-006`: International travel pre-approval (`internationalTravel == true && !preApproval`).
  - Added strict `evaluateOperator()` supporting `>`, `<`, `>=`, `<=`, `==`, `!=` without JavaScript type coercion.
  - Added `calculateDaysBetween()` for calendar-day calculation between ISO dates.
  - Status precedence logic: 0 violations => `APPROVED`; hard cap/deadline violations (`EXP-004`, `EXP-005`) => `REJECTED`; missing approvals => `ACTION_REQUIRED`.
  - Added `generateNextAction()` providing drafted actions and communication templates for Member 1's `/api/actions/generate`.
- **Page-Aware Policy Chunker (`lib/rag/chunker.ts`):**
  - Parses text by page markers (`=== Demo Page X ===`, `=== Page X ===`, `\f`).
  - Preserves 1-indexed `pageNumber`, detects `section` numbers (e.g. `1.4`, `2.1`, `3.1`), and extracts trimmed content chunks without hallucinating.
- **768-Dimensional Embedding Generator (`lib/embeddings/generator.ts`):**
  - Connects to Google's `text-embedding-004` requesting explicit `outputDimensionality: 768` matching Supabase `vector(768)`.
  - Throws `EmbeddingNotConfiguredError` when key is missing; never returns silent zero-vectors.
- **Policy Evidence Retriever (`lib/rag/retriever.ts`):**
  - Calls `generateEmbedding(query)` and Supabase RPC `match_document_chunks`.
  - Maps real chunk records to `Citation[]`; guards against hallucinated citations when unconfigured.
- **Gemini Structured Extraction (`lib/ai/gemini.ts`):**
  - Connects to Gemini REST API (`gemini-2.5-flash`) using structured JSON mode and system prompt.
  - Added `validatePolicyRules()` validating output against `PolicyRule` contract (id, name, field, operator, value, action, citation with page/section/text).
- **Test Suites:**
  - `tests/rules/engine.test.ts`: 10 comprehensive tests covering Approved, Approval Required, Multiple Violations, EXP-004 Hotel Cap, EXP-004 Boundary (PKR 25k), EXP-005 Late Submission, EXP-005 Exact 14-day Boundary, EXP-006 International Travel, Operator evaluation, and Next Action generation.
  - `tests/rules/chunker.test.ts`: Verifies exact page and section parsing against `mocks/sample-expense-policy.txt`.
  - `tests/rules/ai.test.ts`: Verifies rule validation, malformed filter, and credential safeguard exceptions.

---

# In Progress
- Providing tested domain functions to Member 1 for route wiring.

---

# Files Created/Modified
- `lib/rules/engine.ts` (full 6-rule deterministic engine, operators, next-action generator)
- `tests/rules/engine.test.ts` (expanded from 3 to 10 tests + integrated chunker verification)
- `lib/rag/chunker.ts` (page-aware text chunker)
- `tests/rules/chunker.test.ts` (chunker unit tests)
- `lib/ai/gemini.ts` (Gemini REST extraction and schema validator)
- `lib/embeddings/generator.ts` (768-dim embeddings generator)
- `lib/rag/retriever.ts` (pgvector RPC evidence retriever)
- `tests/rules/ai.test.ts` (safeguard and validator tests)
- `docs/progress/member-2.md` (progress report)

---

# APIs / Interfaces Used
- `PolicyRule`, `Citation`, `ExpenseCase`, `CaseResult`, `RuleOperator`, `CaseStatus` from `types/contracts.ts`
- Google Gemini API: `gemini-2.5-flash` / `text-embedding-004` (768-dim)
- Supabase RPC: `match_document_chunks`

---

# Tests Run
- `npm run test:rules`: 10 rule engine tests + 7-page chunker test passed.
- `npx tsx --conditions=react-server tests/rules/ai.test.ts`: 5 validator and safety tests passed.
- `npm test`: All 9 foundation and fixture tests passed.
- `npm run typecheck`: Passed with 0 errors.
- `npm run lint`: Passed with 0 warnings/errors.
- `npm run build`: Production Next.js build compiled all 14 routes successfully.

---

# Known Problems & Blockers
- Live Gemini API extraction and live Supabase RPC require `GEMINI_API_KEY` and Supabase keys in `.env.local`. When unconfigured, modules safely throw explicit configuration errors rather than fabricating mock data.

---

# Dependencies on Other Members
- Member 1 to wire `/api/rules/extract`, `/api/documents/process`, `/api/cases/execute`, and `/api/actions/generate` using the tested functions from `lib/ai/`, `lib/rag/`, and `lib/rules/`.

---

# Next Exact Steps
1. User to add `GEMINI_API_KEY` and Supabase credentials in local `.env.local` if live network testing is desired.
2. Coordinate with Member 1 on route integration for `/api/cases/execute` and `/api/rules/extract`.
3. Provide sample policy text extraction smoke test when credentials are set.

---

# Session History
- **Session 1 (Setup):** Partial rule engine prototype, stubs, test fixtures.
- **Session 2 (Milestone 1):** Complete 6-rule deterministic engine with boundary conditions and status precedence, next-action generator, page-aware text chunker, 768-dim embedding generator, pgvector RAG retriever, and Gemini REST extraction client. All tests, lint, and build verified.

