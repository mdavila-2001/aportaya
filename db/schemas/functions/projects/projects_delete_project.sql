CREATE OR REPLACE FUNCTION projects.delete_project(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  -- Validar que el proyecto existe
  IF NOT EXISTS (SELECT 1 FROM projects.project WHERE id = p_id) THEN
    RETURN FALSE;
  END IF;

  -- Soft delete: marcar como deleted (no borrar físicamente)
  UPDATE projects.project SET
    approval_status = 'deleted',
    campaign_status = 'deleted',
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;
