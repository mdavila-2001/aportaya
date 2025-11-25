-- Admin dashboard view with key metrics
CREATE OR REPLACE VIEW admin.dashboard_stats AS
SELECT 
  -- User statistics
  (SELECT COUNT(*) FROM users.user WHERE deleted_at IS NULL) as total_users,
  (SELECT COUNT(*) FROM users.user WHERE status = 'active' AND deleted_at IS NULL) as active_users,
  (SELECT COUNT(*) FROM users.user WHERE status = 'pending_verification' AND deleted_at IS NULL) as pending_users,
  
  -- Project statistics
  (SELECT COUNT(*) FROM projects.project) as total_projects,
  (SELECT COUNT(*) FROM projects.project WHERE approval_status = 'published') as published_projects,
  (SELECT COUNT(*) FROM projects.project WHERE campaign_status = 'in_progress') as active_projects,
  (SELECT COUNT(*) FROM projects.project WHERE approval_status = 'pending') as pending_projects,
  
  -- Financial statistics
  (SELECT COALESCE(SUM(financial_goal), 0) FROM projects.project WHERE approval_status = 'published') as total_goal_amount,
  (SELECT COALESCE(SUM(raised_amount), 0) FROM projects.project) as total_raised_amount,
  (SELECT COUNT(*) FROM payments.donation WHERE payment_status = 'completed') as completed_donations,
  (SELECT COALESCE(SUM(amount), 0) FROM payments.donation WHERE payment_status = 'completed') as total_donations,
  
  -- Recent activity (last 7 days)
  (SELECT COUNT(*) FROM users.user WHERE registration_date >= now() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM projects.project WHERE created_at >= now() - INTERVAL '7 days') as new_projects_week,
  (SELECT COUNT(*) FROM payments.donation WHERE donation_date >= now() - INTERVAL '7 days' AND payment_status = 'completed') as donations_week,
  (SELECT COALESCE(SUM(amount), 0) FROM payments.donation WHERE donation_date >= now() - INTERVAL '7 days' AND payment_status = 'completed') as donations_amount_week,
  
  -- Pending reviews
  (SELECT COUNT(*) FROM social.report WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM payments.webhook_event WHERE status = 'pending') as pending_webhooks;
