CREATE OR REPLACE FUNCTION roles.grant_ability(p_role_id int, p_ability_id int)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  -- Validar que el rol y habilidad existen
  IF NOT EXISTS (SELECT 1 FROM roles.role WHERE id = p_role_id) THEN
    RETURN FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM roles.ability WHERE id = p_ability_id) THEN
    RETURN FALSE;
  END IF;

  -- Conceder habilidad si no está ya concedida
  INSERT INTO roles.role_ability (role_id, ability_id, granted)
  VALUES (p_role_id, p_ability_id, true)
  ON CONFLICT (role_id, ability_id) DO UPDATE SET granted = true;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION roles.revoke_ability(p_role_id int, p_ability_id int)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  -- Revocar habilidad si existe
  UPDATE roles.role_ability
  SET granted = false
  WHERE role_id = p_role_id AND ability_id = p_ability_id;

  RETURN TRUE;
END;
$$;
