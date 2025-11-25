-- Active projects view
CREATE OR REPLACE VIEW projects.active_projects AS
SELECT
  p.id, p.creator_id, p.title, p.slug, p.summary, p.description,
  p.financial_goal, p.raised_amount,
  calculate_funding_percentage(p.id) as funding_percentage,
  p.start_date, p.end_date,
  GREATEST(0, EXTRACT(DAY FROM (p.end_date - now()))::INTEGER) as days_remaining,
  p.category_id,
  (SELECT img.file_path
   FROM projects.project_image pi
   INNER JOIN files.image img ON img.id = pi.image_id
   WHERE pi.project_id = p.id AND pi.is_cover = TRUE LIMIT 1) as cover_image,
  p.created_at,
  CONCAT(u.first_name, ' ', u.last_name) as creator_name,
  u.profile_image_id as creator_image_id,
  c.name as category_name,
  get_unique_donors_count(p.id) as unique_donors
FROM projects.project p
INNER JOIN users.user u ON u.id = p.creator_id
LEFT JOIN projects.category c ON c.id = p.category_id
WHERE p.approval_status = 'published' AND p.campaign_status = 'in_progress';
