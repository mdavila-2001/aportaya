CREATE OR REPLACE FUNCTION users.list_users(
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  status text,
  registration_date timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id, u.first_name, u.last_name, u.email, u.status, u.registration_date
  FROM users.user u
  WHERE 
    u.deleted_at IS NULL
    AND (p_status IS NULL OR u.status = p_status)
    AND (p_search IS NULL OR (
      u.first_name ILIKE '%' || p_search || '%' OR
      u.last_name ILIKE '%' || p_search || '%' OR
      u.email ILIKE '%' || p_search || '%'
    ))
  ORDER BY u.registration_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
