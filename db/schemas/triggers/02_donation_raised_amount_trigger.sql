-- Trigger function to update project raised_amount when a donation is completed
CREATE OR REPLACE FUNCTION payments.update_project_raised_amount()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Si la donación está siendo insertada con estado 'completed'
  -- O si está cambiando de otro estado a 'completed'
  IF (TG_OP = 'INSERT' AND NEW.payment_status = 'completed') OR
     (TG_OP = 'UPDATE' AND OLD.payment_status != 'completed' AND NEW.payment_status = 'completed') THEN
    
    -- Incrementar el raised_amount del proyecto
    UPDATE projects.project
    SET raised_amount = COALESCE(raised_amount, 0) + NEW.amount
    WHERE id = NEW.project_id;
    
  -- Si la donación está cambiando de 'completed' a otro estado (ej: refund)
  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status = 'completed' AND NEW.payment_status != 'completed' THEN
    
    -- Decrementar el raised_amount del proyecto
    UPDATE projects.project
    SET raised_amount = COALESCE(raised_amount, 0) - OLD.amount
    WHERE id = OLD.project_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger en la tabla donation
CREATE TRIGGER trg_update_raised_amount
AFTER INSERT OR UPDATE ON payments.donation
FOR EACH ROW
EXECUTE FUNCTION payments.update_project_raised_amount();
