-- Minimal boundary for the server-owned MVP API; no authentication implemented.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_results ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.documents, public.document_chunks, public.policy_rules,
  public.workflows, public.cases, public.case_results FROM anon, authenticated;
GRANT ALL ON TABLE public.documents, public.document_chunks, public.policy_rules,
  public.workflows, public.cases, public.case_results TO service_role;

REVOKE EXECUTE ON FUNCTION public.match_document_chunks(vector, double precision, integer, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, double precision, integer, uuid)
  TO service_role;
