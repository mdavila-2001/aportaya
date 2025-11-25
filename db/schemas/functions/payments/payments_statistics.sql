-- Payment statistics and analytics functions

-- Get complete project statistics
CREATE OR REPLACE FUNCTION get_project_stats(p_project_id UUID)
RETURNS TABLE (
  total_donations BIGINT,
  unique_donors INTEGER,
  raised_amount NUMERIC,
  funding_percentage NUMERIC,
  days_remaining INTEGER,
  total_comments BIGINT,
  total_updates BIGINT,
  total_favorites BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM payments.donation WHERE project_id = p_project_id AND payment_status = 'completed'),
    (SELECT get_unique_donors_count(p_project_id)),
    (SELECT p.raised_amount FROM projects.project p WHERE p.id = p_project_id),
    (SELECT calculate_funding_percentage(p_project_id)),
    (SELECT GREATEST(0, EXTRACT(DAY FROM (p.end_date - now()))::INTEGER) FROM projects.project p WHERE p.id = p_project_id),
    (SELECT COUNT(*) FROM social.comment WHERE project_id = p_project_id AND status = 'active'),
    (SELECT COUNT(*) FROM social.update WHERE project_id = p_project_id),
    (SELECT COUNT(*) FROM social.favorite WHERE project_id = p_project_id);
END;
$$ LANGUAGE plpgsql;

-- Get top donors for project
CREATE OR REPLACE FUNCTION get_top_donors(p_project_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  total_donated NUMERIC,
  donation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.user_id, CONCAT(u.first_name, ' ', u.last_name) as user_name,
         SUM(d.amount) as total_donated, COUNT(*) as donation_count
  FROM payments.donation d
  INNER JOIN users.user u ON u.id = d.user_id
  WHERE d.project_id = p_project_id
    AND d.payment_status = 'completed'
    AND d.is_anonymous = FALSE
  GROUP BY d.user_id, u.first_name, u.last_name
  ORDER BY total_donated DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get trending projects
CREATE OR REPLACE FUNCTION get_trending_projects(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  project_id UUID,
  project_title VARCHAR(255),
  recent_donations BIGINT,
  recent_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, COUNT(d.id) as recent_donations,
         COALESCE(SUM(d.amount), 0) as recent_amount
  FROM projects.project p
  LEFT JOIN payments.donation d ON d.project_id = p.id 
    AND d.payment_status = 'completed'
    AND d.donation_date >= now() - INTERVAL '7 days'
  WHERE p.approval_status = 'published' AND p.campaign_status = 'in_progress'
  GROUP BY p.id, p.title
  ORDER BY recent_donations DESC, recent_amount DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
