-- Donation summary view by project and user
CREATE OR REPLACE VIEW payments.donation_summary AS
SELECT 
  p.id as project_id,
  p.title as project_title,
  p.financial_goal,
  p.raised_amount,
  -- Progress percentage
  CASE 
    WHEN p.financial_goal > 0 THEN 
      ROUND((p.raised_amount / p.financial_goal) * 100, 2)
    ELSE 0 
  END as progress_percentage,
  -- Donation statistics
  (SELECT COUNT(*) FROM payments.donation d 
   WHERE d.project_id = p.id AND d.payment_status = 'completed') as donor_count,
  (SELECT COALESCE(SUM(d.amount), 0) FROM payments.donation d 
   WHERE d.project_id = p.id AND d.payment_status = 'completed') as total_raised,
  -- Average donation
  (SELECT COALESCE(AVG(d.amount), 0) FROM payments.donation d 
   WHERE d.project_id = p.id AND d.payment_status = 'completed') as avg_donation,
  -- Largest donation
  (SELECT MAX(d.amount) FROM payments.donation d 
   WHERE d.project_id = p.id AND d.payment_status = 'completed') as max_donation,
  -- Recent donations count (last 30 days)
  (SELECT COUNT(*) FROM payments.donation d 
   WHERE d.project_id = p.id 
     AND d.payment_status = 'completed' 
     AND d.donation_date >= now() - INTERVAL '30 days') as recent_donations
FROM projects.project p
WHERE p.approval_status = 'published' AND p.campaign_status = 'in_progress';
