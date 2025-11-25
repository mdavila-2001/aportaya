-- Esquema: payments

CREATE TABLE IF NOT EXISTS payments.donation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users.user(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL,
  donation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  is_anonymous BOOLEAN DEFAULT FALSE,
  CONSTRAINT donation_amount_positive CHECK (amount > 0),
  CONSTRAINT donation_payment_status_allowed CHECK (payment_status IN ('pending','processing','completed','failed','refunded'))
);

CREATE TABLE IF NOT EXISTS payments.payment_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES payments.donation(id) ON DELETE RESTRICT,
  provider VARCHAR(50),
  method VARCHAR(50),
  amount NUMERIC(15,2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  external_reference VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments.webhook_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50),
  event_type VARCHAR(50),
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending'
);
