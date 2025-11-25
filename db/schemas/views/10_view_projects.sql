-- Complete projects view from procedures.sql
CREATE OR REPLACE VIEW projects.view_projects AS
SELECT
  p.id,
  p.creator_id,
  p.title,
  u.first_name,
  u.middle_name,
  u.last_name,
  u.mother_last_name,
  p.description,
  p.summary,
  p.financial_goal,
  p.raised_amount,
  p.start_date,
  p.end_date,
  p.approval_status,
  p.campaign_status,
  p.location,
  p.currency,
  p.category_id,
  i.file_path
FROM projects.project p
INNER JOIN users.user u ON p.creator_id = u.id
INNER JOIN projects.category c ON p.category_id = c.id
INNER JOIN projects.project_image t ON p.id = t.project_id
INNER JOIN files.image i ON t.image_id = i.id
WHERE p.approval_status = 'published';
