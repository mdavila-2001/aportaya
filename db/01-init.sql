-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Esquemas
\i /docker-entrypoint-initdb.d/schemas/tables/00_schemas.sql

-- Tablas por esquema
\i /docker-entrypoint-initdb.d/schemas/tables/08_files_tables.sql
\i /docker-entrypoint-initdb.d/schemas/tables/01_users_tables.sql
\i /docker-entrypoint-initdb.d/schemas/tables/02_projects_tables.sql
\i /docker-entrypoint-initdb.d/schemas/tables/03_payments_tables.sql
\i /docker-entrypoint-initdb.d/schemas/tables/04_social_tables.sql
\i /docker-entrypoint-initdb.d/schemas/tables/05_messaging_tables.sql
\i /docker-entrypoint-initdb.d/schemas/tables/06_audit_tables.sql
\i /docker-entrypoint-initdb.d/schemas/tables/07_roles_tables.sql

-- Funciones / Procedimientos
\i /docker-entrypoint-initdb.d/schemas/functions/00_helpers.sql
\i /docker-entrypoint-initdb.d/schemas/functions/00_global_utilities.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_create_project.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_update_project.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_delete_project.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_set_project_status.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_get_project.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_list_projects.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_management.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_campaigns.sql
\i /docker-entrypoint-initdb.d/schemas/functions/projects/projects_queries.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_create_user.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_update_user.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_set_user_status.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_manage_roles.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_generate_tokens.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_get_user.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_list_users.sql
\i /docker-entrypoint-initdb.d/schemas/functions/users/users_auth.sql
\i /docker-entrypoint-initdb.d/schemas/functions/payments/payments_create_donation.sql
\i /docker-entrypoint-initdb.d/schemas/functions/payments/payments_update_payment_status.sql
\i /docker-entrypoint-initdb.d/schemas/functions/payments/payments_log_webhook.sql
\i /docker-entrypoint-initdb.d/schemas/functions/payments/payments_get_donation.sql
\i /docker-entrypoint-initdb.d/schemas/functions/payments/payments_list_donations.sql
\i /docker-entrypoint-initdb.d/schemas/functions/payments/payments_management.sql
\i /docker-entrypoint-initdb.d/schemas/functions/payments/payments_statistics.sql
\i /docker-entrypoint-initdb.d/schemas/functions/roles/roles_manage_abilities.sql
\i /docker-entrypoint-initdb.d/schemas/functions/roles/roles_management.sql
\i /docker-entrypoint-initdb.d/schemas/functions/social/social_create_comment.sql
\i /docker-entrypoint-initdb.d/schemas/functions/social/social_create_update.sql
\i /docker-entrypoint-initdb.d/schemas/functions/social/social_toggle_favorite.sql
\i /docker-entrypoint-initdb.d/schemas/functions/social/social_create_report.sql
\i /docker-entrypoint-initdb.d/schemas/functions/social/social_list_comments.sql
\i /docker-entrypoint-initdb.d/schemas/functions/social/social_list_updates.sql
\i /docker-entrypoint-initdb.d/schemas/functions/social/social_queries.sql
\i /docker-entrypoint-initdb.d/schemas/functions/messaging/messaging_create_conversation.sql
\i /docker-entrypoint-initdb.d/schemas/functions/messaging/messaging_send_message.sql
\i /docker-entrypoint-initdb.d/schemas/functions/messaging/messaging_mark_messages_read.sql
\i /docker-entrypoint-initdb.d/schemas/functions/messaging/messaging_list_conversations.sql
\i /docker-entrypoint-initdb.d/schemas/functions/messaging/messaging_list_messages.sql
\i /docker-entrypoint-initdb.d/schemas/functions/audit/audit_log_action.sql
\i /docker-entrypoint-initdb.d/schemas/functions/audit/audit_list_logs.sql
\i /docker-entrypoint-initdb.d/schemas/functions/files/files_upload_image.sql
\i /docker-entrypoint-initdb.d/schemas/functions/files/files_upload_document.sql
\i /docker-entrypoint-initdb.d/schemas/functions/files/files_management.sql
\i /docker-entrypoint-initdb.d/schemas/functions/maintenance/maintenance_functions.sql

-- Triggers
\i /docker-entrypoint-initdb.d/schemas/triggers/00_updated_at_triggers.sql
\i /docker-entrypoint-initdb.d/schemas/triggers/01_payment_transaction_index.sql
\i /docker-entrypoint-initdb.d/schemas/triggers/audit_triggers.sql
\i /docker-entrypoint-initdb.d/schemas/triggers/status_history_triggers.sql

-- Vistas
\i /docker-entrypoint-initdb.d/schemas/views/00_top_project_categories.sql
\i /docker-entrypoint-initdb.d/schemas/views/01_dashboard_projects.sql
\i /docker-entrypoint-initdb.d/schemas/views/02_project_details.sql
\i /docker-entrypoint-initdb.d/schemas/views/03_user_profile.sql
\i /docker-entrypoint-initdb.d/schemas/views/04_donation_summary.sql
\i /docker-entrypoint-initdb.d/schemas/views/05_admin_dashboard.sql
\i /docker-entrypoint-initdb.d/schemas/views/06_active_projects.sql
\i /docker-entrypoint-initdb.d/schemas/views/07_project_feed.sql
\i /docker-entrypoint-initdb.d/schemas/views/08_top_backers.sql
\i /docker-entrypoint-initdb.d/schemas/views/09_completed_donations.sql
\i /docker-entrypoint-initdb.d/schemas/views/10_view_projects.sql

-- Índices
\i /docker-entrypoint-initdb.d/schemas/tables/90_indexes.sql

-- Seeds (opcional)
\i /docker-entrypoint-initdb.d/seed.sql
