-- Replace all document chunks for one document in a single PostgreSQL transaction.
-- Called only by the server-side service-role repository.

CREATE OR REPLACE FUNCTION public.replace_document_chunks_atomic(
  p_document_id uuid,
  p_chunks jsonb
)
RETURNS SETOF public.document_chunks
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

  IF p_chunks IS NULL OR jsonb_typeof(p_chunks) <> 'array' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'chunks must be a JSON array';
  END IF;

  -- Serialize replacements for the same document and reject unknown parents.
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
    FROM jsonb_array_elements(p_chunks) AS item(chunk)
    WHERE jsonb_typeof(chunk) <> 'object'
      OR jsonb_typeof(chunk->'pageNumber') <> 'number'
      OR NULLIF(btrim(chunk->>'content'), '') IS NULL
      OR (
        chunk->'section' IS NOT NULL
        AND jsonb_typeof(chunk->'section') NOT IN ('string', 'null')
      )
      OR (
        chunk->'embedding' IS NOT NULL
        AND jsonb_typeof(chunk->'embedding') NOT IN ('array', 'null')
      )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'each chunk must match the document chunk JSON contract';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_chunks) AS item(chunk)
    WHERE (chunk->>'pageNumber')::numeric < 1
      OR (chunk->>'pageNumber')::numeric <> trunc((chunk->>'pageNumber')::numeric)
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'page number must be a positive integer';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_chunks) AS item(chunk)
    WHERE jsonb_typeof(chunk->'embedding') = 'array'
      AND jsonb_array_length(chunk->'embedding') <> 768
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'embedding must contain exactly 768 numbers';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_chunks) AS item(chunk)
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(chunk->'embedding') = 'array' THEN chunk->'embedding'
        ELSE '[]'::jsonb
      END
    ) AS embedding_value(value)
    WHERE jsonb_typeof(value) <> 'number'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'embedding must contain exactly 768 numbers';
  END IF;

  DELETE FROM public.document_chunks
  WHERE document_id = p_document_id;

  INSERT INTO public.document_chunks (
    document_id,
    page_number,
    section,
    content,
    embedding
  )
  SELECT
    p_document_id,
    (chunk->>'pageNumber')::integer,
    CASE
      WHEN chunk->'section' IS NULL OR jsonb_typeof(chunk->'section') = 'null' THEN NULL
      ELSE chunk->>'section'
    END,
    chunk->>'content',
    CASE
      WHEN chunk->'embedding' IS NULL OR jsonb_typeof(chunk->'embedding') = 'null' THEN NULL
      ELSE (chunk->'embedding')::text::extensions.vector(768)
    END
  FROM jsonb_array_elements(p_chunks) AS item(chunk);

  RETURN QUERY
  SELECT stored.*
  FROM public.document_chunks AS stored
  WHERE stored.document_id = p_document_id
  ORDER BY stored.page_number, stored.created_at, stored.id;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_document_chunks_atomic(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_document_chunks_atomic(uuid, jsonb)
  TO service_role;
