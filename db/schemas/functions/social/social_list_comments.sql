CREATE OR REPLACE FUNCTION social.list_comments(
  p_project_id uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  user_id uuid,
  user_name text
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.content, c.created_at, c.user_id,
    u.first_name || ' ' || u.last_name as user_name
  FROM social.comment c
  LEFT JOIN users.user u ON u.id = c.user_id
  WHERE c.project_id = p_project_id AND c.status = 'active'
  ORDER BY c.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
