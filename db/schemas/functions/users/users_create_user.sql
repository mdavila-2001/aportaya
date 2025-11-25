CREATE OR REPLACE FUNCTION users.create_user(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_password_hash text,
  p_middle_name text DEFAULT NULL,
  p_mother_last_name text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_profile_image_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validar email único
  IF EXISTS (SELECT 1 FROM users.user WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;

  INSERT INTO users.user (
    first_name, last_name, email, password_hash,
    middle_name, mother_last_name, gender, birth_date,
    profile_image_id, status, registration_date, updated_at
  ) VALUES (
    p_first_name, p_last_name, p_email, p_password_hash,
    p_middle_name, p_mother_last_name, p_gender, p_birth_date,
    p_profile_image_id, 'pending_verification', now(), now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
