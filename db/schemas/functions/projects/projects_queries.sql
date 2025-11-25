-- Project query and search functions

-- Get project approval status
CREATE OR REPLACE FUNCTION projects.get_project_approval_status(p_project_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT approval_status INTO v_status FROM projects.project WHERE id = p_project_id;
  RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- Get project campaign status
CREATE OR REPLACE FUNCTION projects.get_project_campaign_status(p_project_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT campaign_status INTO v_status FROM projects.project WHERE id = p_project_id;
  RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- Get projects by approval status
CREATE OR REPLACE FUNCTION projects.get_projects_by_approval_status(p_approval_status VARCHAR)
RETURNS TABLE (
  project_id UUID,
  title VARCHAR,
  description TEXT,
  approval_status VARCHAR,
  campaign_status VARCHAR,
  creator_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, title, description, approval_status, campaign_status, creator_id
  FROM projects.project WHERE approval_status = p_approval_status;
END;
$$ LANGUAGE plpgsql;

-- Get projects by user
CREATE OR REPLACE FUNCTION projects.get_projects_by_user(p_user_id UUID)
RETURNS TABLE (
  project_id UUID,
  title VARCHAR,
  description TEXT,
  approval_status VARCHAR,
  campaign_status VARCHAR,
  category_id INT,
  raised_amount NUMERIC,
  financial_goal NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, title, description, approval_status, campaign_status, 
         category_id, raised_amount, financial_goal
  FROM projects.project WHERE creator_id = p_user_id ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get project status history
CREATE OR REPLACE FUNCTION projects.get_project_status_history(p_project_id UUID)
RETURNS TABLE (
  old_status VARCHAR,
  new_status VARCHAR,
  changed_by UUID,
  reason TEXT,
  change_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT old_status, new_status, changed_by, reason, change_date
  FROM projects.project_status_history
  WHERE project_id = p_project_id ORDER BY change_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Search active projects with filters
CREATE OR REPLACE FUNCTION search_active_projects(
  p_search_term TEXT DEFAULT NULL,
  p_category_id INT DEFAULT NULL,
  p_min_progress NUMERIC DEFAULT NULL,
  p_max_progress NUMERIC DEFAULT NULL,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  slug VARCHAR(255),
  summary VARCHAR(500),
  financial_goal NUMERIC,
  raised_amount NUMERIC,
  funding_percentage NUMERIC,
  creator_name TEXT,
  category_name VARCHAR(100),
  end_date TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.slug, p.summary, p.financial_goal, p.raised_amount,
         calculate_funding_percentage(p.id) as funding_percentage,
         CONCAT(u.first_name, ' ', u.last_name) as creator_name,
         c.name as category_name,
         p.end_date,
         GREATEST(0, EXTRACT(DAY FROM (p.end_date - now()))::INTEGER) as days_remaining
  FROM projects.project p
  INNER JOIN users.user u ON u.id = p.creator_id
  LEFT JOIN projects.category c ON c.id = p.category_id
  WHERE p.approval_status = 'published'
    AND p.campaign_status = 'in_progress'
    AND (p_search_term IS NULL OR 
         p.title ILIKE '%' || p_search_term || '%' OR 
         p.description ILIKE '%' || p_search_term || '%')
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_min_progress IS NULL OR calculate_funding_percentage(p.id) >= p_min_progress)
    AND (p_max_progress IS NULL OR calculate_funding_percentage(p.id) <= p_max_progress)
  ORDER BY p.created_at DESC OFFSET p_offset LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
