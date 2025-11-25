-- Complete RBAC system functions

-- Create role category
CREATE OR REPLACE FUNCTION roles.create_role_category(
  p_name VARCHAR,
  p_description TEXT
)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO roles.role_category(name, description)
  VALUES (p_name, p_description) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Create module
CREATE OR REPLACE FUNCTION roles.create_module(
  p_name VARCHAR,
  p_category_id INT
)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO roles.module(name, category_id)
  VALUES (p_name, p_category_id) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Create ability
CREATE OR REPLACE FUNCTION roles.create_ability(
  p_name VARCHAR,
  p_label VARCHAR,
  p_module_id INT
)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO roles.ability(name, label, module_id)
  VALUES (p_name, p_label, p_module_id) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Create role
CREATE OR REPLACE FUNCTION roles.create_role(p_name VARCHAR)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO roles.role(name) VALUES (p_name) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Assign ability to role
CREATE OR REPLACE FUNCTION roles.assign_ability_to_role(
  p_role_id INT,
  p_ability_id INT,
  p_granted BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO roles.role_ability(role_id, ability_id, granted)
  VALUES (p_role_id, p_ability_id, p_granted)
  ON CONFLICT (role_id, ability_id) DO UPDATE SET granted = EXCLUDED.granted;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Assign role to user
CREATE OR REPLACE FUNCTION roles.assign_role_to_user(
  p_user_id UUID,
  p_role_id INT
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO roles.user_role(user_id, role_id) VALUES (p_user_id, p_role_id)
  ON CONFLICT DO NOTHING;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Remove role from user
CREATE OR REPLACE FUNCTION roles.remove_role_from_user(
  p_user_id UUID,
  p_role_id INT
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM roles.user_role WHERE user_id = p_user_id AND role_id = p_role_id;
END;
$$ LANGUAGE plpgsql;

-- Check user permission
CREATE OR REPLACE FUNCTION roles.check_user_permission(
  p_user_id UUID,
  p_module_name VARCHAR,
  p_ability_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM roles.user_role ur
    JOIN roles.role_ability ra ON ra.role_id = ur.role_id
    JOIN roles.ability a ON a.id = ra.ability_id
    JOIN roles.module m ON m.id = a.module_id
    WHERE ur.user_id = p_user_id
      AND m.name = p_module_name
      AND a.name = p_ability_name
      AND ra.granted = TRUE
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;
