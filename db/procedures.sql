-- ========================================
-- PROCEDIMIENTOS Y FUNCIONES ALMACENADAS V2
-- Aporta Ya - Crowdfunding Platform
-- Versión: 2.0.0
-- Fecha: 24 de octubre de 2025
-- ========================================
-- Este archivo consolida y actualiza todas las funciones
-- Compatible con los nuevos estados: approval_status y campaign_status
-- Organizado por ESQUEMAS para mejor navegabilidad
-- ========================================

-- ========================================
-- EXTENSIONES NECESARIAS
-- ========================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- Para bcrypt (password hashing)

-- ========================================
-- TABLA DE CONTENIDOS
-- ========================================
/*
1. FUNCIONES GLOBALES (Sin esquema específico)
   - Utilidades generales

2. ESQUEMA: users
   - Registro y autenticación
   - Gestión de usuarios
   - Verificación de email

3. ESQUEMA: roles
   - Gestión de roles y permisos
   - RBAC completo

4. ESQUEMA: projects
   - Gestión de categorías
   - Gestión de proyectos
   - Gestión de campañas
   - Búsqueda y filtrado
   - Vistas de proyectos

5. ESQUEMA: payments
   - Gestión de donaciones
   - Transacciones
   - Vistas de pagos

6. ESQUEMA: social
   - Comentarios
   - Favoritos

7. ESQUEMA: audit
   - (Funciones de auditoría - pendiente)

8. FUNCIONES DE MANTENIMIENTO
   - Limpieza y cron jobs
*/

-- ========================================
-- 1. FUNCIONES GLOBALES (UTILIDAD)
-- ========================================

-- Generar slug único desde un título
CREATE OR REPLACE FUNCTION generate_unique_slug(title TEXT, table_name TEXT DEFAULT 'projects.project')
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
  exists_flag BOOLEAN;
BEGIN
  -- Convertir título a slug base
  base_slug := lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  final_slug := base_slug;
  
  -- Verificar si existe y agregar contador si es necesario
  LOOP
    IF table_name = 'projects.project' THEN
      SELECT EXISTS(SELECT 1 FROM projects.project WHERE slug = final_slug) INTO exists_flag;
    ELSIF table_name = 'projects.category' THEN
      SELECT EXISTS(SELECT 1 FROM projects.category WHERE slug = final_slug) INTO exists_flag;
    END IF;
    
    EXIT WHEN NOT exists_flag;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Validar si un usuario puede donar
CREATE OR REPLACE FUNCTION can_user_donate(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status VARCHAR(50);
  project_approval VARCHAR(20);
  project_campaign VARCHAR(20);
  project_end_date TIMESTAMPTZ;
BEGIN
  -- Verificar estado del usuario
  SELECT status INTO user_status FROM users.user WHERE id = p_user_id;
  IF user_status NOT IN ('active') THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar estado del proyecto
  SELECT approval_status, campaign_status, end_date
  INTO project_approval, project_campaign, project_end_date
  FROM projects.project 
  WHERE id = p_project_id;
  
  -- El proyecto debe estar publicado, en progreso y no vencido
  IF project_approval = 'published' 
     AND project_campaign = 'in_progress' 
     AND project_end_date > now() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Calcular porcentaje de financiación
CREATE OR REPLACE FUNCTION calculate_funding_percentage(p_project_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  goal NUMERIC;
  raised NUMERIC;
BEGIN
  SELECT financial_goal, raised_amount INTO goal, raised
  FROM projects.project
  WHERE id = p_project_id;
  
  IF goal IS NULL OR goal = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((raised / goal) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Obtener total de donadores únicos de un proyecto
CREATE OR REPLACE FUNCTION get_unique_donors_count(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM payments.donation
    WHERE project_id = p_project_id
      AND payment_status = 'completed'
      AND is_anonymous = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. ESQUEMA: users
-- ========================================
-- Funciones para gestión de usuarios, autenticación y permisos
-- ========================================

-- Registrar Usuario + Asignar Rol
CREATE OR REPLACE FUNCTION users.register_user(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_gender VARCHAR DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL,
    p_profile_image_url VARCHAR DEFAULT NULL,
    p_role_id INT DEFAULT 8  -- ID del rol "User" por defecto
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
BEGIN
    -- Insertar usuario con password hasheado
    INSERT INTO users.user (
        id, first_name, last_name, email, password_hash, 
        gender, birth_date, profile_image_url,
        status, registration_date, updated_at
    )
    VALUES (
        v_user_id,
        p_first_name,
        p_last_name,
        p_email,
        crypt(p_password, gen_salt('bf')),  -- Hash bcrypt
        p_gender,
        p_birth_date,
        p_profile_image_url,
        'pending_verification',
        now(),
        now()
    );

    -- Asignar rol al usuario
    INSERT INTO roles.user_role (user_id, role_id)
    VALUES (v_user_id, p_role_id);
    
    -- Crear token de verificación de email
    INSERT INTO users.email_verification_token (user_id)
    VALUES (v_user_id);

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Iniciar Sesión
CREATE OR REPLACE FUNCTION users.login_user(
    p_email VARCHAR,
    p_password VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id
    INTO v_user_id
    FROM users.user
    WHERE email = p_email
      AND password_hash = crypt(p_password, password_hash)
      AND status IN ('active', 'pending_verification')
      AND deleted_at IS NULL;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Verificar email de usuario
CREATE OR REPLACE FUNCTION verify_user_email(p_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_used_at TIMESTAMPTZ;
BEGIN
  -- Verificar si el token existe y es válido
  SELECT user_id, expires_at, used_at 
  INTO v_user_id, v_expires_at, v_used_at
  FROM users.email_verification_token
  WHERE token = p_token;
  
  -- Si no existe el token
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Si ya fue usado
  IF v_used_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Si expiró
  IF v_expires_at < now() THEN
    RETURN FALSE;
  END IF;
  
  -- Marcar token como usado
  UPDATE users.email_verification_token
  SET used_at = now()
  WHERE token = p_token;
  
  -- Activar usuario
  UPDATE users.user
  SET status = 'active'
  WHERE id = v_user_id AND status = 'pending_verification';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Cambiar contraseña
CREATE OR REPLACE FUNCTION users.change_password(
    p_user_id UUID,
    p_old_password VARCHAR,
    p_new_password VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_valid BOOLEAN;
BEGIN
    SELECT password_hash = crypt(p_old_password, password_hash)
    INTO v_valid
    FROM users.user
    WHERE id = p_user_id;

    IF NOT v_valid THEN
        RAISE EXCEPTION 'Current password is incorrect';
    END IF;

    UPDATE users.user
    SET password_hash = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Suspender usuario
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users.user
  SET status = 'suspended'
  WHERE id = p_user_id AND status IN ('active');
  
  IF FOUND THEN
    UPDATE users.user_status_history
    SET changed_by = p_admin_id, reason = p_reason
    WHERE user_id = p_user_id
      AND new_status = 'suspended'
      AND change_date >= now() - INTERVAL '1 second';
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. ESQUEMA: roles
-- ========================================
-- Sistema completo RBAC (Role-Based Access Control)
-- ========================================

-- Crear categoría de rol
CREATE OR REPLACE FUNCTION roles.create_role_category(
    p_name VARCHAR,
    p_description TEXT
)
RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO roles.role_category(name, description)
    VALUES (p_name, p_description)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Crear módulo
CREATE OR REPLACE FUNCTION roles.create_module(
    p_name VARCHAR,
    p_category_id INT
)
RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO roles.module(name, category_id)
    VALUES (p_name, p_category_id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Crear permiso (ability)
CREATE OR REPLACE FUNCTION roles.create_ability(
    p_name VARCHAR,
    p_label VARCHAR,
    p_module_id INT
)
RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO roles.ability(name, label, module_id)
    VALUES (p_name, p_label, p_module_id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Crear rol
CREATE OR REPLACE FUNCTION roles.create_role(
    p_name VARCHAR
)
RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO roles.role(name)
    VALUES (p_name)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Asignar permisos a un rol
CREATE OR REPLACE FUNCTION roles.assign_ability_to_role(
    p_role_id INT,
    p_ability_id INT,
    p_granted BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO roles.role_ability(role_id, ability_id, granted)
    VALUES (p_role_id, p_ability_id, p_granted)
    ON CONFLICT (role_id, ability_id) DO UPDATE SET granted = EXCLUDED.granted;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Asignar rol a usuario
CREATE OR REPLACE FUNCTION roles.assign_role_to_user(
    p_user_id UUID,
    p_role_id INT
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO roles.user_role(user_id, role_id)
    VALUES (p_user_id, p_role_id)
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Eliminar rol de usuario
CREATE OR REPLACE FUNCTION roles.remove_role_from_user(
    p_user_id UUID,
    p_role_id INT
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM roles.user_role
    WHERE user_id = p_user_id AND role_id = p_role_id;
END;
$$ LANGUAGE plpgsql;

-- Validar permisos de usuario
CREATE OR REPLACE FUNCTION roles.check_user_permission(
    p_user_id UUID,
    p_module_name VARCHAR,
    p_ability_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM roles.user_role ur
        JOIN roles.role_ability ra ON ra.role_id = ur.role_id
        JOIN roles.ability a ON a.id = ra.ability_id
        JOIN roles.module m ON m.id = a.module_id
        WHERE ur.user_id = p_user_id
          AND m.name = p_module_name
          AND a.name = p_ability_name
          AND ra.granted = TRUE
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. ESQUEMA: projects
-- ========================================
-- Gestión completa de proyectos, categorías y campañas
-- ========================================

-- ----------------------------------------
-- 4.1 GESTIÓN DE CATEGORÍAS
-- ----------------------------------------

-- Crear categoría de proyecto
CREATE OR REPLACE FUNCTION projects.create_category(
    p_name VARCHAR,
    p_slug VARCHAR,
    p_description VARCHAR,
    p_parent_id INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_category_id INT;
BEGIN
    INSERT INTO projects.category(name, slug, description, parent_id)
    VALUES (p_name, p_slug, p_description, p_parent_id)
    RETURNING id INTO v_category_id;
    RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- Verificar requisitos de categoría
CREATE OR REPLACE FUNCTION projects.check_category_requirements(
    p_project_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_category_id INT;
    v_has_requirements BOOLEAN;
BEGIN
    SELECT category_id INTO v_category_id
    FROM projects.project
    WHERE id = p_project_id;

    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Proyecto no encontrado';
    END IF;

    -- Verificar si la categoría tiene requisitos
    SELECT EXISTS (
        SELECT 1 FROM projects.category_requirements
        WHERE category_id = v_category_id
    ) INTO v_has_requirements;

    -- Si no hay requisitos, está OK
    -- TODO: Implementar validación específica por requisito
    IF v_has_requirements THEN
        RETURN FALSE;  -- Por ahora retorna FALSE si hay requisitos
    ELSE
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- 4.2 GESTIÓN DE PROYECTOS
-- ----------------------------------------

-- Crear proyecto
CREATE OR REPLACE FUNCTION projects.create_project(
    p_creator_id UUID,
    p_title VARCHAR(255),
    p_description TEXT,
    p_financial_goal NUMERIC(15,2),
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_category_id INT,
    p_location VARCHAR(255) DEFAULT NULL,
    p_cover_image_url VARCHAR(500) DEFAULT NULL,
    p_video_url VARCHAR(500) DEFAULT NULL,
    p_currency VARCHAR(10) DEFAULT 'USD'
)
RETURNS UUID AS $$
DECLARE
    v_project_id UUID := gen_random_uuid();
    v_slug VARCHAR(255);
BEGIN
    -- Generar slug único
    v_slug := generate_unique_slug(p_title, 'projects.project');
    
    INSERT INTO projects.project (
        id, creator_id, title, slug, description, financial_goal, raised_amount,
        start_date, end_date, approval_status, campaign_status, category_id,
        location, video_url, currency
    )
    VALUES (
        v_project_id, p_creator_id, p_title, v_slug, p_description, p_financial_goal, 0,
        p_start_date, p_end_date, 'draft', 'not_started', p_category_id,
        p_location, p_video_url, p_currency
    );

    -- Si se proporcionó imagen de portada, insertarla en project_image
    IF p_cover_image_url IS NOT NULL THEN
        INSERT INTO projects.project_image (
            project_id, image_url, alt_text, display_order, is_cover
        )
        VALUES (
            v_project_id, p_cover_image_url, p_title, 0, TRUE
        );
    END IF;

    RETURN v_project_id;
END;
$$ LANGUAGE plpgsql;

-- Agregar imagen a proyecto
CREATE OR REPLACE FUNCTION projects.add_project_image(
    p_project_id UUID,
    p_image_url VARCHAR(500),
    p_alt_text VARCHAR(255) DEFAULT NULL,
    p_is_cover BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_image_id UUID;
    v_max_order INT;
BEGIN
    -- Si se marca como portada, quitar la marca de las demás
    IF p_is_cover THEN
        UPDATE projects.project_image
        SET is_cover = FALSE
        WHERE project_id = p_project_id;
    END IF;
    
    -- Obtener el siguiente orden de visualización
    SELECT COALESCE(MAX(display_order), -1) + 1
    INTO v_max_order
    FROM projects.project_image
    WHERE project_id = p_project_id;
    
    -- Insertar la nueva imagen
    INSERT INTO projects.project_image (
        project_id, image_url, alt_text, display_order, is_cover
    )
    VALUES (
        p_project_id, p_image_url, p_alt_text, v_max_order, p_is_cover
    )
    RETURNING id INTO v_image_id;
    
    RETURN v_image_id;
END;
$$ LANGUAGE plpgsql;

-- Agregar múltiples imágenes a un proyecto
CREATE OR REPLACE FUNCTION projects.add_project_images(
    p_project_id UUID,
    p_image_urls TEXT[],
    p_cover_index INT DEFAULT 0  -- Índice de la imagen que será portada (0-based)
)
RETURNS INT AS $$
DECLARE
    v_image_url TEXT;
    v_index INT := 0;
    v_is_cover BOOLEAN;
    v_count INT := 0;
BEGIN
    -- Iterar sobre las URLs de imágenes
    FOREACH v_image_url IN ARRAY p_image_urls
    LOOP
        v_is_cover := (v_index = p_cover_index);
        
        PERFORM projects.add_project_image(
            p_project_id,
            v_image_url,
            NULL,  -- alt_text
            v_is_cover
        );
        
        v_index := v_index + 1;
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Eliminar imagen de proyecto
CREATE OR REPLACE FUNCTION projects.remove_project_image(
    p_image_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM projects.project_image
    WHERE id = p_image_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Reordenar imágenes de proyecto
CREATE OR REPLACE FUNCTION projects.reorder_project_images(
    p_project_id UUID,
    p_image_ids UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
    v_image_id UUID;
    v_order INT := 0;
BEGIN
    -- Actualizar el orden según el array proporcionado
    FOREACH v_image_id IN ARRAY p_image_ids
    LOOP
        UPDATE projects.project_image
        SET display_order = v_order
        WHERE id = v_image_id AND project_id = p_project_id;
        
        v_order := v_order + 1;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Cambiar imagen de portada
CREATE OR REPLACE FUNCTION projects.set_cover_image(
    p_project_id UUID,
    p_image_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Quitar marca de portada a todas las imágenes del proyecto
    UPDATE projects.project_image
    SET is_cover = FALSE
    WHERE project_id = p_project_id;
    
    -- Marcar la nueva imagen como portada
    UPDATE projects.project_image
    SET is_cover = TRUE
    WHERE id = p_image_id AND project_id = p_project_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Obtener todas las imágenes de un proyecto
CREATE OR REPLACE FUNCTION projects.get_project_images(
    p_project_id UUID
)
RETURNS TABLE (
    image_id UUID,
    image_url VARCHAR(500),
    alt_text VARCHAR(255),
    display_order INT,
    is_cover BOOLEAN,
    uploaded_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, image_url, alt_text, display_order, is_cover, uploaded_at
    FROM projects.project_image
    WHERE project_id = p_project_id
    ORDER BY display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Enviar proyecto a revisión
CREATE OR REPLACE FUNCTION submit_project_for_review(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_status VARCHAR(20);
BEGIN
  SELECT approval_status INTO current_status
  FROM projects.project
  WHERE id = p_project_id;
  
  IF current_status IN ('draft', 'observed') THEN
    UPDATE projects.project
    SET approval_status = 'in_review'
    WHERE id = p_project_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Aprobar/Publicar proyecto
CREATE OR REPLACE FUNCTION approve_project(
  p_project_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar requisitos de categoría
  IF NOT projects.check_category_requirements(p_project_id) THEN
    RAISE EXCEPTION 'El proyecto no cumple con los requisitos de la categoría';
  END IF;

  UPDATE projects.project
  SET approval_status = 'published'
  WHERE id = p_project_id AND approval_status = 'in_review';
  
  IF FOUND THEN
    INSERT INTO projects.project_approval_history (
      id, project_id, approved_by, status, approval_date
    ) VALUES (
      gen_random_uuid(), p_project_id, p_admin_id, 'approved', now()
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Observar proyecto (pedir correcciones)
CREATE OR REPLACE FUNCTION observe_project(
  p_project_id UUID,
  p_admin_id UUID,
  p_note TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE projects.project
  SET approval_status = 'observed'
  WHERE id = p_project_id AND approval_status = 'in_review';
  
  IF FOUND THEN
    INSERT INTO projects.project_observation (
      project_id, admin_id, note
    ) VALUES (
      p_project_id, p_admin_id, p_note
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Rechazar proyecto
CREATE OR REPLACE FUNCTION reject_project(
  p_project_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE projects.project
  SET approval_status = 'rejected'
  WHERE id = p_project_id AND approval_status = 'in_review';
  
  IF FOUND THEN
    INSERT INTO projects.project_approval_history (
      id, project_id, approved_by, status, rejection_reason, approval_date
    ) VALUES (
      gen_random_uuid(), p_project_id, p_admin_id, 'rejected', p_reason, now()
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Obtener estado de aprobación del proyecto
CREATE OR REPLACE FUNCTION projects.get_project_approval_status(
    p_project_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT approval_status INTO v_status
    FROM projects.project
    WHERE id = p_project_id;
    RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- Obtener estado de campaña del proyecto
CREATE OR REPLACE FUNCTION projects.get_project_campaign_status(
    p_project_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT campaign_status INTO v_status
    FROM projects.project
    WHERE id = p_project_id;
    RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- Obtener proyectos por estado de aprobación
CREATE OR REPLACE FUNCTION projects.get_projects_by_approval_status(
    p_approval_status VARCHAR
)
RETURNS TABLE (
    project_id UUID,
    title VARCHAR,
    description TEXT,
    approval_status VARCHAR,
    campaign_status VARCHAR,
    creator_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, title, description, approval_status, campaign_status, creator_id
    FROM projects.project
    WHERE approval_status = p_approval_status;
END;
$$ LANGUAGE plpgsql;

-- Obtener proyectos por usuario
CREATE OR REPLACE FUNCTION projects.get_projects_by_user(
    p_user_id UUID
)
RETURNS TABLE (
    project_id UUID,
    title VARCHAR,
    description TEXT,
    approval_status VARCHAR,
    campaign_status VARCHAR,
    category_id INT,
    raised_amount NUMERIC,
    financial_goal NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, title, description, approval_status, campaign_status, 
           category_id, raised_amount, financial_goal
    FROM projects.project
    WHERE creator_id = p_user_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Obtener historial de estados del proyecto
CREATE OR REPLACE FUNCTION projects.get_project_status_history(
    p_project_id UUID
)
RETURNS TABLE (
    old_status VARCHAR,
    new_status VARCHAR,
    changed_by UUID,
    reason TEXT,
    change_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT old_status, new_status, changed_by, reason, change_date
    FROM projects.project_status_history
    WHERE project_id = p_project_id
    ORDER BY change_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- 4.3 GESTIÓN DE CAMPAÑAS
-- ----------------------------------------

-- Iniciar campaña
CREATE OR REPLACE FUNCTION projects.start_campaign(
    p_project_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE projects.project
    SET campaign_status = 'in_progress'
    WHERE id = p_project_id 
      AND approval_status = 'published'
      AND campaign_status = 'not_started'
      AND start_date <= now()
      AND end_date > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La campaña no se puede iniciar: verifica que esté publicada, no iniciada y dentro de fechas';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Pausar campaña
CREATE OR REPLACE FUNCTION pause_campaign(
  p_project_id UUID,
  p_user_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  project_creator UUID;
BEGIN
  SELECT creator_id INTO project_creator
  FROM projects.project
  WHERE id = p_project_id;
  
  -- Solo el creador puede pausar
  IF project_creator = p_user_id THEN
    UPDATE projects.project
    SET campaign_status = 'paused'
    WHERE id = p_project_id AND campaign_status = 'in_progress';
    
    IF FOUND THEN
      UPDATE projects.project_status_history
      SET changed_by = p_user_id, reason = p_reason
      WHERE project_id = p_project_id
        AND new_status = 'paused'
        AND change_date >= now() - INTERVAL '1 second';
      
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Reanudar campaña
CREATE OR REPLACE FUNCTION projects.resume_campaign(
    p_project_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE projects.project
    SET campaign_status = 'in_progress'
    WHERE id = p_project_id 
      AND campaign_status = 'paused'
      AND end_date > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La campaña no se puede reanudar: no está pausada o ya venció';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Finalizar campaña
CREATE OR REPLACE FUNCTION projects.end_campaign(
    p_project_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE projects.project
    SET campaign_status = 'finished'
    WHERE id = p_project_id AND campaign_status = 'in_progress';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La campaña no se puede finalizar: no está en progreso';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Finalizar si se alcanza la meta
CREATE OR REPLACE FUNCTION projects.finish_if_goal_reached(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_goal NUMERIC;
  v_raised NUMERIC;
  v_campaign_status VARCHAR;
BEGIN
  SELECT financial_goal, raised_amount, campaign_status
  INTO v_goal, v_raised, v_campaign_status
  FROM projects.project
  WHERE id = p_project_id;

  -- Si alcanzó la meta y está en progreso, finalizar
  IF v_raised >= v_goal AND v_campaign_status = 'in_progress' THEN
    UPDATE projects.project
    SET campaign_status = 'finished'
    WHERE id = p_project_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Auto-cerrar campañas vencidas (para cron job)
CREATE OR REPLACE FUNCTION projects.auto_close_campaigns_by_deadline()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE projects.project
  SET campaign_status = 'finished'
  WHERE campaign_status = 'in_progress'
    AND end_date <= now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- 4.4 BÚSQUEDA Y FILTRADO DE PROYECTOS
-- ----------------------------------------

-- Buscar proyectos activos con filtros
CREATE OR REPLACE FUNCTION search_active_projects(
  p_search_term TEXT DEFAULT NULL,
  p_category_id INT DEFAULT NULL,
  p_min_progress NUMERIC DEFAULT NULL,
  p_max_progress NUMERIC DEFAULT NULL,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  slug VARCHAR(255),
  summary VARCHAR(500),
  financial_goal NUMERIC,
  raised_amount NUMERIC,
  funding_percentage NUMERIC,
  creator_name TEXT,
  category_name VARCHAR(100),
  end_date TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.summary,
    p.financial_goal,
    p.raised_amount,
    calculate_funding_percentage(p.id) as funding_percentage,
    CONCAT(u.first_name, ' ', u.last_name) as creator_name,
    c.name as category_name,
    p.end_date,
    GREATEST(0, EXTRACT(DAY FROM (p.end_date - now()))::INTEGER) as days_remaining
  FROM projects.project p
  INNER JOIN users.user u ON u.id = p.creator_id
  LEFT JOIN projects.category c ON c.id = p.category_id
  WHERE p.approval_status = 'published'
    AND p.campaign_status = 'in_progress'
    AND (p_search_term IS NULL OR 
         p.title ILIKE '%' || p_search_term || '%' OR 
         p.description ILIKE '%' || p_search_term || '%')
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_min_progress IS NULL OR calculate_funding_percentage(p.id) >= p_min_progress)
    AND (p_max_progress IS NULL OR calculate_funding_percentage(p.id) <= p_max_progress)
  ORDER BY p.created_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- 4.5 VISTAS DE PROYECTOS
-- ----------------------------------------

-- Vista de proyectos activos
CREATE OR REPLACE VIEW projects.active_projects AS
SELECT
  p.id,
  p.creator_id,
  p.title,
  p.slug,
  p.summary,
  p.description,
  p.financial_goal,
  p.raised_amount,
  calculate_funding_percentage(p.id) as funding_percentage,
  p.start_date,
  p.end_date,
  GREATEST(0, EXTRACT(DAY FROM (p.end_date - now()))::INTEGER) as days_remaining,
  p.category_id,
  (
    SELECT image_url 
    FROM projects.project_image 
    WHERE project_id = p.id AND is_cover = TRUE 
    LIMIT 1
  ) as cover_image,
  p.created_at,
  CONCAT(u.first_name, ' ', u.last_name) as creator_name,
  u.profile_image_url as creator_image,
  c.name as category_name,
  get_unique_donors_count(p.id) as unique_donors
FROM projects.project p
INNER JOIN users.user u ON u.id = p.creator_id
LEFT JOIN projects.category c ON c.id = p.category_id
WHERE p.approval_status = 'published'
  AND p.campaign_status = 'in_progress';

-- Vista del feed público de proyectos
CREATE OR REPLACE VIEW projects.v_project_feed AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.summary,
  p.description,
  p.financial_goal,
  p.raised_amount,
  calculate_funding_percentage(p.id) as funding_percentage,
  p.start_date,
  p.end_date,
  GREATEST(0, EXTRACT(DAY FROM (p.end_date - now()))::INTEGER) as days_remaining,
  (
    SELECT image_url 
    FROM projects.project_image 
    WHERE project_id = p.id AND is_cover = TRUE 
    LIMIT 1
  ) as cover_image,
  p.video_url,
  CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
  u.profile_image_url as creator_image,
  c.name AS category_name
FROM projects.project p
JOIN users.user u ON u.id = p.creator_id
LEFT JOIN projects.category c ON c.id = p.category_id
WHERE p.approval_status = 'published';

-- Vista de top backers (donadores destacados)
CREATE OR REPLACE VIEW projects.v_top_backers AS
SELECT
  d.project_id,
  d.user_id,
  CONCAT(u.first_name, ' ', u.last_name) AS user_name,
  SUM(d.amount) AS total_donated,
  RANK() OVER (PARTITION BY d.project_id ORDER BY SUM(d.amount) DESC) AS rnk
FROM payments.donation d
JOIN users.user u ON u.id = d.user_id
WHERE d.payment_status = 'completed'
  AND d.is_anonymous = FALSE
GROUP BY d.project_id, d.user_id, user_name;

-- ========================================
-- 5. ESQUEMA: payments
-- ========================================
-- Gestión de donaciones, transacciones y pagos
-- ========================================

-- ----------------------------------------
-- 5.1 GESTIÓN DE DONACIONES
-- ----------------------------------------

-- Crear donación con validaciones
CREATE OR REPLACE FUNCTION create_donation(
  p_project_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_payment_method VARCHAR(50),
  p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  donation_id UUID;
BEGIN
  -- Validar que el usuario puede donar
  IF NOT can_user_donate(p_user_id, p_project_id) THEN
    RAISE EXCEPTION 'User cannot donate to this project';
  END IF;
  
  -- Validar monto
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  -- Crear donación
  INSERT INTO payments.donation (
    project_id, user_id, amount, payment_method, is_anonymous
  ) VALUES (
    p_project_id, p_user_id, p_amount, p_payment_method, p_is_anonymous
  ) RETURNING id INTO donation_id;
  
  RETURN donation_id;
END;
$$ LANGUAGE plpgsql;

-- Completar donación
CREATE OR REPLACE FUNCTION complete_donation(
  p_donation_id UUID,
  p_external_reference VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments.donation
  SET 
    payment_status = 'completed',
    payment_reference = p_external_reference
  WHERE id = p_donation_id AND payment_status IN ('pending', 'processing');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Actualizar estado de donación
CREATE OR REPLACE FUNCTION payments.update_donation_status(
    p_donation_id UUID,
    p_new_status VARCHAR,
    p_admin_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Validar estado permitido
    IF p_new_status NOT IN ('pending','processing','completed','failed','refunded') THEN
        RAISE EXCEPTION 'Invalid donation status: %', p_new_status;
    END IF;

    UPDATE payments.donation
    SET payment_status = p_new_status
    WHERE id = p_donation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Donation not found: %', p_donation_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Reembolsar donación
CREATE OR REPLACE FUNCTION refund_donation(p_donation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments.donation
  SET payment_status = 'refunded'
  WHERE id = p_donation_id AND payment_status = 'completed';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Obtener donaciones por proyecto
CREATE OR REPLACE FUNCTION payments.get_donations_by_project(
    p_project_id UUID
)
RETURNS TABLE (
    donation_id UUID,
    user_id UUID,
    amount NUMERIC,
    donation_date TIMESTAMPTZ,
    payment_method VARCHAR,
    payment_status VARCHAR,
    is_anonymous BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, user_id, amount, donation_date, payment_method, payment_status, is_anonymous
    FROM payments.donation
    WHERE project_id = p_project_id
    ORDER BY donation_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Obtener donaciones por usuario
CREATE OR REPLACE FUNCTION payments.get_donations_by_user(
    p_user_id UUID
)
RETURNS TABLE (
    donation_id UUID,
    project_id UUID,
    amount NUMERIC,
    donation_date TIMESTAMPTZ,
    payment_method VARCHAR,
    payment_status VARCHAR,
    is_anonymous BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, project_id, amount, donation_date, payment_method, payment_status, is_anonymous
    FROM payments.donation
    WHERE user_id = p_user_id
    ORDER BY donation_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- 5.2 FUNCIONES DE ESTADÍSTICAS DE PAGOS
-- ----------------------------------------

-- Obtener estadísticas completas de un proyecto
CREATE OR REPLACE FUNCTION get_project_stats(p_project_id UUID)
RETURNS TABLE (
  total_donations BIGINT,
  unique_donors INTEGER,
  raised_amount NUMERIC,
  funding_percentage NUMERIC,
  days_remaining INTEGER,
  total_comments BIGINT,
  total_updates BIGINT,
  total_favorites BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM payments.donation WHERE project_id = p_project_id AND payment_status = 'completed'),
    (SELECT get_unique_donors_count(p_project_id)),
    (SELECT p.raised_amount FROM projects.project p WHERE p.id = p_project_id),
    (SELECT calculate_funding_percentage(p_project_id)),
    (SELECT GREATEST(0, EXTRACT(DAY FROM (p.end_date - now()))::INTEGER) FROM projects.project p WHERE p.id = p_project_id),
    (SELECT COUNT(*) FROM social.comment WHERE project_id = p_project_id AND status = 'active'),
    (SELECT COUNT(*) FROM social.update WHERE project_id = p_project_id),
    (SELECT COUNT(*) FROM social.favorite WHERE project_id = p_project_id);
END;
$$ LANGUAGE plpgsql;

-- Top donadores de un proyecto
CREATE OR REPLACE FUNCTION get_top_donors(p_project_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  total_donated NUMERIC,
  donation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.user_id,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    SUM(d.amount) as total_donated,
    COUNT(*) as donation_count
  FROM payments.donation d
  INNER JOIN users.user u ON u.id = d.user_id
  WHERE d.project_id = p_project_id
    AND d.payment_status = 'completed'
    AND d.is_anonymous = FALSE
  GROUP BY d.user_id, u.first_name, u.last_name
  ORDER BY total_donated DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Proyectos trending (más donaciones recientes)
CREATE OR REPLACE FUNCTION get_trending_projects(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  project_id UUID,
  project_title VARCHAR(255),
  recent_donations BIGINT,
  recent_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    COUNT(d.id) as recent_donations,
    COALESCE(SUM(d.amount), 0) as recent_amount
  FROM projects.project p
  LEFT JOIN payments.donation d ON d.project_id = p.id 
    AND d.payment_status = 'completed'
    AND d.donation_date >= now() - INTERVAL '7 days'
  WHERE p.approval_status = 'published'
    AND p.campaign_status = 'in_progress'
  GROUP BY p.id, p.title
  ORDER BY recent_donations DESC, recent_amount DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- 5.3 VISTAS DE PAGOS
-- ----------------------------------------

-- Vista de donaciones completadas
CREATE OR REPLACE VIEW payments.completed_donations AS
SELECT
  d.id,
  d.amount,
  d.donation_date,
  d.payment_method,
  d.is_anonymous,
  d.user_id,
  CASE 
    WHEN d.is_anonymous THEN 'Anónimo'
    ELSE CONCAT(u.first_name, ' ', u.last_name)
  END as donor_name,
  d.project_id,
  p.title as project_title,
  p.creator_id as project_creator_id
FROM payments.donation d
INNER JOIN users.user u ON u.id = d.user_id
INNER JOIN projects.project p ON p.id = d.project_id
WHERE d.payment_status = 'completed';

-- ========================================
-- 6. ESQUEMA: social
-- ========================================
-- Funciones para comentarios, favoritos y reportes
-- ========================================

-- Obtener comentarios de un proyecto
CREATE OR REPLACE FUNCTION social.get_comments_by_project(
    p_project_id UUID
)
RETURNS TABLE (
    comment_id UUID,
    user_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, user_id, content, created_at, status
    FROM social.comment
    WHERE project_id = p_project_id
    ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Obtener favoritos de un usuario
CREATE OR REPLACE FUNCTION social.get_favorites_by_user(
    p_user_id UUID
)
RETURNS TABLE (
    favorite_id UUID,
    project_id UUID,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, project_id, created_at
    FROM social.favorite
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. ESQUEMA: audit
-- ========================================
-- Funciones de auditoría (pendiente de implementación)
-- ========================================

-- TODO: Agregar funciones de auditoría aquí
-- Ejemplos:
-- - log_action()
-- - get_audit_trail()
-- - cleanup_old_audit_logs()

-- ========================================
-- 8. FUNCIONES DE MANTENIMIENTO Y CRON JOBS
-- ========================================
-- Funciones para ejecutar periódicamente
-- ========================================

-- Limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar tokens de email expirados y usados hace más de 30 días
  DELETE FROM users.email_verification_token
  WHERE (expires_at < now() - INTERVAL '30 days')
     OR (used_at IS NOT NULL AND used_at < now() - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Eliminar tokens de reset de password expirados
  DELETE FROM users.password_reset_token
  WHERE expires_at < now() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Actualizar estados de campañas (ejecutar en cron)
CREATE OR REPLACE FUNCTION update_campaign_statuses()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
  rows_affected INTEGER;
BEGIN
  -- Iniciar campañas que llegaron a su fecha de inicio
  UPDATE projects.project
  SET campaign_status = 'in_progress'
  WHERE approval_status = 'published'
    AND campaign_status = 'not_started'
    AND start_date <= now()
    AND end_date > now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Finalizar campañas que llegaron a su fecha de fin
  UPDATE projects.project
  SET campaign_status = 'finished'
  WHERE campaign_status = 'in_progress'
    AND end_date <= now();
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  updated_count := updated_count + rows_affected;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. ÍNDICES ADICIONALES
-- ========================================

-- Índice único para referencias externas de transacciones
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_tx_extref
ON payments.payment_transaction(external_reference);

-- ========================================
-- 10. GUÍA DE USO Y EJEMPLOS
-- ========================================

/*
=======================================
EJEMPLOS DE USO - PROCEDURES V2
Organizado por ESQUEMAS
=======================================

-- ========================================
-- ESQUEMA: users
-- ========================================
SELECT users.register_user('John', 'Doe', 'john@example.com', 'password123');
SELECT users.login_user('john@example.com', 'password123');
SELECT verify_user_email('token-uuid');
SELECT users.change_password('user-uuid', 'old_pass', 'new_pass');
SELECT suspend_user('user-uuid', 'admin-uuid', 'Violación de términos');

-- ========================================
-- ESQUEMA: roles
-- ========================================
SELECT roles.create_role('Admin');
SELECT roles.assign_role_to_user('user-uuid', 1);
SELECT roles.check_user_permission('user-uuid', 'projects', 'approve');
SELECT roles.remove_role_from_user('user-uuid', 1);

-- ========================================
-- ESQUEMA: projects
-- ========================================

-- Categorías
SELECT projects.create_category('Tecnología', 'tecnologia', 'Proyectos tech', NULL);

-- Proyectos
SELECT projects.create_project('user-uuid', 'Mi Proyecto', 'Descripción...', 10000.00, now(), now() + INTERVAL '30 days', 1);
SELECT submit_project_for_review('project-uuid');
SELECT approve_project('project-uuid', 'admin-uuid');
SELECT observe_project('project-uuid', 'admin-uuid', 'Falta documentación');
SELECT reject_project('project-uuid', 'admin-uuid', 'No cumple requisitos');
SELECT projects.get_projects_by_user('user-uuid');
SELECT projects.get_project_status_history('project-uuid');

-- Campañas
SELECT projects.start_campaign('project-uuid');
SELECT pause_campaign('project-uuid', 'user-uuid', 'Problemas técnicos');
SELECT projects.resume_campaign('project-uuid');
SELECT projects.end_campaign('project-uuid');
SELECT projects.finish_if_goal_reached('project-uuid');

-- Búsqueda y consultas
SELECT * FROM search_active_projects('educación', NULL, NULL, NULL, 0, 10);
SELECT * FROM projects.active_projects LIMIT 10;
SELECT * FROM projects.v_project_feed WHERE category_name = 'Tecnología';
SELECT * FROM projects.v_top_backers WHERE rnk <= 5;

-- ========================================
-- ESQUEMA: payments
-- ========================================
SELECT create_donation('project-uuid', 'user-uuid', 100.00, 'credit_card', false);
SELECT complete_donation('donation-uuid', 'ext-ref-123');
SELECT refund_donation('donation-uuid');
SELECT payments.update_donation_status('donation-uuid', 'processing', 'admin-uuid');
SELECT * FROM payments.get_donations_by_project('project-uuid');
SELECT * FROM payments.get_donations_by_user('user-uuid');

-- Estadísticas
SELECT * FROM get_project_stats('project-uuid');
SELECT * FROM get_top_donors('project-uuid', 10);
SELECT * FROM get_trending_projects(10);

-- Vistas
SELECT * FROM payments.completed_donations WHERE user_id = 'user-uuid';

-- ========================================
-- ESQUEMA: social
-- ========================================
SELECT * FROM social.get_comments_by_project('project-uuid');
SELECT * FROM social.get_favorites_by_user('user-uuid');

-- ========================================
-- FUNCIONES DE MANTENIMIENTO (CRON JOBS)
-- ========================================
SELECT cleanup_expired_tokens();
SELECT update_campaign_statuses();
SELECT projects.auto_close_campaigns_by_deadline();

-- ========================================
-- FUNCIONES GLOBALES (UTILIDAD)
-- ========================================
SELECT generate_unique_slug('Mi Proyecto Increíble', 'projects.project');
SELECT can_user_donate('user-uuid', 'project-uuid');
SELECT calculate_funding_percentage('project-uuid');
SELECT get_unique_donors_count('project-uuid');

=======================================
RESUMEN POR ESQUEMA:
=======================================

1. users (5 funciones)
   - register_user, login_user, verify_user_email
   - change_password, suspend_user

2. roles (7 funciones)
   - Crear: role_category, module, ability, role
   - Asignar: ability_to_role, role_to_user
   - Validar: check_user_permission, remove_role_from_user

3. projects (18 funciones + 3 vistas)
   - Categorías: create_category, check_category_requirements
   - Proyectos: create, submit, approve, observe, reject
   - Campañas: start, pause, resume, end, finish_if_goal_reached
   - Consultas: get_approval_status, get_campaign_status, by_user, history
   - Búsqueda: search_active_projects
   - Vistas: active_projects, v_project_feed, v_top_backers

4. payments (9 funciones + 1 vista)
   - Donaciones: create, complete, refund, update_status
   - Consultas: by_project, by_user
   - Estadísticas: get_project_stats, get_top_donors, get_trending_projects
   - Vista: completed_donations

5. social (2 funciones)
   - get_comments_by_project, get_favorites_by_user

6. audit (pendiente)

7. Mantenimiento (3 funciones)
   - cleanup_expired_tokens
   - update_campaign_statuses
   - auto_close_campaigns_by_deadline

8. Globales (4 funciones)
   - generate_unique_slug
   - can_user_donate
   - calculate_funding_percentage
   - get_unique_donors_count

TOTAL: 48 funciones/procedimientos + 4 vistas

=======================================
*/