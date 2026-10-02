# Database setup

Member 1 owns SQL, storage and database adapters. The migrations are prepared but have not been run against a live Supabase project. The app compiles without a connection.

1. Create the team Supabase project. Enable `vector` in Database > Extensions. Execute `migrations/20261002000000_initial_schema.sql` in SQL Editor using the project owner role; then execute subsequent migrations in timestamp order.
2. Create a **private** Storage bucket named `policies`, restrict content type to application/pdf, and set a 4 MiB upload limit for the initial function-based flow. Store object paths; return short-lived signed URLs when preview is implemented.
3. Copy `.env.example` to ignored `.env.local`; configure project URL, anon key and service-role key. Keep service-role access inside server-only modules. An anon key is public only when database/storage access policies are correct.
4. Verify all six tables, foreign keys and `match_document_chunks` exist. Test an upload and database insert when Member 1 implements the handler. Record actual SQL/service results in member-1 progress.

## Domain mapping

| Domain object | Persistence |
| --- | --- |
| PolicyDocument | documents: name, storage_path, status, page_count, created_at; URLs are optional temporary access links |
| Citation | document_chunks.page_number/section/content or policy_rules.citation_page/citation_section/raw_rule_text |
| PolicyRule.id | policy_rules.rule_code; database row UUID is separate; unique within document_id |
| WorkflowDefinition | workflows.workflow_json; workflow row UUID returned as workflowId |
| ExpenseCase | cases.input_json, including optional hotelNightlyRate/hotelNights; duplicated summary fields must match |
| CaseResult | case_results.decision + violations_json; case_id points to the case, which points to workflow |

Persist the actual workflow_id for every API-created case. The existing nullable FK supports retained historical cases after workflow removal, not arbitrary unassociated decisions. Update documents.updated_at explicitly in adapters; there is no update trigger.

## Vector contract

The column and RPC use 768 dimensions. No embedding model is implemented or selected. Member 2 must verify the chosen provider supports this size and configure output explicitly. Store finite, nonzero vectors; cosine distance is undefined for zero vectors. Use the same model and normalization for stored/query vectors. Changing model or dimension requires a coordinated migration and re-embedding.

Always provide filter_document_id to match_document_chunks for case evidence. Its nullable argument is retained for compatibility; it is not permission to mix evidence across policies. The MVP can use exact search without an ANN index.

The initial CREATE TABLE IF NOT EXISTS statements do not upgrade existing tables. Use new timestamped migrations for future changes. Never edit already-applied migrations silently.

## Access baseline

The second migration enables RLS with no public policies and restricts the vector RPC to service_role. Server API adapters use the service role; browser clients cannot directly read/write these tables by default. Authentication and per-user policies remain outside setup scope. This is not a production authorization system; use fictional demo data until access control is designed.
