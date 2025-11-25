-- Maintenance and cron job functions

-- Cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM users.email_verification_token
  WHERE (expires_at < now() - INTERVAL '30 days')
     OR (used_at IS NOT NULL AND used_at < now() - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM users.password_reset_token WHERE expires_at < now() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update campaign statuses
CREATE OR REPLACE FUNCTION update_campaign_statuses()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
  rows_affected INTEGER;
BEGIN
  UPDATE projects.project SET campaign_status = 'in_progress'
  WHERE approval_status = 'published'
    AND campaign_status = 'not_started'
    AND start_date <= now()
    AND end_date > now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  UPDATE projects.project SET campaign_status = 'finished'
  WHERE campaign_status = 'in_progress' AND end_date <= now();
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  updated_count := updated_count + rows_affected;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
