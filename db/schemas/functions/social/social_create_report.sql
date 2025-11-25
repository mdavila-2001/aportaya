CREATE OR REPLACE FUNCTION social.create_report(
  p_report_type text,
  p_reporter_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validar que el reportante existe
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_reporter_id) THEN
    RAISE EXCEPTION 'Reporter not found';
  END IF;

  INSERT INTO social.report (report_type, reporter_id, target_type, target_id, description, status)
  VALUES (p_report_type, p_reporter_id, p_target_type, p_target_id, p_description, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
