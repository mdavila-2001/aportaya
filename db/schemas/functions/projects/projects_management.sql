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

-- =====================================================
-- GESTIÓN DE REQUISITOS DE CATEGORÍAS
-- =====================================================

-- Add category requirement
CREATE OR REPLACE FUNCTION projects.add_category_requirement(
  p_category_id INT,
  p_requirement_name VARCHAR,
  p_requirement_value TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que la categoría existe
  IF NOT EXISTS (SELECT 1 FROM projects.category WHERE id = p_category_id) THEN
    RAISE EXCEPTION 'La categoría con ID % no existe', p_category_id;
  END IF;

  INSERT INTO projects.category_requirements (category_id, requirement_name, requirement_value)
  VALUES (p_category_id, p_requirement_name, p_requirement_value)
  ON CONFLICT (category_id, requirement_name) 
  DO UPDATE SET requirement_value = EXCLUDED.requirement_value;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add multiple category requirements
CREATE OR REPLACE FUNCTION projects.add_category_requirements(
  p_category_id INT,
  p_requirements JSONB
)
RETURNS INT AS $$
DECLARE
  v_requirement JSONB;
  v_count INT := 0;
BEGIN
  -- Verificar que la categoría existe
  IF NOT EXISTS (SELECT 1 FROM projects.category WHERE id = p_category_id) THEN
    RAISE EXCEPTION 'La categoría con ID % no existe', p_category_id;
  END IF;

  -- Iterar sobre el array de requisitos
  FOR v_requirement IN SELECT * FROM jsonb_array_elements(p_requirements)
  LOOP
    INSERT INTO projects.category_requirements (category_id, requirement_name, requirement_value)
    VALUES (
      p_category_id,
      v_requirement->>'name',
      v_requirement->>'value'
    )
    ON CONFLICT (category_id, requirement_name) 
    DO UPDATE SET requirement_value = EXCLUDED.requirement_value;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Remove category requirement
CREATE OR REPLACE FUNCTION projects.remove_category_requirement(
  p_category_id INT,
  p_requirement_name VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM projects.category_requirements
  WHERE category_id = p_category_id AND requirement_name = p_requirement_name;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Remove all category requirements
CREATE OR REPLACE FUNCTION projects.clear_category_requirements(p_category_id INT)
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM projects.category_requirements
  WHERE category_id = p_category_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Get category requirements
CREATE OR REPLACE FUNCTION projects.get_category_requirements(p_category_id INT)
RETURNS TABLE (
  requirement_name VARCHAR(255),
  requirement_value TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT cr.requirement_name, cr.requirement_value
  FROM projects.category_requirements cr
  WHERE cr.category_id = p_category_id
  ORDER BY cr.requirement_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Get all categories with their requirements
CREATE OR REPLACE FUNCTION projects.get_categories_with_requirements()
RETURNS TABLE (
  category_id INT,
  category_name VARCHAR(100),
  category_slug VARCHAR(100),
  category_description VARCHAR(255),
  requirements JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', cr.requirement_name,
          'value', cr.requirement_value
        )
        ORDER BY cr.requirement_name
      ) FILTER (WHERE cr.requirement_name IS NOT NULL),
      '[]'::jsonb
    ) as requirements
  FROM projects.category c
  LEFT JOIN projects.category_requirements cr ON cr.category_id = c.id
  GROUP BY c.id, c.name, c.slug, c.description
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Check category requirements
CREATE OR REPLACE FUNCTION projects.check_category_requirements(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_category_id INT;
  v_has_requirements BOOLEAN;
  v_requirement_count INT;
BEGIN
  -- Obtener la categoría del proyecto
  SELECT category_id INTO v_category_id 
  FROM projects.project 
  WHERE id = p_project_id;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado o sin categoría asignada';
  END IF;

  -- Verificar si la categoría tiene requisitos
  SELECT COUNT(*) INTO v_requirement_count
  FROM projects.category_requirements 
  WHERE category_id = v_category_id;

  -- Si no hay requisitos, el proyecto cumple automáticamente
  IF v_requirement_count = 0 THEN
    RETURN TRUE;
  END IF;

  -- TODO: Implementar validación específica según el tipo de requisito
  -- Por ahora, si tiene requisitos, se considera que necesita revisión manual
  -- En el futuro, se pueden validar campos específicos del proyecto
  
  -- Ejemplo de validaciones futuras:
  -- - Si requiere 'video_url', verificar que no sea NULL
  -- - Si requiere 'proof_document_id', verificar que exista
  -- - Validaciones personalizadas por tipo de requisito
  
  -- Por ahora retornamos TRUE si el proyecto tiene descripción completa
  -- y cumple con criterios básicos
  RETURN EXISTS (
    SELECT 1 FROM projects.project 
    WHERE id = p_project_id 
    AND description IS NOT NULL 
    AND LENGTH(description) > 50
    AND financial_goal > 0
  );
END;
$$ LANGUAGE plpgsql;

-- Validate specific project requirements
CREATE OR REPLACE FUNCTION projects.validate_project_requirements(p_project_id UUID)
RETURNS TABLE (
  requirement_name VARCHAR(255),
  requirement_value TEXT,
  is_fulfilled BOOLEAN,
  validation_message TEXT
) AS $$
DECLARE
  v_category_id INT;
  v_project RECORD;
BEGIN
  -- Obtener datos del proyecto
  SELECT p.*, p.category_id INTO v_project
  FROM projects.project p
  WHERE p.id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado';
  END IF;

  -- Retornar validación de cada requisito
  RETURN QUERY
  SELECT 
    cr.requirement_name,
    cr.requirement_value,
    CASE 
      -- Validación de video
      WHEN LOWER(cr.requirement_name) LIKE '%video%' THEN
        v_project.video_url IS NOT NULL AND LENGTH(v_project.video_url) > 0
      
      -- Validación de documento
      WHEN LOWER(cr.requirement_name) LIKE '%documento%' OR LOWER(cr.requirement_name) LIKE '%certificaci%' THEN
        v_project.proof_document_id IS NOT NULL
      
      -- Validación de descripción extensa
      WHEN LOWER(cr.requirement_name) LIKE '%plan%' OR LOWER(cr.requirement_name) LIKE '%detalle%' THEN
        v_project.description IS NOT NULL AND LENGTH(v_project.description) > 200
      
      -- Validación de ubicación
      WHEN LOWER(cr.requirement_name) LIKE '%ubicaci%n%' OR LOWER(cr.requirement_name) LIKE '%poblaci%n%' THEN
        v_project.location IS NOT NULL AND LENGTH(v_project.location) > 0
      
      -- Por defecto, requiere revisión manual
      ELSE TRUE
    END as is_fulfilled,
    CASE 
      WHEN LOWER(cr.requirement_name) LIKE '%video%' THEN
        CASE WHEN v_project.video_url IS NOT NULL THEN 'Video proporcionado' ELSE 'Falta video requerido' END
      WHEN LOWER(cr.requirement_name) LIKE '%documento%' OR LOWER(cr.requirement_name) LIKE '%certificaci%' THEN
        CASE WHEN v_project.proof_document_id IS NOT NULL THEN 'Documento adjunto' ELSE 'Falta documento requerido' END
      WHEN LOWER(cr.requirement_name) LIKE '%plan%' OR LOWER(cr.requirement_name) LIKE '%detalle%' THEN
        CASE WHEN LENGTH(v_project.description) > 200 THEN 'Descripción completa' ELSE 'Descripción insuficiente' END
      WHEN LOWER(cr.requirement_name) LIKE '%ubicaci%n%' OR LOWER(cr.requirement_name) LIKE '%poblaci%n%' THEN
        CASE WHEN v_project.location IS NOT NULL THEN 'Ubicación especificada' ELSE 'Falta ubicación' END
      ELSE 'Requiere revisión manual del administrador'
    END as validation_message
  FROM projects.category_requirements cr
  WHERE cr.category_id = v_project.category_id
  ORDER BY cr.requirement_name;
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
