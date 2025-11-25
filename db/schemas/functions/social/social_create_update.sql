CREATE OR REPLACE FUNCTION social.create_update(
  p_project_id uuid,
  p_title text,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validar que el proyecto existe
  IF NOT EXISTS (SELECT 1 FROM projects.project WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  INSERT INTO social.update (project_id, title, content)
  VALUES (p_project_id, p_title, p_content)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
