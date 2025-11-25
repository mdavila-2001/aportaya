-- Authentication and user management functions

-- Create admin user with role assignment
CREATE OR REPLACE FUNCTION users.create_admin(
  p_first_name VARCHAR,
  p_middle_name VARCHAR,
  p_last_name VARCHAR,
  p_mother_last_name VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR,
  p_gender VARCHAR DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_profile_image_id UUID DEFAULT NULL,
  p_role_id INT DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO users.user (
    id, first_name, middle_name, last_name, mother_last_name, email, password_hash, 
    gender, birth_date, profile_image_id, status, registration_date, updated_at
  )
  VALUES (
    v_user_id, p_first_name, p_middle_name, p_last_name, p_mother_last_name, p_email,
    crypt(p_password, gen_salt('bf')), p_gender, p_birth_date, p_profile_image_id,
    'pending_verification', now(), now()
  );

  INSERT INTO roles.user_role (user_id, role_id) VALUES (v_user_id, p_role_id);
  INSERT INTO users.email_verification_token (user_id) VALUES (v_user_id);

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Register regular user with role assignment
CREATE OR REPLACE FUNCTION users.register_user(
  p_first_name VARCHAR,
  p_middle_name VARCHAR,
  p_last_name VARCHAR,
  p_mother_last_name VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR,
  p_gender VARCHAR DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_profile_image_id UUID DEFAULT NULL,
  p_role_id INT DEFAULT 2
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO users.user (
    id, first_name, middle_name, last_name, mother_last_name, email, password_hash, 
    gender, birth_date, profile_image_id, status, registration_date, updated_at
  )
  VALUES (
    v_user_id, p_first_name, p_middle_name, p_last_name, p_mother_last_name, p_email,
    crypt(p_password, gen_salt('bf')), p_gender, p_birth_date, p_profile_image_id,
    'pending_verification', now(), now()
  );

  INSERT INTO roles.user_role (user_id, role_id) VALUES (v_user_id, p_role_id);
  INSERT INTO users.email_verification_token (user_id) VALUES (v_user_id);

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- User login
CREATE OR REPLACE FUNCTION users.login_user(
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM users.user
  WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash)
    AND status IN ('active', 'pending_verification')
    AND deleted_at IS NULL;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Correo o Contraseña Incorrecta';
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Change password
CREATE OR REPLACE FUNCTION users.change_password(
  p_user_id UUID,
  p_old_password VARCHAR,
  p_new_password VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  SELECT password_hash = crypt(p_old_password, password_hash) INTO v_valid
  FROM users.user WHERE id = p_user_id;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  UPDATE users.user
  SET password_hash = crypt(p_new_password, gen_salt('bf')), updated_at = now()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Suspend user
CREATE OR REPLACE FUNCTION users.suspend_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users.user SET status = 'suspended'
  WHERE id = p_user_id AND status IN ('active');
  
  IF FOUND THEN
    UPDATE users.user_status_history
    SET changed_by = p_admin_id, reason = p_reason
    WHERE user_id = p_user_id
      AND new_status = 'suspended'
      AND change_date >= now() - INTERVAL '1 second';
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update profile image
CREATE OR REPLACE FUNCTION users.update_profile_image(
  p_user_id UUID,
  p_new_image_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_image_id UUID;
BEGIN
  SELECT profile_image_id INTO v_old_image_id FROM users.user WHERE id = p_user_id;
  
  UPDATE users.user SET profile_image_id = p_new_image_id, updated_at = now()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  UPDATE files.image SET is_temporary = FALSE WHERE id = p_new_image_id;
  
  IF v_old_image_id IS NOT NULL THEN
    UPDATE files.image SET is_temporary = TRUE WHERE id = v_old_image_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
