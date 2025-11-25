CREATE OR REPLACE FUNCTION payments.create_donation(
  p_project_id uuid,
  p_user_id uuid,
  p_amount numeric(15,2),
  p_payment_method text DEFAULT NULL,
  p_payment_reference text DEFAULT NULL,
  p_is_anonymous boolean DEFAULT FALSE
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validar que el proyecto y usuario existen
  IF NOT EXISTS (SELECT 1 FROM projects.project WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users.user WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insertar donación
  INSERT INTO payments.donation (
    project_id, user_id, amount, payment_method,
    payment_reference, is_anonymous, payment_status
  ) VALUES (
    p_project_id, p_user_id, p_amount, p_payment_method,
    p_payment_reference, p_is_anonymous, 'pending'
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
