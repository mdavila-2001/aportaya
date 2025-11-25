CREATE OR REPLACE FUNCTION messaging.send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validar que la conversación y usuario existen
  IF NOT EXISTS (SELECT 1 FROM messaging.conversation WHERE id = p_conversation_id) THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_sender_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO messaging.message (conversation_id, sender_id, content, sent_at, read)
  VALUES (p_conversation_id, p_sender_id, p_content, now(), false)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
