-- Esquema: roles

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
