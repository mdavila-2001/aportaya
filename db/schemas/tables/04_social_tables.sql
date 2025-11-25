-- Esquema: social

CREATE TABLE IF NOT EXISTS social.comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS social.update (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social.report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  description TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS social.favorite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);
