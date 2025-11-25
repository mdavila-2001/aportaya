CREATE OR REPLACE FUNCTION users.get_user(p_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  middle_name text,
  last_name text,
  mother_last_name text,
  email text,
  gender text,
  birth_date date,
  profile_image_id uuid,
  status text,
  registration_date timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id, u.first_name, u.middle_name, u.last_name, u.mother_last_name,
    u.email, u.gender, u.birth_date, u.profile_image_id, u.status,
    u.registration_date, u.updated_at, u.deleted_at
  FROM users.user u
  WHERE u.id = p_id AND u.deleted_at IS NULL;
END;
$$;
