CREATE OR REPLACE FUNCTION payments.update_payment_status(
  p_donation_id uuid,
  p_status text,
  p_provider text DEFAULT NULL,
  p_payload jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_donation_amount numeric(15,2);
  v_project_id uuid;
BEGIN
  -- Validar que la donación existe
  IF NOT EXISTS (SELECT 1 FROM payments.donation WHERE id = p_donation_id) THEN
    RETURN FALSE;
  END IF;

  -- Obtener datos para actualizar raised_amount si es completed
  SELECT amount, project_id INTO v_donation_amount, v_project_id
  FROM payments.donation WHERE id = p_donation_id;

  -- Actualizar estado de la donación
  UPDATE payments.donation SET
    payment_status = p_status
  WHERE id = p_donation_id;

  -- Si el estado es completed, actualizar raised_amount del proyecto
  IF p_status = 'completed' THEN
    UPDATE projects.project
    SET raised_amount = raised_amount + v_donation_amount
    WHERE id = v_project_id;
  END IF;

  -- Registrar transacción si se provee payload
  IF p_payload IS NOT NULL THEN
    INSERT INTO payments.payment_transaction (
      donation_id, provider, amount, status, payload
    ) VALUES (
      p_donation_id, p_provider, v_donation_amount, p_status, p_payload
    );
  END IF;

  RETURN TRUE;
END;
$$;
