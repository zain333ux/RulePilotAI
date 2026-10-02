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
- **Partial** deterministic rule evaluation engine in `lib/rules/engine.ts` (EXP-001/002/003/006 only; EXP-004/005 not yet coded).
- **ADR-008 frozen:** evaluate EXP-004 as `hotelNightlyRate > 25000` using optional `ExpenseCase.hotelNightlyRate` / `hotelNights`. Mock rule field is `hotelNightlyRate`.
- Ground truth mock rules created in `mocks/policy-rules.json` (demo-policy citations — not live PDF RAG).
- Ground truth test fixtures created; approval case uses **Client Entertainment** category.
- Automated test suite in `tests/rules/engine.test.ts` running with `npm run test:rules`.
- AI/RAG/embedding stubs throw until implemented — do not return fabricated evidence.
- `POST /api/cases/execute` and related AI routes return **501** until Member 1 integrates your functions.

---

# In Progress
No member-specific implementation is claimed yet. This is a starting template; update it after your first milestone.

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
- Google Gemini API: verify current model availability before implementation; no model is selected by this foundation.

---

# Important Decisions
- Core Rule: The LLM extracts and interprets policy text into structured JSON; deterministic TypeScript code evaluates numerical and logical operators against business cases.
- Embedding storage dimension: 768. Explicitly request and verify that output size with the chosen model; do not assume a provider default.

---

# Tests Run
- `npm run test:rules` via tsx.

---

# Test Results
- Approved Case: Status = `APPROVED`, 0 violations.
- Approval Required Case (PKR 68,000): Status = `ACTION_REQUIRED`, 1 violation (`EXP-002`).
- Multiple Violations Case (PKR 120,000): Status = `ACTION_REQUIRED`, 3 violations (`EXP-001`, `EXP-002`, `EXP-003`).
- These three tests cover the prototype only, not all rules or input boundaries.

---

# Known Problems
- Partial engine skips EXP-004/005 and ignores generic operators. Add boundary and unsupported-input tests before integrating it. GEMINI_API_KEY is needed for live extraction.

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

# Expected Output
Sample policy text produces validated PolicyRule[] with quotes verified against mocks/sample-expense-policy.txt. Hand tested functions to Member 1; do not edit route adapters.

## Starting coordination
Branch from accepted dev into feature/ai-engine. Follow docs/MEMBER_OWNERSHIP.md for shared files. Run lint, typecheck, tests and build before declaring the milestone complete; update this file after each meaningful step.
