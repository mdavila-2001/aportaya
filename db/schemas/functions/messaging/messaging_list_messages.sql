CREATE OR REPLACE FUNCTION messaging.list_messages(
  p_conversation_id uuid,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  content text,
  sent_at timestamptz,
  sender_id uuid,
  sender_name text,
  read boolean
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id, m.content, m.sent_at, m.sender_id,
    u.first_name || ' ' || u.last_name as sender_name,
    m.read
  FROM messaging.message m
  LEFT JOIN users.user u ON u.id = m.sender_id
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.sent_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
