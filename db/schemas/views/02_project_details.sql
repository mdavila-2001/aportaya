-- Detailed project view with all related information
CREATE OR REPLACE VIEW projects.project_details AS
SELECT 
  p.id,
  p.title,
  p.slug,
  p.description,
  p.summary,
  p.financial_goal,
  p.raised_amount,
  p.start_date,
  p.end_date,
  p.approval_status,
  p.campaign_status,
  p.category_id,
  c.name as category_name,
  p.location,
  p.video_url,
  p.currency,
  p.created_at,
  p.updated_at,
  creator.first_name || ' ' || creator.last_name as creator_name,
  creator.email as creator_email,
  -- Progress calculation
  CASE 
    WHEN p.financial_goal > 0 THEN 
      ROUND((p.raised_amount / p.financial_goal) * 100, 2)
    ELSE 0 
  END as progress_percentage,
  -- Days remaining
  CASE 
    WHEN p.end_date > now() THEN 
      (p.end_date - now())::int
    ELSE 0 
  END as days_remaining,
  -- Donor count
  (SELECT COUNT(*) FROM payments.donation d 
   WHERE d.project_id = p.id AND d.payment_status = 'completed') as donor_count,
  -- Comment count
  (SELECT COUNT(*) FROM social.comment c 
   WHERE c.project_id = p.id AND c.status = 'active') as comment_count,
  -- Update count
  (SELECT COUNT(*) FROM social.update u 
   WHERE u.project_id = p.id) as update_count,
  -- Cover image
  img.file_path as cover_image_url
FROM projects.project p
LEFT JOIN projects.category c ON c.id = p.category_id
LEFT JOIN users.user creator ON creator.id = p.creator_id
LEFT JOIN LATERAL (
  SELECT pi.image_id
  FROM projects.project_image pi
  WHERE pi.project_id = p.id AND pi.is_cover = TRUE
  ORDER BY pi.display_order ASC, pi.created_at ASC
  LIMIT 1
) cov ON TRUE
LEFT JOIN files.image img ON img.id = cov.image_id;
