-- Top backers view
CREATE OR REPLACE VIEW projects.v_top_backers AS
SELECT
  d.project_id, d.user_id,
  CONCAT(u.first_name, ' ', u.last_name) AS user_name,
  SUM(d.amount) AS total_donated,
  RANK() OVER (PARTITION BY d.project_id ORDER BY SUM(d.amount) DESC) AS rnk
FROM payments.donation d
JOIN users.user u ON u.id = d.user_id
WHERE d.payment_status = 'completed' AND d.is_anonymous = FALSE
GROUP BY d.project_id, d.user_id, user_name;
