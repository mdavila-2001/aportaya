-- Esquema: users

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

-- Tokens y recuperación
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
