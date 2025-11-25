-- Campaign management functions

-- Start campaign
CREATE OR REPLACE FUNCTION projects.start_campaign(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects.project SET campaign_status = 'in_progress'
  WHERE id = p_project_id 
    AND approval_status = 'published'
    AND campaign_status = 'not_started'
    AND start_date <= now()
    AND end_date > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La campaña no se puede iniciar: verifica que esté publicada, no iniciada y dentro de fechas';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Pause campaign
CREATE OR REPLACE FUNCTION pause_campaign(
  p_project_id UUID,
  p_user_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  project_creator UUID;
BEGIN
  SELECT creator_id INTO project_creator FROM projects.project WHERE id = p_project_id;
  
  IF project_creator = p_user_id THEN
    UPDATE projects.project SET campaign_status = 'paused'
    WHERE id = p_project_id AND campaign_status = 'in_progress';
    
    IF FOUND THEN
      UPDATE projects.project_status_history
      SET changed_by = p_user_id, reason = p_reason
      WHERE project_id = p_project_id
        AND new_status = 'paused'
        AND change_date >= now() - INTERVAL '1 second';
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Resume campaign
CREATE OR REPLACE FUNCTION projects.resume_campaign(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects.project SET campaign_status = 'in_progress'
  WHERE id = p_project_id 
    AND campaign_status = 'paused'
    AND end_date > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La campaña no se puede reanudar: no está pausada o ya venció';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- End campaign
CREATE OR REPLACE FUNCTION projects.end_campaign(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects.project SET campaign_status = 'finished'
  WHERE id = p_project_id AND campaign_status = 'in_progress';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La campaña no se puede finalizar: no está en progreso';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Finish if goal reached
CREATE OR REPLACE FUNCTION projects.finish_if_goal_reached(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_goal NUMERIC;
  v_raised NUMERIC;
  v_campaign_status VARCHAR;
BEGIN
  SELECT financial_goal, raised_amount, campaign_status
  INTO v_goal, v_raised, v_campaign_status
  FROM projects.project WHERE id = p_project_id;

  IF v_raised >= v_goal AND v_campaign_status = 'in_progress' THEN
    UPDATE projects.project SET campaign_status = 'finished' WHERE id = p_project_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Auto close campaigns by deadline
CREATE OR REPLACE FUNCTION projects.auto_close_campaigns_by_deadline()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE projects.project SET campaign_status = 'finished'
  WHERE campaign_status = 'in_progress' AND end_date <= now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
