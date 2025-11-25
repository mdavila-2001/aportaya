-- Files
CREATE TABLE IF NOT EXISTS files.image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_temporary BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files.document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  document_type VARCHAR(50) DEFAULT 'proof',
  is_temporary BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users.user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  last_name VARCHAR(255) NOT NULL,
  mother_last_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  birth_date DATE,
  profile_image_id UUID REFERENCES files.image(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT user_status_allowed CHECK (status IN ('pending_verification','active','suspended','banned','deleted')),
  CONSTRAINT user_sex_allowed CHECK (gender IN ('M', 'F', 'O', 'U'))
);

CREATE TABLE IF NOT EXISTS users.user_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by UUID REFERENCES users.user(id) ON DELETE SET NULL,
  reason TEXT,
  change_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users.user_status_interval (
  user_id UUID REFERENCES users.user(id) ON DELETE CASCADE,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, effective_from)
);

CREATE TABLE IF NOT EXISTS users.email_verification_token (
  user_id UUID PRIMARY KEY REFERENCES users.user(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS users.password_reset_token (
  user_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  PRIMARY KEY (user_id, token)
);

-- Projects
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

-- Payments
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

-- Social
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

-- Messaging
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

-- Audit
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

-- Roles
CREATE TABLE IF NOT EXISTS roles.role_category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS roles.module (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INT NOT NULL REFERENCES roles.role_category(id)
);

CREATE TABLE IF NOT EXISTS roles.ability (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  label VARCHAR(50),
  module_id INT NOT NULL REFERENCES roles.module(id)
);

CREATE TABLE IF NOT EXISTS roles.role (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS roles.role_ability (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles.role(id),
  ability_id INT NOT NULL REFERENCES roles.ability(id),
  granted BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (role_id, ability_id)
);

CREATE TABLE IF NOT EXISTS roles.user_role (
  user_id UUID NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles.role(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);