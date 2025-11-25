CREATE OR REPLACE FUNCTION social.create_comment(
  p_project_id uuid,
  p_user_id uuid,
  p_content text
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
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO social.comment (project_id, user_id, content, status)
  VALUES (p_project_id, p_user_id, p_content, 'active')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
