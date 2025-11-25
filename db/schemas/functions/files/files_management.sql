-- File management functions

-- Create image
CREATE OR REPLACE FUNCTION files.create_image(
  p_file_name VARCHAR,
  p_file_path VARCHAR,
  p_alt_text VARCHAR DEFAULT NULL,
  p_is_temporary BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_image_id UUID;
BEGIN
  INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
  VALUES (p_file_name, p_file_path, p_alt_text, p_is_temporary)
  RETURNING id INTO v_image_id;
  
  RETURN v_image_id;
END;
$$ LANGUAGE plpgsql;

-- Mark image as permanent
CREATE OR REPLACE FUNCTION files.mark_image_as_permanent(p_image_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE files.image SET is_temporary = FALSE WHERE id = p_image_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Mark image as temporary
CREATE OR REPLACE FUNCTION files.mark_image_as_temporary(p_image_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE files.image SET is_temporary = TRUE WHERE id = p_image_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create document
CREATE OR REPLACE FUNCTION files.create_document(
  p_file_name VARCHAR,
  p_file_path VARCHAR,
  p_document_type VARCHAR DEFAULT 'proof',
  p_is_temporary BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
BEGIN
  INSERT INTO files.document (file_name, file_path, document_type, is_temporary)
  VALUES (p_file_name, p_file_path, p_document_type, p_is_temporary)
  RETURNING id INTO v_document_id;
  
  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- Mark document as permanent
CREATE OR REPLACE FUNCTION files.mark_document_as_permanent(p_document_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE files.document SET is_temporary = FALSE WHERE id = p_document_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old temporary images
CREATE OR REPLACE FUNCTION files.cleanup_old_temporary_images(p_days_old INT DEFAULT 7)
RETURNS TABLE (image_id UUID, file_path VARCHAR) AS $$
BEGIN
  RETURN QUERY
  DELETE FROM files.image
  WHERE is_temporary = TRUE AND uploaded_at < NOW() - (p_days_old || ' days')::INTERVAL
  RETURNING id, file_path;
END;
$$ LANGUAGE plpgsql;
