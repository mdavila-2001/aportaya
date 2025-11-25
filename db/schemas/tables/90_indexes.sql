-- Índices
CREATE INDEX IF NOT EXISTS idx_user_email ON users.user(email);
CREATE INDEX IF NOT EXISTS idx_user_status ON users.user(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_slug ON projects.project(slug);
CREATE INDEX IF NOT EXISTS idx_project_creator ON projects.project(creator_id);
CREATE INDEX IF NOT EXISTS idx_project_category ON projects.project(category_id);
CREATE INDEX IF NOT EXISTS idx_project_published ON projects.project(approval_status, campaign_status, end_date)
  WHERE approval_status = 'published' AND campaign_status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_project_images ON projects.project_image(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_project_cover_image ON projects.project_image(project_id) WHERE is_cover = TRUE;
CREATE INDEX IF NOT EXISTS idx_donation_project ON payments.donation(project_id);
CREATE INDEX IF NOT EXISTS idx_donation_user ON payments.donation(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_user_project ON payments.donation(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_donation_status ON payments.donation(payment_status);
CREATE INDEX IF NOT EXISTS idx_comment_project ON social.comment(project_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_message_conv ON messaging.message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_unread ON messaging.message(conversation_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_favorite_user ON social.favorite(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit.audit_log(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit.audit_log(table_name, record_id);
