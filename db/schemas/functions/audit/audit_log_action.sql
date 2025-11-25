CREATE OR REPLACE FUNCTION audit.log_action(
  p_actor_id uuid DEFAULT NULL,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_payload jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO audit.audit_log (
    actor_id, table_name, record_id, action, payload, reason, created_at
  ) VALUES (
    p_actor_id, p_table_name, p_record_id, p_action, p_payload, p_reason, now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
