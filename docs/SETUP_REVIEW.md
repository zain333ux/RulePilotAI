# Shared foundation review

Date: 2026-10-02. Sources: the complete root PRD HTML, team playbook DOCX, README, documentation, source, fixtures and migration. Existing work is retained at the repository root.

## Execution checklist

- [x] Read sources and inspect Git. The checkout started on an unborn main with all files untracked and no remote. GitHub identifies the empty private repository `zain333ux/RulePilotAI`.
- [x] Run baseline lint, typecheck and fixture tests. Typecheck and three partial-engine cases passed; lint reported warnings as applicable. Production build verified in Session 2.
- [x] Make all API scaffolds explicitly unimplemented; preserve partial member code for later completion. Remove fabricated evidence and zero-vector fallbacks from AI stubs.
- [x] Keep `types/contracts.ts` unchanged; correct fixture dates/category and document executable rule semantics, citation provenance and hotel limitation.
- [x] Complete shadcn configuration, secret guards, migration constraints and setup instructions without external credentials.
- [x] Correct ownership, member templates, reading order and handoff state. Run install, lint, typecheck, tests, build and HTTP smoke checks; record actual results.

## Review findings

The API previously duplicated four rules and silently skipped the hotel cap and submission deadline. Upload accepted missing files and returned a fake storage URL; processing claimed indexed chunks that did not exist. AI/RAG/embedding functions returned fabricated successful outputs even with credentials configured. These are unsafe starting contracts.

**Resolution:** API skeletons return HTTP 501; mock fixtures remain directly available for independent UI work. AI stubs throw explicit errors. Partial engine preserved in `lib/rules/engine.ts` and disconnected from APIs.

The supplied ExpenseCase has no nights or nightly-rate field. A PKR 68,000 hotel claim cannot be correctly evaluated against PKR 25,000/night. Keep the exact contract and use a non-hotel approval fixture (`Client Entertainment`). Members 1, 2 and 3 must agree on an additive hotel input before the hotel hero demo; never assume one night or silently ignore the cap. Documented as ADR-008.
