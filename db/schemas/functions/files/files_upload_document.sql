CREATE OR REPLACE FUNCTION files.upload_document(
  p_file_name text,
  p_file_path text,
  p_document_type text DEFAULT 'proof',
  p_is_temporary boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO files.document (file_name, file_path, document_type, is_temporary, uploaded_at)
  VALUES (p_file_name, p_file_path, p_document_type, p_is_temporary, now())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
