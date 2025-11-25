-- Esquema: files

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
