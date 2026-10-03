# RulePilot AI agent entry point

Read the full PRD (`RulePilot AI — PRD.html`), then `docs/AGENT_HANDOFF.md` for the current snapshot. Complete the session reading checklist in `docs/DEVELOPMENT_RULES.md`, including the team playbook and your assigned progress file, before editing.

- Follow the PRD and member implementation playbook. This is one Next.js application; keep the agreed stack and MVP scope.
- Identify your member role and follow `docs/MEMBER_OWNERSHIP.md`. Member 1 owns every API route; Member 2 supplies AI/rule functions; Member 4 owns workflow rendering and automation.
- `types/contracts.ts`, `types/api.ts`, `mocks/` and package/config files are shared. Coordinate changes and record interface changes in `docs/PROJECT_DECISIONS.md`.
- Use fixtures while dependencies are unfinished. All six API endpoints currently return 501; do not report uploads, extraction, persistence or case evaluation as completed by these routes.
- The current engine is a partial prototype. Do not use it as a complete compliance decision or a substitute for expected result fixtures.
- Keep secrets in ignored environment files. Server modules must import `server-only`; client components may import types but not server implementations.
- Work on your member feature branch in a separate clone/worktree. Follow `feature/* -> dev -> main`; the integration lead owns shared merges.
- After every meaningful milestone update your progress file with exact files, interfaces, commands, results and next task. Update the current snapshot and append a dated session log in `docs/AGENT_HANDOFF.md` when overall state changes. Preserve history.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before claiming completion. Replace scaffold tests with real endpoint tests as Member 1 implements routes; do not delete coverage merely to get a passing build.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
