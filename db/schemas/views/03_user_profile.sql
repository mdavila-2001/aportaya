-- User profile view with aggregated information
CREATE OR REPLACE VIEW users.user_profile AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.status,
  u.registration_date,
  u.profile_image_id,
  img.file_path as profile_image_url,
  -- Projects created
  (SELECT COUNT(*) FROM projects.project p 
   WHERE p.creator_id = u.id) as projects_created,
  -- Projects funded (donations made)
  (SELECT COUNT(DISTINCT d.project_id) FROM payments.donation d 
   WHERE d.user_id = u.id AND d.payment_status = 'completed') as projects_funded,
  -- Total amount donated
  (SELECT COALESCE(SUM(d.amount), 0) FROM payments.donation d 
   WHERE d.user_id = u.id AND d.payment_status = 'completed') as total_donated,
  -- Comments made
  (SELECT COUNT(*) FROM social.comment c 
   WHERE c.user_id = u.id AND c.status = 'active') as comments_made,
  -- Favorite projects
  (SELECT COUNT(*) FROM social.favorite f 
   WHERE f.user_id = u.id) as favorite_projects,
  -- User roles
  (SELECT array_agg(r.name) FROM roles.role r
   JOIN roles.user_role ur ON r.id = ur.role_id
   WHERE ur.user_id = u.id) as user_roles
FROM users.user u
LEFT JOIN files.image img ON img.id = u.profile_image_id
WHERE u.deleted_at IS NULL;
