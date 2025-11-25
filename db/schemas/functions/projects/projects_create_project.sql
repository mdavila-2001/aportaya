CREATE OR REPLACE FUNCTION projects.generate_unique_slug(p_title text)
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  base text;
  candidate text;
  suffix int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(p_title,''), '[^a-z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  candidate := base;

  WHILE EXISTS (SELECT 1 FROM projects.project WHERE slug = candidate) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION projects.create_project(
  p_creator_id uuid,
  p_title text,
  p_description text,
  p_summary text DEFAULT NULL,
  p_financial_goal numeric(15,2),
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_category_id int,
  p_location text DEFAULT NULL,
  p_video_url text DEFAULT NULL,
  p_proof_document_id uuid DEFAULT NULL,
  p_currency text DEFAULT 'USD'
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
  v_slug text;
BEGIN
  v_slug := projects.generate_unique_slug(p_title);

  INSERT INTO projects.project (
    creator_id, title, slug, description, summary,
    financial_goal, raised_amount, start_date, end_date,
    approval_status, campaign_status, category_id, location,
    video_url, proof_document_id, currency, created_at, updated_at
  ) VALUES (
    p_creator_id, p_title, v_slug, p_description, p_summary,
    p_financial_goal, 0, p_start_date, p_end_date,
    'draft', 'not_started', p_category_id, p_location,
    p_video_url, p_proof_document_id, coalesce(p_currency,'USD'), now(), now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
