-- Esquema: audit

CREATE TABLE IF NOT EXISTS audit.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users.user(id) ON DELETE SET NULL,
  table_name VARCHAR(100),
  record_id UUID,
  action VARCHAR(50),
  payload JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
