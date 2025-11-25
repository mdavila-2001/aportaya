-- Global utility functions (no schema)

-- Generate unique slug from title
CREATE OR REPLACE FUNCTION generate_unique_slug(p_title TEXT, p_table_name TEXT DEFAULT 'projects.project')
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
  exists_flag BOOLEAN;
BEGIN
  base_slug := lower(trim(regexp_replace(p_title, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  final_slug := base_slug;
  
  LOOP
    IF p_table_name = 'projects.project' THEN
      SELECT EXISTS(SELECT 1 FROM projects.project WHERE slug = final_slug) INTO exists_flag;
    ELSIF p_table_name = 'projects.category' THEN
      SELECT EXISTS(SELECT 1 FROM projects.category WHERE slug = final_slug) INTO exists_flag;
    END IF;
    
    EXIT WHEN NOT exists_flag;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Validate if user can donate to project
CREATE OR REPLACE FUNCTION can_user_donate(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status VARCHAR(50);
  project_approval VARCHAR(20);
  project_campaign VARCHAR(20);
  project_end_date TIMESTAMPTZ;
BEGIN
  SELECT status INTO user_status FROM users.user WHERE id = p_user_id;
  IF user_status NOT IN ('active') THEN
    RETURN FALSE;
  END IF;
  
  SELECT approval_status, campaign_status, end_date
  INTO project_approval, project_campaign, project_end_date
  FROM projects.project 
  WHERE id = p_project_id;
  
  IF project_approval = 'published' 
     AND project_campaign = 'in_progress' 
     AND project_end_date > now() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Calculate funding percentage
CREATE OR REPLACE FUNCTION calculate_funding_percentage(p_project_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  goal NUMERIC;
  raised NUMERIC;
BEGIN
  SELECT financial_goal, raised_amount INTO goal, raised
  FROM projects.project
  WHERE id = p_project_id;
  
  IF goal IS NULL OR goal = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((raised / goal) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Get unique donors count for project
CREATE OR REPLACE FUNCTION get_unique_donors_count(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM payments.donation
    WHERE project_id = p_project_id
      AND payment_status = 'completed'
      AND is_anonymous = FALSE
  );
END;
$$ LANGUAGE plpgsql;
