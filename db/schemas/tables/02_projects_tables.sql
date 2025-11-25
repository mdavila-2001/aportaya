-- Esquema: projects

CREATE TABLE IF NOT EXISTS projects.category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(255),
  parent_id INT REFERENCES projects.category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projects.project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  summary VARCHAR(500),
  financial_goal NUMERIC(15,2) NOT NULL,
  raised_amount NUMERIC(15,2) DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  campaign_status VARCHAR(20) NOT NULL DEFAULT 'not_started',
  category_id INT REFERENCES projects.category(id) ON DELETE SET NULL,
  location VARCHAR(255),
  video_url VARCHAR(500),
  proof_document_id UUID REFERENCES files.document(id) ON DELETE SET NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_goal_positive CHECK (financial_goal > 0),
  CONSTRAINT project_raised_nonneg CHECK (raised_amount >= 0),
  CONSTRAINT project_dates_valid CHECK (end_date > start_date),
  CONSTRAINT project_approval_status_allowed CHECK (approval_status IN ('draft','in_review','observed','rejected','published')),
  CONSTRAINT project_campaign_status_allowed CHECK (campaign_status IN ('not_started','in_progress','paused','finished'))
);

CREATE TABLE IF NOT EXISTS projects.project_image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES files.image(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects.category_requirements (
  category_id INT NOT NULL REFERENCES projects.category(id) ON DELETE CASCADE,
  requirement_name VARCHAR(255) NOT NULL,
  requirement_value TEXT NOT NULL,
  PRIMARY KEY (category_id, requirement_name)
);

CREATE TABLE IF NOT EXISTS projects.project_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES users.user(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,
  rejection_reason TEXT,
  approval_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects.project_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by UUID REFERENCES users.user(id) ON DELETE SET NULL,
  reason TEXT,
  change_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects.project_status_interval (
  project_id UUID REFERENCES projects.project(id) ON DELETE CASCADE,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL,
  PRIMARY KEY (project_id, effective_from)
);

CREATE TABLE IF NOT EXISTS projects.project_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects.project(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users.user(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
