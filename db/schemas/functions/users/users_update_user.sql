CREATE OR REPLACE FUNCTION users.update_user(
  p_id uuid,
  p_first_name text DEFAULT NULL,
  p_middle_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_mother_last_name text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_profile_image_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  -- Validar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_id) THEN
    RETURN FALSE;
  END IF;

  UPDATE users.user SET
    first_name = COALESCE(p_first_name, first_name),
    middle_name = COALESCE(p_middle_name, middle_name),
    last_name = COALESCE(p_last_name, last_name),
    mother_last_name = COALESCE(p_mother_last_name, mother_last_name),
    gender = COALESCE(p_gender, gender),
    birth_date = COALESCE(p_birth_date, birth_date),
    profile_image_id = COALESCE(p_profile_image_id, profile_image_id),
    updated_at = now()
  WHERE id = p_id;

  RETURN TRUE;
END;
$$;
