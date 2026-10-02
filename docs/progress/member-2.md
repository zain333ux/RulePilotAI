# Role
**Member 2 — AI / RAG / Rule Engine**

---

# Current Objective
Extract structured `PolicyRule[]` from policy text using Google Gemini with structured JSON schemas, and test against ground truth rules.

---

# Owned Folders & Boundaries
- `lib/ai/`
- `lib/rag/`
- `lib/rules/`
- `lib/embeddings/`
- `tests/rules/`

---

# First Recommended Task
Connect Google Gemini API to parse sample expense policy text into a validated array of `PolicyRule[]`:
1. Use `GEMINI_API_KEY`.
2. Provide Gemini with a structured system prompt and JSON schema matching `PolicyRule[]`.
3. Test against sample policy text and compare against `mocks/policy-rules.json`.

---

# Definition of Done for First Milestone
- [ ] Plain text from sample expense policy submitted to `extractPolicyRulesFromText(text)` returns a valid `PolicyRule[]`.
- [ ] Returned rules contain all 6 agreed hackathon demo rules (`EXP-001` through `EXP-006`).
- [ ] Citations include verified `page`, `section`, and `text` excerpts grounded in the policy text (no hallucinations).
- [ ] `npm run test:rules` passes deterministically against all test fixtures.

---

# Completed
- Frozen contracts defined in `types/contracts.ts` (`PolicyRule`, `RuleOperator`, `Citation`, `CaseResult`).
- **Partial** deterministic rule evaluation engine in `lib/rules/engine.ts` (EXP-001/002/003/006 only; EXP-004 blocked on ADR-008 hotel fields; EXP-005 not yet coded).
- Ground truth mock rules created in `mocks/policy-rules.json` (demo-policy citations — not live PDF RAG).
- Ground truth test fixtures created; approval case uses **Client Entertainment** category.
- Automated test suite in `tests/rules/engine.test.ts` running with `npm run test:rules`.
- AI/RAG/embedding stubs throw until implemented — do not return fabricated evidence.
- `POST /api/cases/execute` and related AI routes return **501** until you wire them.

---

# In Progress
- Integrating Google Gemini API (`@google/genai` or direct REST) with structured JSON output schema.

---

# Files Created/Modified
- `lib/rules/engine.ts`
- `tests/rules/engine.test.ts`
- `lib/ai/gemini.ts`
- `lib/rag/retriever.ts`
- `lib/embeddings/generator.ts`
- `mocks/policy-rules.json`

---

# APIs / Interfaces Used
- `PolicyRule`, `Citation`, `ExpenseCase`, `CaseResult` from `types/contracts.ts`
- Google Gemini API (`gemini-1.5-flash` or `gemini-2.0-flash` with structured outputs)

---

# Important Decisions
- Core Rule: The LLM extracts and interprets policy text into structured JSON; deterministic TypeScript code evaluates numerical and logical operators against business cases.
- Embeddings dimension: 768 (`text-embedding-004`).

---

# Tests Run
- `npm run test:rules` via tsx.

---

# Test Results
- Approved Case: Status = `APPROVED`, 0 violations.
- Approval Required Case (PKR 68,000): Status = `ACTION_REQUIRED`, 1 violation (`EXP-002`).
- Multiple Violations Case (PKR 120,000): Status = `ACTION_REQUIRED`, 3 violations (`EXP-001`, `EXP-002`, `EXP-003`).
- 100% test pass rate.

---

# Known Problems
- None. `GEMINI_API_KEY` required in `.env.local` for live LLM extraction calls.

---

# Dependencies on Other Members
- Member 1 for Supabase pgvector table access during RAG phase (works against mock in interim).

---

# Next Exact Steps
1. Add `GEMINI_API_KEY` in `.env.local`.
2. Implement Gemini structured output extraction in `lib/ai/gemini.ts`.
3. Implement text chunker preserving page numbers and headers.
4. Implement vector embedding generation in `lib/embeddings/generator.ts`.

---

# Session History
- **Setup Session:** Created deterministic rule engine, rule unit tests, mock rules fixture, and AI module stubs.
