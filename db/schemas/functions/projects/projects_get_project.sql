CREATE OR REPLACE FUNCTION projects.get_project(p_id uuid)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  title text,
  slug text,
  description text,
  summary text,
  financial_goal numeric(15,2),
  raised_amount numeric(15,2),
  start_date timestamptz,
  end_date timestamptz,
  approval_status text,
  campaign_status text,
  category_id int,
  location text,
  video_url text,
  proof_document_id uuid,
  currency text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.creator_id, p.title, p.slug, p.description, p.summary,
    p.financial_goal, p.raised_amount, p.start_date, p.end_date,
    p.approval_status, p.campaign_status, p.category_id, p.location,
    p.video_url, p.proof_document_id, p.currency, p.created_at, p.updated_at
  FROM projects.project p
  WHERE p.id = p_id;
END;
$$;
