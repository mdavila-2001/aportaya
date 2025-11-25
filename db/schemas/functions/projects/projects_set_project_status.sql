CREATE OR REPLACE FUNCTION projects.set_project_status(
  p_id uuid,
  p_approval_status text DEFAULT NULL,
  p_campaign_status text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_old_approval_status text;
  v_old_campaign_status text;
BEGIN
  -- Validar que el proyecto existe
  IF NOT EXISTS (SELECT 1 FROM projects.project WHERE id = p_id) THEN
    RETURN FALSE;
  END IF;

  -- Obtener estado actual
  SELECT approval_status, campaign_status INTO v_old_approval_status, v_old_campaign_status
  FROM projects.project WHERE id = p_id;

  -- Actualizar estados si se proveen
  UPDATE projects.project SET
    approval_status = COALESCE(p_approval_status, approval_status),
    campaign_status = COALESCE(p_campaign_status, campaign_status),
    updated_at = now()
  WHERE id = p_id;

  -- Registrar historial si cambió approval_status
  IF p_approval_status IS NOT NULL AND p_approval_status <> v_old_approval_status THEN
    INSERT INTO projects.project_approval_history (project_id, approved_by, status, rejection_reason)
    VALUES (p_id, p_actor_id, p_approval_status, p_reason);
  END IF;

  -- Registrar historial general si cambió cualquier estado
  IF (p_approval_status IS NOT NULL AND p_approval_status <> v_old_approval_status) OR
     (p_campaign_status IS NOT NULL AND p_campaign_status <> v_old_campaign_status) THEN
    INSERT INTO projects.project_status_history (project_id, old_status, new_status, changed_by, reason)
    VALUES (
      p_id,
      COALESCE(v_old_approval_status, v_old_campaign_status),
      COALESCE(p_approval_status, p_campaign_status),
      p_actor_id,
      p_reason
    );
  END IF;

  RETURN TRUE;
END;
$$;
