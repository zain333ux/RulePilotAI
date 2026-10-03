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

# Completed Work

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
- Implemented `validatePolicyRulesAgainstSource(rules, pages): PolicyRule[]`:
  - Enforces that citation page actually exists in the document.
  - Normalizes PDF line breaks and whitespace (`\s+ -> " "`) for robust comparison without allowing paraphrasing.
  - Rejects citations where text belongs to a different page.
  - Rejects fabricated or hallucinated citations with `CitationGroundingError`.
  - Verifies section consistency when detectable.
- Implemented `extractPolicyRulesFromPages(pages: ExtractedPolicyPage[]): Promise<PolicyRule[]>`:
  - Formats page-marked text (`=== Page X ===`).
  - Calls Gemini REST API (`gemini-2.5-flash`) with structured JSON schema.
  - Validates `PolicyRule` schema.
  - Validates citation grounding against exact source pages.
  - Fails closed on malformed or ungrounded model output.

### 5. Deterministic Visual Workflow Generator (`lib/rules/workflow.ts`)
- Implemented `generateWorkflowFromRules(rules: PolicyRule[]): WorkflowDefinition`.
- Pure deterministic graph transformation:
  - Creates 1 `start` node (`Expense Submitted`).
  - Creates condition and action/approval nodes for each `PolicyRule`, preserving `ruleId`.
  - Distinguishes `approval` nodes (manager, finance, vp) from `action` nodes.
  - Creates 1 `end` node (`Claim Processing Complete`).
  - Generates valid directed branching edges.
  - Rejects duplicate rule IDs explicitly with `WorkflowGenerationError`.
  - Handles empty rule lists safely (`start -> end`).
  - Zero React Flow coordinates (pure domain definition for Member 4).

### 6. Full Deterministic Rule Engine (`lib/rules/engine.ts`)
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

### 7. Embeddings & Semantic Search (`lib/embeddings/generator.ts`, `lib/rag/retriever.ts`)
- 768-dimensional vector generation via Google `text-embedding-004`.
- Supabase pgvector RPC semantic retriever `retrievePolicyEvidence(query, documentId)`.
- Typed error safeguards when credentials are missing.

### 8. Live Smoke Test (`scripts/smoke-ai.ts`)
- Comprehensive 12-step verification script executing:
  PDF loading -> page extraction -> chunking -> 768-dim embedding -> live Gemini extraction -> schema validation -> citation grounding -> EXP-001..EXP-006 presence -> workflow generation.
- CLI usage: `npx tsx --conditions=react-server scripts/smoke-ai.ts <path-to-policy.pdf>`
- Never prints API keys or auth tokens.

---

# Test Verification Summary

All test suites pass deterministically:

1. `npm run test:rules`
   - 10 deterministic rule engine tests (Approved, Action Required, Multiple Violations, EXP-004 Cap, EXP-004 25k Boundary, EXP-005 Late, EXP-005 14-day Boundary, EXP-006 Intl, Operator evaluation, Next Action generation)
   - 2 policy text chunker tests (sample policy text detection + `chunkPolicyPages` boundary/empty isolation)
   - 5 workflow generator tests (node structure, valid edge references, determinism, empty rules, duplicate rule rejection)
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
// returns: [{ pageNumber: 1, text: "..." }, ...]
```

### 2. Page-Aware Chunking
```ts
import { chunkPolicyPages, type PolicyChunk } from "@/lib/rag/chunker";

const chunks: PolicyChunk[] = chunkPolicyPages(pages);
// returns: [{ pageNumber: 1, section: "1.4", content: "..." }, ...]
```

### 3. End-to-End PDF Domain Processor (for `POST /api/documents/process`)
```ts
import { processPolicyPdf, type ProcessPolicyPdfResult, type EmbeddedPolicyChunk } from "@/lib/rag/processor";

const { pageCount, chunks } = await processPolicyPdf(pdfBytes);
// chunks: [{ pageNumber: 1, section: "1.4", content: "...", embedding: number[768] }, ...]
// Member 1 then calls replaceDocumentChunks(documentId, chunks) in Supabase
```

### 4. Grounded Rule Extraction (for `POST /api/rules/extract`)
```ts
import { extractPolicyRulesFromPages, validatePolicyRulesAgainstSource } from "@/lib/ai/gemini";

const rules: PolicyRule[] = await extractPolicyRulesFromPages(pages);
// Validates schema + verifies citations verbatim in source pages
// Member 1 then calls replacePolicyRules(documentId, rules) in Supabase
```

### 5. Workflow Generation (for `POST /api/workflows/generate`)
```ts
import { generateWorkflowFromRules } from "@/lib/rules/workflow";

const workflow: WorkflowDefinition = generateWorkflowFromRules(rules);
// returns { nodes: [...], edges: [...] }
```

### 6. Case Evaluation & Actions (for `POST /api/cases/execute` & `POST /api/actions/generate`)
```ts
import { evaluateExpenseCase, generateNextAction } from "@/lib/rules/engine";

const caseResult: CaseResult = evaluateExpenseCase(expenseCase, rules);
// returns { status: "APPROVED" | "ACTION_REQUIRED" | "REJECTED", violations: [...] }

const nextAction = generateNextAction(caseResult, expenseCase);
// returns { action: string, template: string }
```

### 7. Vector Search & Citations
```ts
import { retrievePolicyEvidence } from "@/lib/rag/retriever";

const citations: Citation[] = await retrievePolicyEvidence(query, documentId);
```
