-- Audit triggers for tracking changes

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM audit.log_action(
      NULL,  -- No actor for automated inserts
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      to_jsonb(NEW),
      NULL
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM audit.log_action(
      NULL,  -- No actor for automated updates
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
      NULL
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM audit.log_action(
      NULL,  -- No actor for automated deletes
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables
DROP TRIGGER IF EXISTS trg_audit_users_user ON users.user;
CREATE TRIGGER trg_audit_users_user
AFTER INSERT OR UPDATE OR DELETE ON users.user
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

DROP TRIGGER IF EXISTS trg_audit_projects_project ON projects.project;
CREATE TRIGGER trg_audit_projects_project
AFTER INSERT OR UPDATE OR DELETE ON projects.project
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

DROP TRIGGER IF EXISTS trg_audit_payments_donation ON payments.donation;
CREATE TRIGGER trg_audit_payments_donation
AFTER INSERT OR UPDATE OR DELETE ON payments.donation
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

DROP TRIGGER IF EXISTS trg_audit_social_comment ON social.comment;
CREATE TRIGGER trg_audit_social_comment
AFTER INSERT OR UPDATE OR DELETE ON social.comment
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
