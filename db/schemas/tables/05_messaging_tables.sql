-- Esquema: messaging

CREATE TABLE IF NOT EXISTS messaging.conversation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS messaging.message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN DEFAULT FALSE
);
