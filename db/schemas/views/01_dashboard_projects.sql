-- Dashboard projects view from procedures.sql
CREATE OR REPLACE VIEW projects.dashboard_projects AS
SELECT 
  p.id,
  p.title,
  p.summary as description,
  p.approval_status,
  p.campaign_status,
  i.file_path as cover_image_url,
  p.category_id,
  c.name AS category_name,
  p.raised_amount,
  p.financial_goal as goal_amount,
  p.start_date,
  p.end_date,
  p.created_at
FROM projects.project p
INNER JOIN projects.category c ON p.category_id = c.id
INNER JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = true
INNER JOIN files.image i ON pi.image_id = i.id
WHERE 
  p.approval_status = 'published'
  AND p.campaign_status = 'in_progress'
  AND p.raised_amount > 0
ORDER BY p.created_at DESC
LIMIT 3;
