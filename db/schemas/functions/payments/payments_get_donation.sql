CREATE OR REPLACE FUNCTION payments.get_donation(p_id uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  user_id uuid,
  amount numeric(15,2),
  donation_date timestamptz,
  payment_method text,
  payment_reference text,
  payment_status text,
  is_anonymous boolean,
  project_title text,
  user_name text
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, d.project_id, d.user_id, d.amount, d.donation_date,
    d.payment_method, d.payment_reference, d.payment_status, d.is_anonymous,
    p.title as project_title,
    u.first_name || ' ' || u.last_name as user_name
  FROM payments.donation d
  LEFT JOIN projects.project p ON p.id = d.project_id
  LEFT JOIN users.user u ON u.id = d.user_id
  WHERE d.id = p_id;
END;
$$;
