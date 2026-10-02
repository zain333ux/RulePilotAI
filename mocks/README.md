# Demo fixtures

All citations belong to the fictional RulePilot Demo Company Employee Travel & Expense Policy. No citation was extracted from an uploaded PDF. `sample-expense-policy.txt` supplies seven explicit demo page markers and exact excerpts for Member 2's first text extraction milestone. `policy-rules.json` is the expected-rules source; avoid a second competing copy. Member 4 later prepares a matching 5–7 page PDF and verifies its real pagination.

- `approved-case.json`: ExpenseCase, PKR 4,500; expected APPROVED.
- `approval-required-case.json`: ExpenseCase, PKR 68,000 Client Entertainment; EXP-002 only.
- `multiple-violations.json`: ExpenseCase, PKR 120,000 within seven days; EXP-001, EXP-002, EXP-003.
- `case-results.json`: keyed CaseResult examples for those three cases. Display these as sample results; never label them as live evaluation.
- `workflow.json`: WorkflowDefinition demonstrating receipt, manager and finance branches. It is an illustrative subset; hotel, deadline and international checks belong to later generation work.

Members can build UI directly against these files. Preserve deterministic IDs and exact quote text. For hotel cases use the frozen hotelNightlyRate and hotelNights names; see ADR-008. No secrets or real employee data belong in this directory.
