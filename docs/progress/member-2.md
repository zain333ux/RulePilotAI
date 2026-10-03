# Role
**Member 2 — AI / RAG / Deterministic Rule Engine**

---

# Current Objective
Provide complete, production-quality, page-aware AI, RAG, PDF processing, and deterministic rule evaluation domain modules for Member 1's API orchestration and Member 4's workflow visualization.

---

# Owned Folders & Boundaries
- `lib/ai/`
- `lib/rag/`
- `lib/rules/`
- `lib/embeddings/`
- `tests/rules/`
- `scripts/smoke-ai.ts`

Strict non-ownership:
- Do NOT edit `app/api/**` (Member 1 owns routes).
- Do NOT write Supabase persistence / repositories (Member 1 owns data persistence).
- Do NOT modify `types/contracts.ts` (Frozen shared contract).

---

# Completed Work & Hardening

### 1. Real PDF Text Extraction (`lib/rag/pdf-parser.ts`)
- Implemented `extractPdfPages(pdfBytes: Uint8Array): Promise<ExtractedPolicyPage[]>`.
- Uses server-only Node-compatible PDF parser (`unpdf`).
- Guarantees 1-based exact page numbers (`pageNumber: 1..N`).
- Direct digital text stream extraction (strictly NO OCR).
- Fails closed with typed `UnreadablePdfError` for empty or scanned/image-only PDFs.
- Never fabricates fake page numbers or synthetic content.

### 2. Real Page-Aware Chunking (`lib/rag/chunker.ts`)
- Implemented `chunkPolicyPages(pages: ExtractedPolicyPage[]): PolicyChunk[]`.
- Preserves exact source page per chunk; chunks NEVER cross page boundaries.
- Detects section numbers (e.g. `1.4`, `2.1`, `3.1`) without hallucinating.
- Filters out empty chunks while preserving source wording for citation grounding.
- Preserved existing `chunkPolicyText(rawText)` for backward compatibility.

### 3. Document Processing Domain Function (`lib/rag/processor.ts`)
- Implemented `processPolicyPdf(pdfBytes: Uint8Array): Promise<ProcessPolicyPdfResult>`.
- End-to-end domain pipeline:
  `PDF bytes -> extractPdfPages -> chunkPolicyPages -> generateEmbedding (768-dim) -> validate dimensions -> return chunks`.
- Pure domain-level processing with zero database calls, ready for Member 1's `POST /api/documents/process`.

### 4. Strict Citation Grounding & Source-Aware Gemini Extraction (`lib/ai/gemini.ts`)
- **Strict Duplicate Rule-ID Validation**:
  - `DuplicateRuleIdError`: Fails closed if AI extraction returns duplicate rule IDs.
- **Strict Supported Field Validation**:
  - `UnsupportedRuleFieldError`: Fails closed if AI extraction returns an unsupported field.
  - Allowed fields: `amount`, `hotelNightlyRate`, `expenseDate`, `submissionDate`, `submissionWindowDays`, `internationalTravel`, `receipt`, `managerApproval`, `financeApproval`, `preApproval`.
- **Strict Grounding Validation** (`validatePolicyRulesAgainstSource`):
  - Enforces citation page exists in source document.
  - Normalizes PDF line breaks and whitespace (`\s+ -> " "`) for robust comparison without allowing paraphrasing.
  - Rejects citations where text belongs to a different page (`CitationGroundingError`).
  - Rejects fabricated or hallucinated citations (`CitationGroundingError`).
  - Verifies section consistency when detectable.
- **Source-Aware Gemini Extraction** (`extractPolicyRulesFromPages`):
  - Formats page-marked text (`=== Page X ===`).
  - Calls Gemini REST API (`gemini-2.5-flash`) with structured JSON schema.
  - Validates `PolicyRule` schema, duplicate IDs, and supported fields.
  - Validates citation grounding against exact source pages.
  - Fails closed on malformed or ungrounded model output.

### 5. Corporate Demo Policy Semantic Validator (`lib/rules/demo-validator.ts`)
- Implemented `validateDemoExpensePolicyRules(rules: PolicyRule[]): PolicyRule[]`:
  - Decoupled from generic extraction pipeline so generic extraction remains usable for arbitrary policies.
  - Strictly verifies the 6 hackathon demo rules:
    - `EXP-001`: field=`amount`, operator=`>`, value=`5000`, action requires receipt
    - `EXP-002`: field=`amount`, operator=`>`, value=`50000`, action requires manager approval
    - `EXP-003`: field=`amount`, operator=`>`, value=`100000`, action requires finance approval
    - `EXP-004`: field=`hotelNightlyRate`, operator=`>`, value=`25000`
    - `EXP-005`: field in `[submissionWindowDays, submissionDate, expenseDate]`, operator=`>`, value=`14`
    - `EXP-006`: field=`internationalTravel`, operator=`==`, requires pre-approval
  - Throws `DemoPolicyValidationError` if any rule is missing or semantically invalid.

### 6. Deterministic Visual Workflow Generator (`lib/rules/workflow.ts`)
- Implemented `generateWorkflowFromRules(rules: PolicyRule[]): WorkflowDefinition`.
- Pure deterministic graph transformation:
  - Creates 1 `start` node (`Expense Submitted`).
  - Creates condition and action/approval nodes for each `PolicyRule`, preserving `ruleId`.
  - Distinguishes `approval` nodes (manager, finance, vp) from `action` nodes.
  - Creates 1 `end` node (`Claim Processing Complete`).
  - Generates valid directed branching edges.
  - **Fixed semantic labels**:
    - EXP-005 condition: `"Submission Delay > 14 Days?"` (Yes: `"Yes (> 14 Days)"` routes to review, No: `"No (<= 14 Days)"` compliant).
    - EXP-006 condition: `"International Travel Claim?"` (Yes: `"Yes (Requires Pre-Approval)"`, No: `"No (Domestic / Pre-Approved)"`).
    - Numeric thresholds: `"Yes (> 5,000)"`, `"No (<= 5,000)"`, etc.
  - Strictly unique node IDs (`nodeIds.size === nodes.length`) and edge IDs (`edgeIds.size === edges.length`).
  - Rejects duplicate rule IDs explicitly with `WorkflowGenerationError`.
  - Handles empty rule lists safely (`start -> end`).
  - Zero React Flow coordinates (pure domain definition for Member 4).

### 7. Full Deterministic Rule Engine (`lib/rules/engine.ts`)
- Evaluates all 6 agreed hackathon demo rules deterministically:
  - `EXP-001`: Receipt required above PKR 5,000 (`amount > 5000 && !receipt`).
  - `EXP-002`: Manager approval required above PKR 50,000 (`amount > 50000 && !managerApproval`).
  - `EXP-003`: Finance approval required above PKR 100,000 (`amount > 100000 && !financeApproval`).
  - `EXP-004`: Hotel nightly rate cap of PKR 25,000 per night (`hotelNightlyRate > 25000` per ADR-008). Triggers `REJECTED`.
  - `EXP-005`: Submission timeliness window (`calendar-day delta > 14 days`). Triggers `REJECTED`.
  - `EXP-006`: International travel pre-approval (`internationalTravel == true && !preApproval`).
- Precedence: 0 violations => `APPROVED`; `EXP-004`/`EXP-005` => `REJECTED`; approvals/receipt => `ACTION_REQUIRED`.
- Cleaned stale prototype comments in file header.
- Implemented `generateNextAction(caseResult, expenseCase)`.

### 8. Embeddings & Semantic Search (`lib/embeddings/generator.ts`, `lib/rag/retriever.ts`)
- 768-dimensional vector generation via Google `text-embedding-004`.
- Supabase pgvector RPC semantic retriever `retrievePolicyEvidence(query, documentId)`.
- Typed error safeguards when credentials are missing.

### 9. Hardened Live Smoke Test Script (`scripts/smoke-ai.ts`)
- Comprehensive 12-step verification script executing:
  PDF loading -> page extraction -> chunking -> 768-dim embedding -> live Gemini extraction -> schema validation -> citation grounding -> fail-closed demo rule validation -> workflow generation.
- **Fail-Closed by Default**: Fails with exit code 1 if any of EXP-001..EXP-006 are missing or semantically invalid.
- **Opt-out flag**: Supports `--allow-arbitrary-policy` for non-demo policy PDFs.
- CLI usage: `npx tsx --conditions=react-server scripts/smoke-ai.ts <path-to-policy.pdf>`
- Never prints API keys or auth tokens.

---

## Final Demo Policy Verification

- **Script**: `scripts/smoke-ai.ts`
- **Execution Command**:
  ```powershell
  npx tsx --conditions=react-server scripts/smoke-ai.ts path/to/RulePilot_Shared_Corporate_Expense_Policy.pdf
  ```
- **Requirements**:
  1. `GEMINI_API_KEY` set in environment or `.env.local`.
  2. Digital-text PDF (non-scanned).
- **Checks executed by smoke test**:
  1. PDF bytes load (`pdfBytes.length > 0`)
  2. Digital pages extract (`pages.length > 0`, 1-based indexing)
  3. Text streams verified non-empty
  4. Page-aware chunks generated (`chunks.length > 0`)
  5. Vector embedding generated via `text-embedding-004`
  6. Embedding dimension verified strictly == 768
  7. Google Gemini (`gemini-2.5-flash`) extracts structured JSON rules
  8. Schema validation passed (`PolicyRule[]`)
  9. Citation grounding against source pages strictly validated
  10. Demo semantic validation: all 6 demo rules (EXP-001 to EXP-006) validated fail-closed
  11. Verbatim citations exist on claimed pages
  12. Workflow definition graph generated (14 nodes, 19 edges, deterministic)
- **Local Verification Status**:
  - Unit tests & offline fixtures: **PASS** (100% passing across 5 test suites).
  - Live Gemini API call on local machine: Awaiting local user export of `GEMINI_API_KEY` and final PDF placement. Smoke script is verified, fail-closed, and ready to run.

---

## Known Limitations

1. **Digital PDFs Only (No OCR)**: Scanned image-only PDFs will fail closed with `UnreadablePdfError`. The hackathon corporate expense policy PDF must contain digital text streams.
2. **Gemini API Key Required for Live Extraction**: When `GEMINI_API_KEY` is omitted, `extractPolicyRulesFromPages()` throws `GeminiNotConfiguredError`. It never fabricates synthetic rules.
3. **Embedding Vector Dimension**: Pinned strictly to 768 dimensions matching Supabase `vector(768)`. Alternate models producing different dimensions are explicitly rejected.
4. **EXP-005 Date Delta Calculation**: `PolicyRule` stores single numeric threshold (14 days); `evaluateExpenseCase` computes the calendar-day delta between `expenseDate` and `submissionDate`.

---

# Test Verification Summary

All test suites pass deterministically:

1. `npm run test:rules`
   - 10 deterministic rule engine tests (Approved, Action Required, Multiple Violations, EXP-004 Cap, EXP-004 25k Boundary, EXP-005 Late, EXP-005 14-day Boundary, EXP-006 Intl, Operator evaluation, Next Action generation)
   - 2 policy text chunker tests (sample policy text detection + `chunkPolicyPages` boundary/empty isolation)
   - 6 workflow generator tests (node structure, valid edge references, label semantics for EXP-005/EXP-006, determinism, empty rules, duplicate rule rejection)
2. `npm test`
   - All rule engine, workflow E2E, foundation, and fixture tests pass (9/9 TAP subtests).
3. `npx tsx --conditions=react-server tests/rules/pdf-parser.test.ts`
   - Multi-page digital PDF text extraction
   - 1-based page numbering verification
   - Empty buffer rejection
   - Unreadable / scanned PDF fails closed
4. `npx tsx --conditions=react-server tests/rules/ai.test.ts`
   - Schema validation against `PolicyRule` contract
   - Dropping malformed / invalid operator items
   - Exact citation grounding accepted
   - Whitespace and newline normalized citations accepted
   - Wrong page citation rejected (`CitationGroundingError`)
   - Fabricated citation rejected (`CitationGroundingError`)
   - Paraphrased citation rejected (`CitationGroundingError`)
   - Non-existent page citation rejected (`CitationGroundingError`)
   - Gemini, Embeddings, and RAG missing key safeguards
   - Duplicate rule ID rejection (`DuplicateRuleIdError`)
   - Unsupported rule field rejection (`UnsupportedRuleFieldError`)
   - Demo policy semantic validation (`validateDemoExpensePolicyRules`)
5. `npm run typecheck`: TypeScript passes with 0 errors.
6. `npm run lint`: ESLint passes with 0 warnings/errors.
7. `npm run build`: Production Next.js build compiled all 14 routes successfully.

---

# Exported Signatures for Member 1 Handoff

Member 1 can directly import and call these domain functions:

### 1. PDF Extraction
```ts
import { extractPdfPages, type ExtractedPolicyPage, UnreadablePdfError } from "@/lib/rag/pdf-parser";

const pages: ExtractedPolicyPage[] = await extractPdfPages(pdfBytes);
```

### 2. Page-Aware Chunking
```ts
import { chunkPolicyPages, type PolicyChunk } from "@/lib/rag/chunker";

const chunks: PolicyChunk[] = chunkPolicyPages(pages);
```

### 3. End-to-End PDF Domain Processor (for `POST /api/documents/process`)
```ts
import { processPolicyPdf, type ProcessPolicyPdfResult, type EmbeddedPolicyChunk } from "@/lib/rag/processor";

const { pageCount, chunks } = await processPolicyPdf(pdfBytes);
// Member 1 then calls replaceDocumentChunks(documentId, chunks) in Supabase
```

### 4. Grounded Rule Extraction & Validation (for `POST /api/rules/extract`)
```ts
import { extractPolicyRulesFromPages, validatePolicyRulesAgainstSource } from "@/lib/ai/gemini";
import { validateDemoExpensePolicyRules } from "@/lib/rules/demo-validator";

const rules: PolicyRule[] = await extractPolicyRulesFromPages(pages);
// Optional demo verification: validateDemoExpensePolicyRules(rules);
// Member 1 then calls replacePolicyRules(documentId, rules) in Supabase
```

### 5. Workflow Generation (for `POST /api/workflows/generate`)
```ts
import { generateWorkflowFromRules } from "@/lib/rules/workflow";

const workflow: WorkflowDefinition = generateWorkflowFromRules(rules);
```

### 6. Case Evaluation & Actions (for `POST /api/cases/execute` & `POST /api/actions/generate`)
```ts
import { evaluateExpenseCase, generateNextAction } from "@/lib/rules/engine";

const caseResult: CaseResult = evaluateExpenseCase(expenseCase, rules);
const nextAction = generateNextAction(caseResult, expenseCase);
```

### 7. Vector Search & Citations
```ts
import { retrievePolicyEvidence } from "@/lib/rag/retriever";

const citations: Citation[] = await retrievePolicyEvidence(query, documentId);
```
