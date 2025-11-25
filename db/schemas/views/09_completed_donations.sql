-- Completed donations view
CREATE OR REPLACE VIEW payments.completed_donations AS
SELECT
  d.id, d.amount, d.donation_date, d.payment_method, d.is_anonymous,
  d.user_id, d.project_id,
  CASE WHEN d.is_anonymous THEN 'Anónimo'
       ELSE CONCAT(u.first_name, ' ', u.last_name) END as donor_name,
  p.title as project_title,
  p.creator_id as project_creator_id
FROM payments.donation d
INNER JOIN users.user u ON u.id = d.user_id
INNER JOIN projects.project p ON p.id = d.project_id
WHERE d.payment_status = 'completed';
