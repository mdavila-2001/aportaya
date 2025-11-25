CREATE OR REPLACE FUNCTION files.upload_image(
  p_file_name text,
  p_file_path text,
  p_alt_text text DEFAULT NULL,
  p_is_temporary boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO files.image (file_name, file_path, alt_text, is_temporary, uploaded_at)
  VALUES (p_file_name, p_file_path, p_alt_text, p_is_temporary, now())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
