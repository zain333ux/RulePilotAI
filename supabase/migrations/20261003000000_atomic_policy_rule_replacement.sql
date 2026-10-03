-- Replace all policy rules for one document in a single PostgreSQL transaction.
-- Called only by the server-side service-role repository.

CREATE OR REPLACE FUNCTION public.replace_policy_rules_atomic(
  p_document_id uuid,
  p_rules jsonb
)
RETURNS SETOF public.policy_rules
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_document_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'document ID is required';
  END IF;

  IF p_rules IS NULL OR jsonb_typeof(p_rules) <> 'array' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'rules must be a JSON array';
  END IF;

  -- Lock the parent row so concurrent replacements for one document serialize.
  PERFORM 1
  FROM public.documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'document was not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_rules) AS item(rule)
    WHERE jsonb_typeof(rule) <> 'object'
      OR NULLIF(btrim(rule->>'id'), '') IS NULL
      OR NULLIF(btrim(rule->>'name'), '') IS NULL
      OR NULLIF(btrim(rule->>'field'), '') IS NULL
      OR rule->>'operator' NOT IN ('>', '<', '>=', '<=', '==', '!=')
      OR jsonb_typeof(rule->'value') NOT IN ('string', 'number', 'boolean')
      OR NULLIF(btrim(rule->>'action'), '') IS NULL
      OR jsonb_typeof(rule->'citation') <> 'object'
      OR jsonb_typeof(rule#>'{citation,page}') <> 'number'
      OR NULLIF(btrim(rule#>>'{citation,text}'), '') IS NULL
      OR (
        rule#>'{citation,section}' IS NOT NULL
        AND jsonb_typeof(rule#>'{citation,section}') NOT IN ('string', 'null')
      )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'each rule must match the PolicyRule JSON contract';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_rules) AS item(rule)
    WHERE (rule#>>'{citation,page}')::numeric < 1
      OR (rule#>>'{citation,page}')::numeric
        <> trunc((rule#>>'{citation,page}')::numeric)
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'citation page must be a positive integer';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_rules) AS item(rule)
    GROUP BY rule->>'id'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'rule IDs must be unique within a document';
  END IF;

  DELETE FROM public.policy_rules
  WHERE document_id = p_document_id;

  INSERT INTO public.policy_rules (
    document_id,
    rule_code,
    rule_name,
    field_name,
    operator,
    value,
    action,
    citation_page,
    citation_section,
    raw_rule_text
  )
  SELECT
    p_document_id,
    rule->>'id',
    rule->>'name',
    rule->>'field',
    rule->>'operator',
    rule->'value',
    rule->>'action',
    (rule#>>'{citation,page}')::integer,
    NULLIF(rule#>>'{citation,section}', ''),
    rule#>>'{citation,text}'
  FROM jsonb_array_elements(p_rules) AS item(rule);

  RETURN QUERY
  SELECT stored.*
  FROM public.policy_rules AS stored
  WHERE stored.document_id = p_document_id
  ORDER BY stored.rule_code;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_policy_rules_atomic(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_policy_rules_atomic(uuid, jsonb)
  TO service_role;
