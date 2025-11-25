CREATE OR REPLACE FUNCTION messaging.create_conversation(
  p_project_id uuid,
  p_created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validar que el proyecto y usuario existen
  IF NOT EXISTS (SELECT 1 FROM projects.project WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_created_by) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verificar si ya existe conversación para este proyecto
  IF EXISTS (SELECT 1 FROM messaging.conversation WHERE project_id = p_project_id) THEN
    -- Retornar la conversación existente
    SELECT id INTO v_id FROM messaging.conversation WHERE project_id = p_project_id;
    RETURN v_id;
  END IF;

  INSERT INTO messaging.conversation (project_id, created_by, status)
  VALUES (p_project_id, p_created_by, 'active')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
