-- Payment and donation management functions

-- Create donation with validations
CREATE OR REPLACE FUNCTION create_donation(
  p_project_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_payment_method VARCHAR(50),
  p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  donation_id UUID;
BEGIN
  IF NOT can_user_donate(p_user_id, p_project_id) THEN
    RAISE EXCEPTION 'User cannot donate to this project';
  END IF;
  
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  INSERT INTO payments.donation (project_id, user_id, amount, payment_method, is_anonymous)
  VALUES (p_project_id, p_user_id, p_amount, p_payment_method, p_is_anonymous)
  RETURNING id INTO donation_id;
  
  RETURN donation_id;
END;
$$ LANGUAGE plpgsql;

-- Complete donation
CREATE OR REPLACE FUNCTION complete_donation(
  p_donation_id UUID,
  p_external_reference VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments.donation
  SET payment_status = 'completed', payment_reference = p_external_reference
  WHERE id = p_donation_id AND payment_status IN ('pending', 'processing');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Update donation status
CREATE OR REPLACE FUNCTION payments.update_donation_status(
  p_donation_id UUID,
  p_new_status VARCHAR,
  p_admin_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_new_status NOT IN ('pending','processing','completed','failed','refunded') THEN
    RAISE EXCEPTION 'Invalid donation status: %', p_new_status;
  END IF;

  UPDATE payments.donation SET payment_status = p_new_status WHERE id = p_donation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation not found: %', p_donation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Refund donation
CREATE OR REPLACE FUNCTION refund_donation(p_donation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments.donation SET payment_status = 'refunded'
  WHERE id = p_donation_id AND payment_status = 'completed';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Get donations by project
CREATE OR REPLACE FUNCTION payments.get_donations_by_project(p_project_id UUID)
RETURNS TABLE (
  donation_id UUID,
  user_id UUID,
  amount NUMERIC,
  donation_date TIMESTAMPTZ,
  payment_method VARCHAR,
  payment_status VARCHAR,
  is_anonymous BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, user_id, amount, donation_date, payment_method, payment_status, is_anonymous
  FROM payments.donation WHERE project_id = p_project_id ORDER BY donation_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get donations by user
CREATE OR REPLACE FUNCTION payments.get_donations_by_user(p_user_id UUID)
RETURNS TABLE (
  donation_id UUID,
  project_id UUID,
  amount NUMERIC,
  donation_date TIMESTAMPTZ,
  payment_method VARCHAR,
  payment_status VARCHAR,
  is_anonymous BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, project_id, amount, donation_date, payment_method, payment_status, is_anonymous
  FROM payments.donation WHERE user_id = p_user_id ORDER BY donation_date DESC;
END;
$$ LANGUAGE plpgsql;
