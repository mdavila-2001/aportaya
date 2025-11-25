-- Project management and campaign functions

-- Create project category
CREATE OR REPLACE FUNCTION projects.create_category(
  p_name VARCHAR,
  p_slug VARCHAR,
  p_description VARCHAR,
  p_parent_id INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_category_id INT;
BEGIN
  INSERT INTO projects.category(name, slug, description, parent_id)
  VALUES (p_name, p_slug, p_description, p_parent_id)
  RETURNING id INTO v_category_id;
  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- Check category requirements
CREATE OR REPLACE FUNCTION projects.check_category_requirements(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_category_id INT;
  v_has_requirements BOOLEAN;
BEGIN
  SELECT category_id INTO v_category_id FROM projects.project WHERE id = p_project_id;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado';
  END IF;

  SELECT EXISTS (SELECT 1 FROM projects.category_requirements WHERE category_id = v_category_id)
  INTO v_has_requirements;

  -- TODO: Implement specific requirement validation
  IF v_has_requirements THEN
    RETURN FALSE;
  ELSE
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add project image
CREATE OR REPLACE FUNCTION projects.add_project_image(
  p_project_id UUID,
  p_image_id UUID,
  p_is_cover BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_image_record_id UUID;
  v_max_order INT;
BEGIN
  IF p_is_cover THEN
    UPDATE projects.project_image SET is_cover = FALSE WHERE project_id = p_project_id;
  END IF;
  
  SELECT COALESCE(MAX(display_order), -1) + 1 INTO v_max_order
  FROM projects.project_image WHERE project_id = p_project_id;
  
  INSERT INTO projects.project_image (project_id, image_id, display_order, is_cover)
  VALUES (p_project_id, p_image_id, v_max_order, p_is_cover)
  RETURNING id INTO v_image_record_id;
  
  RETURN v_image_record_id;
END;
$$ LANGUAGE plpgsql;

-- Add multiple project images
CREATE OR REPLACE FUNCTION projects.add_project_images(
  p_project_id UUID,
  p_image_ids UUID[],
  p_cover_index INT DEFAULT 0
)
RETURNS INT AS $$
DECLARE
  v_image_id UUID;
  v_index INT := 0;
  v_is_cover BOOLEAN;
  v_count INT := 0;
BEGIN
  FOREACH v_image_id IN ARRAY p_image_ids LOOP
    v_is_cover := (v_index = p_cover_index);
    PERFORM projects.add_project_image(p_project_id, v_image_id, v_is_cover);
    v_index := v_index + 1;
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Remove project image
CREATE OR REPLACE FUNCTION projects.remove_project_image(p_image_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM projects.project_image WHERE id = p_image_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Set cover image
CREATE OR REPLACE FUNCTION projects.set_cover_image(
  p_project_id UUID,
  p_image_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE projects.project_image SET is_cover = FALSE WHERE project_id = p_project_id;
  UPDATE projects.project_image SET is_cover = TRUE
  WHERE id = p_image_id AND project_id = p_project_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Get project images
CREATE OR REPLACE FUNCTION projects.get_project_images(p_project_id UUID)
RETURNS TABLE (
  image_record_id UUID,
  image_id UUID,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  alt_text VARCHAR(255),
  display_order INT,
  is_cover BOOLEAN,
  uploaded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT pi.id, pi.image_id, img.file_name, img.file_path, img.alt_text,
         pi.display_order, pi.is_cover, img.uploaded_at
  FROM projects.project_image pi
  INNER JOIN files.image img ON img.id = pi.image_id
  WHERE pi.project_id = p_project_id
  ORDER BY pi.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Submit project for review
CREATE OR REPLACE FUNCTION submit_project_for_review(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_status VARCHAR(20);
BEGIN
  SELECT approval_status INTO current_status FROM projects.project WHERE id = p_project_id;
  
  IF current_status IN ('draft', 'observed') THEN
    UPDATE projects.project SET approval_status = 'in_review' WHERE id = p_project_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Approve project
CREATE OR REPLACE FUNCTION approve_project(p_project_id UUID, p_admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT projects.check_category_requirements(p_project_id) THEN
    RAISE EXCEPTION 'El proyecto no cumple con los requisitos de la categoría';
  END IF;

  UPDATE projects.project SET approval_status = 'published'
  WHERE id = p_project_id AND approval_status = 'in_review';
  
  IF FOUND THEN
    INSERT INTO projects.project_approval_history (id, project_id, approved_by, status, approval_date)
    VALUES (gen_random_uuid(), p_project_id, p_admin_id, 'approved', now());
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Observe project
CREATE OR REPLACE FUNCTION observe_project(
  p_project_id UUID,
  p_admin_id UUID,
  p_note TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE projects.project SET approval_status = 'observed'
  WHERE id = p_project_id AND approval_status = 'in_review';
  
  IF FOUND THEN
    INSERT INTO projects.project_observation (project_id, admin_id, note)
    VALUES (p_project_id, p_admin_id, p_note);
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Reject project
CREATE OR REPLACE FUNCTION reject_project(
  p_project_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE projects.project SET approval_status = 'rejected'
  WHERE id = p_project_id AND approval_status = 'in_review';
  
  IF FOUND THEN
    INSERT INTO projects.project_approval_history (id, project_id, approved_by, status, rejection_reason, approval_date)
    VALUES (gen_random_uuid(), p_project_id, p_admin_id, 'rejected', p_reason, now());
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
