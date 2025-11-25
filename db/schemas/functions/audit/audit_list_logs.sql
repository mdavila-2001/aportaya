CREATE OR REPLACE FUNCTION audit.list_logs(
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0,
  p_actor_id uuid DEFAULT NULL,
  p_table_name text DEFAULT NULL,
  p_action text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  actor_id uuid,
  actor_name text,
  table_name text,
  record_id uuid,
  action text,
  payload jsonb,
  reason text,
  created_at timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id, al.actor_id, 
    CASE WHEN al.actor_id IS NOT NULL 
         THEN u.first_name || ' ' || u.last_name 
         ELSE 'System' 
    END as actor_name,
    al.table_name, al.record_id, al.action, al.payload, al.reason, al.created_at
  FROM audit.audit_log al
  LEFT JOIN users.user u ON u.id = al.actor_id
  WHERE 
    (p_actor_id IS NULL OR al.actor_id = p_actor_id)
    AND (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_action IS NULL OR al.action = p_action)
  ORDER BY al.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
