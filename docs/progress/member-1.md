# Role
**Member 1 — Platform / Backend / Supabase**

---

# Current Objective
Connect Supabase Storage (`policies` bucket) and PostgreSQL database tables for document upload and metadata persistence.

---

# Owned Folders & Boundaries
- `app/api/`
- `lib/supabase/`
- `supabase/`
- Database infrastructure, environment configurations, and Vercel deployment.

---

# First Recommended Task
Implement `POST /api/documents/upload`:
1. Receive uploaded PDF file.
2. Store PDF in Supabase Storage `policies` bucket.
3. Insert record into `documents` table (`id`, `name`, `file_url`, `status`, `created_at`).
4. Return uploaded document record with mock/initial status.

---

# Definition of Done for First Milestone
- [ ] A PDF uploaded via `/api/documents/upload` appears in Supabase Storage bucket `policies`.
- [ ] A new row is created in the `documents` PostgreSQL table.
- [ ] API returns HTTP 201 UploadResponse from types/api.ts, including documentId, storagePath and document metadata.
- [ ] Missing credentials return a clear 503 error; UI uses explicit fixtures without pretending a file was persisted.

---

# Completed
- Initial route skeletons created in `app/api/documents/upload/route.ts`, `app/api/documents/process/route.ts` — currently return **HTTP 501** until Member 1 implements them.
- Safe Supabase clients configured in `lib/supabase/client.ts` (`getBrowserSupabase()` → null if unset) and `lib/supabase/server.ts` (`getAdminSupabase()` throws if unset).
- PostgreSQL database schema and pgvector migration created in `supabase/migrations/20261002000000_initial_schema.sql`.

---

# In Progress
No member-specific implementation is claimed yet. This is a starting template; update it after your first milestone.

---

# Files Created/Modified
- `app/api/documents/upload/route.ts`
- `app/api/documents/process/route.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `supabase/migrations/20261002000000_initial_schema.sql`

---

# APIs / Interfaces Used
- `PolicyDocument` from `types/contracts.ts`
- Supabase JS `@supabase/supabase-js`

---

# Important Decisions
- Client-side Supabase client uses anon key; server-side routes use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for administrative ingestion.
- Storage bucket name: `policies`.

---

# Tests Run
- API route skeleton compilation check (`npm run build`).

---

# Test Results
- Compilation passed.

---

# Known Problems
- None. Live Supabase credentials required for live database persistence.

---

# Dependencies on Other Members
- None. Member 1 operates independently from UI and AI logic using mock responses until full pipeline integration.

---

# Next Exact Steps
1. Create Supabase project in Supabase dashboard.
2. Run migration SQL `supabase/migrations/20261002000000_initial_schema.sql`.
3. Create a private `policies` bucket; use server uploads and temporary signed read URLs.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
5. Update `app/api/documents/upload/route.ts` to perform real Supabase storage upload and document insert.

---

# Session History
- **Setup Session:** Created platform skeleton, Supabase client/server utilities, database migration script, and initial API routes.

# Expected Output
A persisted PDF and documents row, with UploadResponse matching types/api.ts; invalid files and storage failures tested.

## Starting coordination
Branch from accepted dev into feature/platform. Follow docs/MEMBER_OWNERSHIP.md for shared files. Run lint, typecheck, tests and build before declaring the milestone complete; update this file after each meaningful step.
