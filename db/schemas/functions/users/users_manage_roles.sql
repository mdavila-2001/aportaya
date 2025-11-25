CREATE OR REPLACE FUNCTION users.assign_role(p_user_id uuid, p_role_id int)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  -- Validar que el usuario y rol existen
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_user_id) THEN
    RETURN FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles.role WHERE id = p_role_id) THEN
    RETURN FALSE;
  END IF;

  -- Insertar rol si no está ya asignado
  INSERT INTO roles.user_role (user_id, role_id, assigned_at)
  VALUES (p_user_id, p_role_id, now())
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION users.remove_role(p_user_id uuid, p_role_id int)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  -- Eliminar rol asignado
  DELETE FROM roles.user_role
  WHERE user_id = p_user_id AND role_id = p_role_id;

  RETURN TRUE;
END;
$$;
