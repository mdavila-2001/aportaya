-- Social interaction query functions

-- Get comments by project
CREATE OR REPLACE FUNCTION social.get_comments_by_project(p_project_id UUID)
RETURNS TABLE (
  comment_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, user_id, content, created_at, status
  FROM social.comment WHERE project_id = p_project_id ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Get favorites by user
CREATE OR REPLACE FUNCTION social.get_favorites_by_user(p_user_id UUID)
RETURNS TABLE (
  favorite_id UUID,
  project_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, project_id, created_at
  FROM social.favorite WHERE user_id = p_user_id ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;
