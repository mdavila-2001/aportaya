-- Generic updated_at triggers using public.set_updated_at()

-- users.user
DROP TRIGGER IF EXISTS trg_users_user_updated_at ON users."user";
CREATE TRIGGER trg_users_user_updated_at
BEFORE UPDATE ON users."user"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- projects.project
DROP TRIGGER IF EXISTS trg_projects_project_updated_at ON projects.project;
CREATE TRIGGER trg_projects_project_updated_at
BEFORE UPDATE ON projects.project
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- payments.payment_transaction
DROP TRIGGER IF EXISTS trg_payments_payment_transaction_updated_at ON payments.payment_transaction;
CREATE TRIGGER trg_payments_payment_transaction_updated_at
BEFORE UPDATE ON payments.payment_transaction
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
