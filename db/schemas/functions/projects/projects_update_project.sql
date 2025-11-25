CREATE OR REPLACE FUNCTION projects.update_project(
  p_id uuid,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_financial_goal numeric(15,2) DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_category_id int DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_video_url text DEFAULT NULL,
  p_proof_document_id uuid DEFAULT NULL,
  p_currency text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_slug text;
BEGIN
  -- Validar que el proyecto existe
  IF NOT EXISTS (SELECT 1 FROM projects.project WHERE id = p_id) THEN
    RETURN FALSE;
  END IF;

  -- Si se actualiza title, regenerar slug
  IF p_title IS NOT NULL THEN
    v_slug := projects.generate_unique_slug(p_title);
    UPDATE projects.project SET 
      title = p_title,
      slug = v_slug
    WHERE id = p_id;
  END IF;

  -- Actualizar campos opcionales solo si se proveen
  UPDATE projects.project SET
    description = COALESCE(p_description, description),
    summary = COALESCE(p_summary, summary),
    financial_goal = COALESCE(p_financial_goal, financial_goal),
    start_date = COALESCE(p_start_date, start_date),
    end_date = COALESCE(p_end_date, end_date),
    category_id = COALESCE(p_category_id, category_id),
    location = COALESCE(p_location, location),
    video_url = COALESCE(p_video_url, video_url),
    proof_document_id = COALESCE(p_proof_document_id, proof_document_id),
    currency = COALESCE(p_currency, currency),
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;
