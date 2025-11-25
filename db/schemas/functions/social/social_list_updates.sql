CREATE OR REPLACE FUNCTION social.list_updates(
  p_project_id uuid,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id, up.title, up.content, up.created_at
  FROM social.update up
  WHERE up.project_id = p_project_id
  ORDER BY up.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
