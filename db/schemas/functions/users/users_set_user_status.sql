CREATE OR REPLACE FUNCTION users.set_user_status(
  p_user_id uuid,
  p_status text,
  p_reason text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_old_status text;
BEGIN
  -- Validar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Obtener estado anterior
  SELECT status INTO v_old_status FROM users.user WHERE id = p_user_id;

  -- Actualizar estado
  UPDATE users.user SET
    status = p_status,
    updated_at = now()
  WHERE id = p_user_id;

  -- Registrar historial
  INSERT INTO users.user_status_history (user_id, old_status, new_status, changed_by, reason)
  VALUES (p_user_id, v_old_status, p_status, p_actor_id, p_reason);

  RETURN TRUE;
END;
$$;
