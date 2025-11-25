CREATE OR REPLACE FUNCTION payments.list_donations(
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_project_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_payment_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  amount numeric(15,2),
  donation_date timestamptz,
  payment_status text,
  is_anonymous boolean,
  project_title text,
  user_name text
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, d.amount, d.donation_date, d.payment_status, d.is_anonymous,
    p.title as project_title,
    CASE 
      WHEN d.is_anonymous THEN 'Anonymous'
      ELSE u.first_name || ' ' || u.last_name
    END as user_name
  FROM payments.donation d
  LEFT JOIN projects.project p ON p.id = d.project_id
  LEFT JOIN users.user u ON u.id = d.user_id
  WHERE 
    (p_project_id IS NULL OR d.project_id = p_project_id)
    AND (p_user_id IS NULL OR d.user_id = p_user_id)
    AND (p_payment_status IS NULL OR d.payment_status = p_payment_status)
  ORDER BY d.donation_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
