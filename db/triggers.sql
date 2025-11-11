-- ========================================
-- TRIGGERS Y FUNCIONES TRIGGER
-- Aporta Ya - Crowdfunding Platform
-- Versión: 1.0.0
-- Fecha: 24 de octubre de 2025
-- ========================================
-- Este archivo contiene todos los triggers automáticos
-- Ejecutar DESPUÉS de database.sql
-- ========================================

-- ========================================
-- TABLA DE CONTENIDOS
-- ========================================
/*
1. TRIGGERS para updated_at
   - Actualización automática de timestamp

2. TRIGGERS para raised_amount
   - Actualización automática del monto recaudado

3. TRIGGERS para historial de estados
   - Log de cambios en usuarios
   - Log de cambios en proyectos

4. TRIGGERS para campaign_status automático
   - Cambio automático basado en fechas
*/

-- ========================================
-- 1. TRIGGERS PARA updated_at AUTOMÁTICO
-- ========================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a users.user
CREATE TRIGGER set_timestamp_users_user
  BEFORE UPDATE ON users.user
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Aplicar trigger a projects.project
CREATE TRIGGER set_timestamp_projects_project
  BEFORE UPDATE ON projects.project
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Aplicar trigger a payments.payment_transaction
CREATE TRIGGER set_timestamp_payment_transaction
  BEFORE UPDATE ON payments.payment_transaction
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- ========================================
-- 2. TRIGGERS PARA ACTUALIZAR raised_amount AUTOMÁTICAMENTE
-- ========================================

-- Función para actualizar el monto recaudado cuando se completa una donación
CREATE OR REPLACE FUNCTION update_project_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la donación cambia a 'completed'
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE projects.project
    SET raised_amount = raised_amount + NEW.amount
    WHERE id = NEW.project_id;
  END IF;
  
  -- Si la donación cambia de 'completed' a otro estado (reembolso)
  IF OLD.payment_status = 'completed' AND NEW.payment_status != 'completed' THEN
    UPDATE projects.project
    SET raised_amount = raised_amount - NEW.amount
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_raised_amount_on_donation
  AFTER INSERT OR UPDATE ON payments.donation
  FOR EACH ROW
  EXECUTE FUNCTION update_project_raised_amount();

-- ========================================
-- 3. TRIGGERS PARA HISTORIAL DE ESTADOS
-- ========================================

-- ----------------------------------------
-- 3.1 Historial de Estados de Usuario
-- ----------------------------------------

-- Función para registrar cambios de estado en usuarios
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO users.user_status_history (
      id,
      user_id,
      old_status,
      new_status,
      change_date
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      OLD.status,
      NEW.status,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_user_status
  AFTER UPDATE ON users.user
  FOR EACH ROW
  EXECUTE FUNCTION log_user_status_change();

-- ----------------------------------------
-- 3.2 Historial de Estados de Proyecto
-- ----------------------------------------

-- Función para registrar cambios de approval_status y campaign_status en proyectos
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log cambios en approval_status
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO projects.project_status_history (
      id,
      project_id,
      old_status,
      new_status,
      change_date
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      OLD.approval_status,
      NEW.approval_status,
      now()
    );
  END IF;
  
  -- Log cambios en campaign_status
  IF OLD.campaign_status IS DISTINCT FROM NEW.campaign_status THEN
    INSERT INTO projects.project_status_history (
      id,
      project_id,
      old_status,
      new_status,
      change_date
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      OLD.campaign_status,
      NEW.campaign_status,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_project_status
  AFTER UPDATE ON projects.project
  FOR EACH ROW
  EXECUTE FUNCTION log_project_status_change();

-- ========================================
-- 4. TRIGGER PARA ACTUALIZAR campaign_status AUTOMÁTICAMENTE
-- ========================================

-- Función para cambiar campaign_status basado en fechas
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el proyecto fue publicado y la fecha de inicio llegó
  IF NEW.approval_status = 'published' THEN
    IF NEW.start_date <= now() AND NEW.end_date > now() AND NEW.campaign_status = 'not_started' THEN
      NEW.campaign_status = 'in_progress';
    END IF;
    
    -- Si la fecha de fin llegó
    IF NEW.end_date <= now() AND NEW.campaign_status != 'finished' THEN
      NEW.campaign_status = 'finished';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_campaign_status
  BEFORE UPDATE ON projects.project
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_status();

-- ========================================
-- RESUMEN DE TRIGGERS
-- ========================================
/*
TRIGGERS ACTIVOS:

1. set_timestamp_users_user
   - Tabla: users.user
   - Evento: BEFORE UPDATE
   - Función: trigger_set_timestamp()
   - Propósito: Actualizar updated_at automáticamente

2. set_timestamp_projects_project
   - Tabla: projects.project
   - Evento: BEFORE UPDATE
   - Función: trigger_set_timestamp()
   - Propósito: Actualizar updated_at automáticamente

3. set_timestamp_payment_transaction
   - Tabla: payments.payment_transaction
   - Evento: BEFORE UPDATE
   - Función: trigger_set_timestamp()
   - Propósito: Actualizar updated_at automáticamente

4. update_raised_amount_on_donation
   - Tabla: payments.donation
   - Evento: AFTER INSERT OR UPDATE
   - Función: update_project_raised_amount()
   - Propósito: Actualizar raised_amount cuando se completa/reembolsa donación

5. log_user_status
   - Tabla: users.user
   - Evento: AFTER UPDATE
   - Función: log_user_status_change()
   - Propósito: Registrar cambios de estado en user_status_history

6. log_project_status
   - Tabla: projects.project
   - Evento: AFTER UPDATE
   - Función: log_project_status_change()
   - Propósito: Registrar cambios de approval_status y campaign_status

7. auto_update_campaign_status
   - Tabla: projects.project
   - Evento: BEFORE UPDATE
   - Función: update_campaign_status()
   - Propósito: Cambiar campaign_status basado en fechas automáticamente

TOTAL: 7 triggers + 4 funciones trigger

========================================
COMANDOS ÚTILES PARA GESTIÓN DE TRIGGERS
========================================

-- Listar todos los triggers
SELECT 
  trigger_name, 
  event_object_schema, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY event_object_schema, event_object_table;

-- Deshabilitar un trigger
ALTER TABLE users.user DISABLE TRIGGER set_timestamp_users_user;

-- Habilitar un trigger
ALTER TABLE users.user ENABLE TRIGGER set_timestamp_users_user;

-- Eliminar un trigger
DROP TRIGGER IF EXISTS set_timestamp_users_user ON users.user;

-- Ver definición de un trigger
\d+ users.user

========================================
*/
