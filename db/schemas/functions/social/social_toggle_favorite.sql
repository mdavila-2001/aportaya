CREATE OR REPLACE FUNCTION social.toggle_favorite(
  p_user_id uuid,
  p_project_id uuid
)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Validar que el proyecto y usuario existen
  IF NOT EXISTS (SELECT 1 FROM projects.project WHERE id = p_project_id) THEN
    RETURN FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Verificar si ya es favorito
  SELECT EXISTS(SELECT 1 FROM social.favorite WHERE user_id = p_user_id AND project_id = p_project_id)
  INTO v_exists;

  IF v_exists THEN
    -- Remover favorito
    DELETE FROM social.favorite WHERE user_id = p_user_id AND project_id = p_project_id;
    RETURN FALSE; -- Indica que se removió
  ELSE
    -- Agregar favorito
    INSERT INTO social.favorite (user_id, project_id, created_at)
    VALUES (p_user_id, p_project_id, now());
    RETURN TRUE; -- Indica que se agregó
  END IF;
END;
$$;
