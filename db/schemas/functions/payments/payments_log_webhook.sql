CREATE OR REPLACE FUNCTION payments.log_webhook(
  p_source text,
  p_event_type text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO payments.webhook_event (
    source, event_type, payload, received_at, status
  ) VALUES (
    p_source, p_event_type, p_payload, now(), 'pending'
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
