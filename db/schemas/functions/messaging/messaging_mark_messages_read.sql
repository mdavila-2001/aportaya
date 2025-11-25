CREATE OR REPLACE FUNCTION messaging.mark_messages_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
  v_count int;
BEGIN
  -- Validar que la conversación existe
  IF NOT EXISTS (SELECT 1 FROM messaging.conversation WHERE id = p_conversation_id) THEN
    RETURN 0;
  END IF;

  -- Marcar como leídos todos los mensajes no leídos del usuario
  UPDATE messaging.message
  SET read = true
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;
