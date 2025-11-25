-- Status history triggers

-- Function to track project status changes
CREATE OR REPLACE FUNCTION projects.track_project_status_change()
RETURNS trigger AS $$
DECLARE
  v_old_status text;
  v_new_status text;
BEGIN
  -- Determine which status changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
      v_old_status := OLD.approval_status;
      v_new_status := NEW.approval_status;
      
      INSERT INTO projects.project_status_history (project_id, old_status, new_status, changed_by, reason)
      VALUES (NEW.id, v_old_status, v_new_status, NULL, 'Approval status changed');
    END IF;
    
    IF OLD.campaign_status IS DISTINCT FROM NEW.campaign_status THEN
      v_old_status := OLD.campaign_status;
      v_new_status := NEW.campaign_status;
      
      INSERT INTO projects.project_status_history (project_id, old_status, new_status, changed_by, reason)
      VALUES (NEW.id, v_old_status, v_new_status, NULL, 'Campaign status changed');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track user status changes
CREATE OR REPLACE FUNCTION users.track_user_status_change()
RETURNS trigger AS $$
DECLARE
  v_old_status text;
  v_new_status text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_old_status := OLD.status;
      v_new_status := NEW.status;
      
      INSERT INTO users.user_status_history (user_id, old_status, new_status, changed_by, reason)
      VALUES (NEW.id, v_old_status, v_new_status, NULL, 'Status changed');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trg_project_status_history ON projects.project;
CREATE TRIGGER trg_project_status_history
AFTER UPDATE ON projects.project
FOR EACH ROW EXECUTE FUNCTION projects.track_project_status_change();

DROP TRIGGER IF EXISTS trg_user_status_history ON users.user;
CREATE TRIGGER trg_user_status_history
AFTER UPDATE ON users.user
FOR EACH ROW EXECUTE FUNCTION users.track_user_status_change();
