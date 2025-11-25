CREATE OR REPLACE FUNCTION messaging.list_conversations(
  p_user_id uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  project_title text,
  created_by uuid,
  created_by_name text,
  created_at timestamptz,
  status text,
  unread_count int
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.project_id, p.title as project_title, c.created_by,
    creator.first_name || ' ' || creator.last_name as created_by_name,
    c.created_at, c.status,
    (SELECT COUNT(*) FROM messaging.message m 
     WHERE m.conversation_id = c.id AND m.read = false AND m.sender_id != p_user_id) as unread_count
  FROM messaging.conversation c
  LEFT JOIN projects.project p ON p.id = c.project_id
  LEFT JOIN users.user creator ON creator.id = c.created_by
  WHERE c.created_by = p_user_id OR EXISTS (
    SELECT 1 FROM messaging.message m 
    WHERE m.conversation_id = c.id AND m.sender_id = p_user_id
  )
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
