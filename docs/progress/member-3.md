# Role
**Member 3 — Frontend / Product UI**

---

# Current Objective
Build the complete user experience (Dashboard, PDF Upload UX, Policy Analysis Screen, Expense Case Form, and Decision Screen) against mock data.

---

# Owned Folders & Boundaries
- `app/dashboard/`
- `app/policies/`
- `app/cases/`
- `components/layout/`
- `components/policy/`
- `components/cases/`
- `components/ui/`

---

# First Recommended Task
Build the primary application UI flows using mock fixtures from `/mocks`:
1. Refine the Dashboard (`app/dashboard/page.tsx`) with real metric cards and active policy summaries.
2. Build the interactive Policy Analysis screen rendering `PolicyCard` items from `mocks/policy-rules.json`.
3. Build the Expense Case evaluation page with interactive input and immediate results display.

---

# Definition of Done for First Milestone
- [ ] Dashboard displays policy count, extracted rule count, workflow status, and recent cases.
- [ ] Policy analysis screen renders extracted rule cards with clickable citation metadata (page, section, rule text).
- [ ] Expense form accepts case parameters and immediately displays decision status (`APPROVED` or `ACTION_REQUIRED`), violations list, and grounded evidence.
- [ ] UI is responsive and styled consistently with dark mode Tailwind CSS and Lucide icons.
- [ ] All views work 100% reliably against mock data without requiring a backend or external database.

---

# Completed
- Shared UI primitives initialized: `lib/utils.ts` (`cn`), `components/ui/button.tsx`.
- Shared layout header: `components/layout/Navbar.tsx`.
- Policy presentation component: `components/policy/PolicyCard.tsx`.
- Case submission component: `components/cases/CaseForm.tsx`.
- Starter pages created:
  - `app/page.tsx`
  - `app/dashboard/page.tsx`
  - `app/policies/upload/page.tsx`
  - `app/cases/page.tsx`

---

# In Progress
No member-specific implementation is claimed yet. This is a starting template; update it after your first milestone.

---

# Files Created/Modified
- `app/page.tsx`
- `app/dashboard/page.tsx`
- `app/policies/upload/page.tsx`
- `app/cases/page.tsx`
- `components/ui/button.tsx`
- `components/layout/Navbar.tsx`
- `components/policy/PolicyCard.tsx`
- `components/cases/CaseForm.tsx`

---

# APIs / Interfaces Used
- `PolicyRule`, `ExpenseCase`, `CaseResult`, `Citation` from `types/contracts.ts`
- Mock datasets in `mocks/`

---

# Important Decisions
- Focus on serious B2B SaaS presentation (cards, badges, clean data tables, grounded evidence) rather than a chat interface.
- Keep UI components decoupled so swapping mock data calls for real API calls requires zero UI refactoring.
- **ADR-008 frozen:** optional form fields `hotelNightlyRate` and `hotelNights` for hotel/lodging claims. Do not invent alternate hotel field names. Non-hotel cases leave them undefined.

---

# Tests Run
- TypeScript compilation check (`npm run typecheck`).
- Next.js build check (`npm run build`).

---

# Test Results
- Compilation passed.

---

# Known Problems
- None.

---

# Dependencies on Other Members
- None. Member 3 develops exclusively against `/mocks` and `/types/contracts.ts` during phase 1.

---

# Next Exact Steps
1. Add interactive state in app/cases/page.tsx using mocks/case-results.json; switch to ExecuteCaseRequest/Response when Member 1 implements the endpoint.
2. Build Citation modal/drawer displaying the policy text snippet and page preview.
3. Add drag-and-drop file upload handler in `app/policies/upload/page.tsx`.

---

# Session History
- **Setup Session:** Created app shell, navigation, starter pages, UI primitives, and form components.

# Expected Output
Mock product screens consume domain fixtures and mocks/case-results.json without service credentials or dependence on the partial engine.

## Starting coordination
Branch from accepted dev into feature/frontend. Follow docs/MEMBER_OWNERSHIP.md for shared files. Run lint, typecheck, tests and build before declaring the milestone complete; update this file after each meaningful step.
