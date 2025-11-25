-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Esquemas
\i db/schemas/tables/00_schemas.sql

-- Tablas por esquema
\i db/schemas/tables/08_files_tables.sql
\i db/schemas/tables/01_users_tables.sql
\i db/schemas/tables/02_projects_tables.sql
\i db/schemas/tables/03_payments_tables.sql
\i db/schemas/tables/04_social_tables.sql
\i db/schemas/tables/05_messaging_tables.sql
\i db/schemas/tables/06_audit_tables.sql
\i db/schemas/tables/07_roles_tables.sql

-- Funciones / Procedimientos
\i db/schemas/functions/00_helpers.sql
\i db/schemas/functions/00_global_utilities.sql
\i db/schemas/functions/projects/projects_create_project.sql
\i db/schemas/functions/projects/projects_update_project.sql
\i db/schemas/functions/projects/projects_delete_project.sql
\i db/schemas/functions/projects/projects_set_project_status.sql
\i db/schemas/functions/projects/projects_get_project.sql
\i db/schemas/functions/projects/projects_list_projects.sql
\i db/schemas/functions/projects/projects_management.sql
\i db/schemas/functions/projects/projects_campaigns.sql
\i db/schemas/functions/projects/projects_queries.sql
\i db/schemas/functions/users/users_create_user.sql
\i db/schemas/functions/users/users_update_user.sql
\i db/schemas/functions/users/users_set_user_status.sql
\i db/schemas/functions/users/users_manage_roles.sql
\i db/schemas/functions/users/users_generate_tokens.sql
\i db/schemas/functions/users/users_get_user.sql
\i db/schemas/functions/users/users_list_users.sql
\i db/schemas/functions/users/users_auth.sql
\i db/schemas/functions/payments/payments_create_donation.sql
\i db/schemas/functions/payments/payments_update_payment_status.sql
\i db/schemas/functions/payments/payments_log_webhook.sql
\i db/schemas/functions/payments/payments_get_donation.sql
\i db/schemas/functions/payments/payments_list_donations.sql
\i db/schemas/functions/payments/payments_management.sql
\i db/schemas/functions/payments/payments_statistics.sql
\i db/schemas/functions/roles/roles_manage_abilities.sql
\i db/schemas/functions/roles/roles_management.sql
\i db/schemas/functions/social/social_create_comment.sql
\i db/schemas/functions/social/social_create_update.sql
\i db/schemas/functions/social/social_toggle_favorite.sql
\i db/schemas/functions/social/social_create_report.sql
\i db/schemas/functions/social/social_list_comments.sql
\i db/schemas/functions/social/social_list_updates.sql
\i db/schemas/functions/social/social_queries.sql
\i db/schemas/functions/messaging/messaging_create_conversation.sql
\i db/schemas/functions/messaging/messaging_send_message.sql
\i db/schemas/functions/messaging/messaging_mark_messages_read.sql
\i db/schemas/functions/messaging/messaging_list_conversations.sql
\i db/schemas/functions/messaging/messaging_list_messages.sql
\i db/schemas/functions/audit/audit_log_action.sql
\i db/schemas/functions/audit/audit_list_logs.sql
\i db/schemas/functions/files/files_upload_image.sql
\i db/schemas/functions/files/files_upload_document.sql
\i db/schemas/functions/files/files_management.sql
\i db/schemas/functions/maintenance/maintenance_functions.sql

-- Triggers
\i db/schemas/triggers/00_updated_at_triggers.sql
\i db/schemas/triggers/01_payment_transaction_index.sql
\i db/schemas/triggers/audit_triggers.sql
\i db/schemas/triggers/status_history_triggers.sql

-- Vistas
\i db/schemas/views/00_top_project_categories.sql
\i db/schemas/views/01_dashboard_projects.sql
\i db/schemas/views/02_project_details.sql
\i db/schemas/views/03_user_profile.sql
\i db/schemas/views/04_donation_summary.sql
\i db/schemas/views/05_admin_dashboard.sql
\i db/schemas/views/06_active_projects.sql
\i db/schemas/views/07_project_feed.sql
\i db/schemas/views/08_top_backers.sql
\i db/schemas/views/09_completed_donations.sql
\i db/schemas/views/10_view_projects.sql

-- Índices
\i db/schemas/tables/90_indexes.sql

-- Seeds (opcional)
\i db/seed.sql
