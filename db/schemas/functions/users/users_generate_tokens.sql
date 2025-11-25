CREATE OR REPLACE FUNCTION users.generate_email_verification_token(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_token uuid;
BEGIN
  -- Validar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Generar y guardar token
  INSERT INTO users.email_verification_token (user_id, token, sent_at, expires_at)
  VALUES (p_user_id, gen_random_uuid(), now(), now() + INTERVAL '24 hours')
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION users.generate_password_reset_token(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_token uuid;
BEGIN
  -- Validar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Generar y guardar token
  INSERT INTO users.password_reset_token (user_id, token, sent_at, expires_at)
  VALUES (p_user_id, gen_random_uuid(), now(), now() + INTERVAL '1 hour')
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION users.verify_email_token(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_user_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Buscar token
  SELECT user_id, expires_at INTO v_user_id, v_expires_at
  FROM users.email_verification_token
  WHERE token = p_token AND used_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Validar que no ha expirado
  IF v_expires_at < now() THEN
    RETURN FALSE;
  END IF;

  -- Marcar como usado y activar usuario
  UPDATE users.email_verification_token SET used_at = now()
  WHERE token = p_token;

  UPDATE users.user SET status = 'active', updated_at = now()
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION users.verify_password_reset_token(p_token uuid, p_new_password_hash text)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_user_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Buscar token
  SELECT user_id, expires_at INTO v_user_id, v_expires_at
  FROM users.password_reset_token
  WHERE token = p_token AND used_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Validar que no ha expirado
  IF v_expires_at < now() THEN
    RETURN FALSE;
  END IF;

  -- Marcar como usado y actualizar password
  UPDATE users.password_reset_token SET used_at = now()
  WHERE token = p_token;

  UPDATE users.user SET password_hash = p_new_password_hash, updated_at = now()
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;
