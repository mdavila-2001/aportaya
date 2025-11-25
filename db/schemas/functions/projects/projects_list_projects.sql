CREATE OR REPLACE FUNCTION projects.list_projects(
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_category_id int DEFAULT NULL,
  p_approval_status text DEFAULT NULL,
  p_campaign_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  summary text,
  financial_goal numeric(15,2),
  raised_amount numeric(15,2),
  category_id int,
  category_name text,
  creator_name text,
  approval_status text,
  campaign_status text,
  created_at timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.title, p.slug, p.summary, p.financial_goal, p.raised_amount,
    p.category_id, c.name as category_name,
    u.first_name || ' ' || u.last_name as creator_name,
    p.approval_status, p.campaign_status, p.created_at
  FROM projects.project p
  LEFT JOIN projects.category c ON c.id = p.category_id
  LEFT JOIN users.user u ON u.id = p.creator_id
  WHERE 
    (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_approval_status IS NULL OR p.approval_status = p_approval_status)
    AND (p_campaign_status IS NULL OR p.campaign_status = p_campaign_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
