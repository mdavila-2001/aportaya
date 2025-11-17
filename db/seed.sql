-- ========================================
-- SEED DATA - APORTA YA MVP
-- Sistema de Roles, Módulos, Permisos y Super Administrador
-- ========================================
-- Este archivo crea la estructura completa de RBAC y un usuario super admin inicial
-- Ejecutar DESPUÉS de database.sql, procedures.sql y triggers.sql
-- ========================================

-- Limpiar datos de roles y usuarios (en orden inverso de dependencias)
TRUNCATE TABLE roles.user_role CASCADE;
TRUNCATE TABLE roles.role_ability CASCADE;
TRUNCATE TABLE roles.ability CASCADE;
TRUNCATE TABLE roles.module CASCADE;
TRUNCATE TABLE roles.role_category CASCADE;
TRUNCATE TABLE roles.role CASCADE;
TRUNCATE TABLE users.password_reset_token CASCADE;
TRUNCATE TABLE users.email_verification_token CASCADE;
TRUNCATE TABLE users.user_status_interval CASCADE;
TRUNCATE TABLE users.user_status_history CASCADE;
TRUNCATE TABLE users.user CASCADE;

-- ========================================
-- 1. CATEGORÍAS DE ROLES
-- ========================================
INSERT INTO roles.role_category (id, name, description) VALUES
(1, 'Sistema', 'Módulos de configuración y administración del sistema'),
(2, 'Gestión de Contenido', 'Módulos para gestionar contenido de la plataforma'),
(3, 'Financiero', 'Módulos relacionados con transacciones y donaciones'),
(4, 'Social', 'Módulos de interacción social y comunicación'),
(5, 'Seguridad', 'Módulos de auditoría y seguridad');

-- ========================================
-- 2. MÓDULOS DEL SISTEMA
-- ========================================
INSERT INTO roles.module (id, name, category_id) VALUES
-- Módulos de Sistema (categoría 1)
(1, 'Inicio', 1),
(2, 'Dashboard', 1),
(3, 'Configuración General', 1),
(4, 'Configuración de Usuario', 1),

-- Módulos de Gestión de Contenido (categoría 2)
(5, 'Gestión de Usuarios', 2),
(6, 'Gestión de Proyectos', 2),
(7, 'Categorías de Proyectos', 2),
(8, 'Aprobación de Proyectos', 2),

-- Módulos Financieros (categoría 3)
(9, 'Donaciones', 3),
(10, 'Transacciones', 3),
(11, 'Reportes Financieros', 3),
(12, 'Métodos de Pago', 3),

-- Módulos Sociales (categoría 4)
(13, 'Comentarios', 4),
(14, 'Actualizaciones de Proyectos', 4),
(15, 'Mensajería', 4),
(16, 'Favoritos', 4),
(17, 'Reportes de Contenido', 4),

-- Módulos de Seguridad (categoría 5)
(18, 'Auditoría', 5),
(19, 'Roles y Permisos', 5),
(20, 'Logs del Sistema', 5);

-- ========================================
-- 3. HABILIDADES (PERMISOS) POR MÓDULO
-- ========================================

-- Habilidades para Inicio (1)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(1, 'view', 'Ver Inicio', 1);

-- Habilidades para Dashboard (2)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(2, 'view', 'Ver Dashboard', 2),
(3, 'stats', 'Ver Estadísticas', 2),
(4, 'analytics', 'Ver Analytics', 2);

-- Habilidades para Configuración General (3)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(5, 'read', 'Ver Configuración', 3),
(6, 'update', 'Editar Configuración', 3),
(7, 'manage_platform', 'Gestionar Plataforma', 3);

-- Habilidades para Configuración de Usuario (4)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(8, 'read', 'Ver Mi Perfil', 4),
(9, 'update', 'Editar Mi Perfil', 4),
(10, 'change_password', 'Cambiar Contraseña', 4);

-- Habilidades para Gestión de Usuarios (5)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(11, 'view', 'Ver Usuarios', 5),
(12, 'create', 'Crear Usuarios', 5),
(13, 'edit', 'Editar Usuarios', 5),
(14, 'delete', 'Eliminar Usuarios', 5),
(15, 'suspend', 'Suspender Usuarios', 5),
(16, 'ban', 'Banear Usuarios', 5),
(17, 'view_history', 'Ver Historial de Usuarios', 5);

-- Habilidades para Gestión de Proyectos (6)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(18, 'view_all', 'Ver Todos los Proyectos', 6),
(19, 'view_own', 'Ver Mis Proyectos', 6),
(20, 'create', 'Crear Proyectos', 6),
(21, 'edit_own', 'Editar Mis Proyectos', 6),
(22, 'edit_all', 'Editar Todos los Proyectos', 6),
(23, 'delete_own', 'Eliminar Mis Proyectos', 6),
(24, 'delete_all', 'Eliminar Todos los Proyectos', 6),
(25, 'pause_campaign', 'Pausar Campaña', 6);

-- Habilidades para Categorías de Proyectos (7)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(26, 'view', 'Ver Categorías', 7),
(27, 'create', 'Crear Categorías', 7),
(28, 'edit', 'Editar Categorías', 7),
(29, 'delete', 'Eliminar Categorías', 7);

-- Habilidades para Aprobación de Proyectos (8)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(30, 'view_pending', 'Ver Proyectos Pendientes', 8),
(31, 'approve', 'Aprobar Proyectos', 8),
(32, 'reject', 'Rechazar Proyectos', 8),
(33, 'observe', 'Observar Proyectos', 8),
(34, 'view_history', 'Ver Historial de Aprobaciones', 8);

-- Habilidades para Donaciones (9)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(35, 'view_all', 'Ver Todas las Donaciones', 9),
(36, 'view_own', 'Ver Mis Donaciones', 9),
(37, 'create', 'Realizar Donaciones', 9),
(38, 'refund', 'Procesar Reembolsos', 9),
(39, 'view_project_donations', 'Ver Donaciones de Proyecto', 9);

-- Habilidades para Transacciones (10)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(40, 'view_all', 'Ver Todas las Transacciones', 10),
(41, 'view_own', 'Ver Mis Transacciones', 10),
(42, 'process', 'Procesar Transacciones', 10),
(43, 'cancel', 'Cancelar Transacciones', 10);

-- Habilidades para Reportes Financieros (11)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(44, 'view', 'Ver Reportes', 11),
(45, 'export', 'Exportar Reportes', 11),
(46, 'view_detailed', 'Ver Reportes Detallados', 11);

-- Habilidades para Métodos de Pago (12)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(47, 'view', 'Ver Métodos de Pago', 12),
(48, 'configure', 'Configurar Métodos de Pago', 12),
(49, 'enable_disable', 'Activar/Desactivar Métodos', 12);

-- Habilidades para Comentarios (13)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(50, 'view', 'Ver Comentarios', 13),
(51, 'create', 'Crear Comentarios', 13),
(52, 'edit_own', 'Editar Mis Comentarios', 13),
(53, 'delete_own', 'Eliminar Mis Comentarios', 13),
(54, 'delete_all', 'Eliminar Todos los Comentarios', 13),
(55, 'moderate', 'Moderar Comentarios', 13);

-- Habilidades para Actualizaciones de Proyectos (14)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(56, 'view', 'Ver Actualizaciones', 14),
(57, 'create', 'Crear Actualizaciones', 14),
(58, 'edit_own', 'Editar Mis Actualizaciones', 14),
(59, 'delete_own', 'Eliminar Mis Actualizaciones', 14),
(60, 'delete_all', 'Eliminar Todas las Actualizaciones', 14);

-- Habilidades para Mensajería (15)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(61, 'view_own', 'Ver Mis Mensajes', 15),
(62, 'send', 'Enviar Mensajes', 15),
(63, 'view_all', 'Ver Todos los Mensajes', 15),
(64, 'moderate', 'Moderar Mensajes', 15);

-- Habilidades para Favoritos (16)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(65, 'view', 'Ver Favoritos', 16),
(66, 'add', 'Agregar Favoritos', 16),
(67, 'remove', 'Quitar Favoritos', 16);

-- Habilidades para Reportes de Contenido (17)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(68, 'create', 'Reportar Contenido', 17),
(69, 'view_all', 'Ver Todos los Reportes', 17),
(70, 'resolve', 'Resolver Reportes', 17),
(71, 'view_history', 'Ver Historial de Reportes', 17);

-- Habilidades para Auditoría (18)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(72, 'view', 'Ver Auditoría', 18),
(73, 'export', 'Exportar Auditoría', 18),
(74, 'view_detailed', 'Ver Detalles de Auditoría', 18);

-- Habilidades para Roles y Permisos (19)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(75, 'view', 'Ver Roles', 19),
(76, 'create', 'Crear Roles', 19),
(77, 'edit', 'Editar Roles', 19),
(78, 'delete', 'Eliminar Roles', 19),
(79, 'assign', 'Asignar Roles', 19);

-- Habilidades para Logs del Sistema (20)
INSERT INTO roles.ability (id, name, label, module_id) VALUES
(80, 'view', 'Ver Logs', 20),
(81, 'export', 'Exportar Logs', 20),
(82, 'clear', 'Limpiar Logs', 20);

-- ========================================
-- 4. ROLES
-- ========================================
INSERT INTO roles.role (id, name) VALUES
(1, 'Super Administrador'),
(2, 'Administrador'),
(3, 'Moderador'),
(4, 'Creador de Proyectos'),
(5, 'Donante'),
(6, 'Usuario Registrado');

-- ========================================
-- 5. ASIGNACIÓN DE HABILIDADES A ROLES
-- ========================================

-- ROL 1: SUPER ADMINISTRADOR (todos los permisos)
INSERT INTO roles.role_ability (role_id, ability_id, granted)
SELECT 1, id, true FROM roles.ability;

-- ROL 2: ADMINISTRADOR (casi todos los permisos, excepto configuración crítica)
INSERT INTO roles.role_ability (role_id, ability_id, granted)
SELECT 2, id, true FROM roles.ability
WHERE id NOT IN (7, 76, 77, 78, 82); -- No puede gestionar plataforma, roles críticos ni limpiar logs

-- ROL 3: MODERADOR (gestión de contenido y moderación)
INSERT INTO roles.role_ability (role_id, ability_id, granted) VALUES
-- Básicos
(3, 1, true), -- Ver Inicio
(3, 2, true), -- Ver Dashboard
(3, 8, true), -- Ver Mi Perfil
(3, 9, true), -- Editar Mi Perfil
(3, 10, true), -- Cambiar Contraseña
-- Gestión de Usuarios (limitado)
(3, 11, true), -- Ver Usuarios
(3, 15, true), -- Suspender Usuarios
(3, 17, true), -- Ver Historial de Usuarios
-- Gestión de Proyectos
(3, 18, true), -- Ver Todos los Proyectos
(3, 22, true), -- Editar Todos los Proyectos
-- Aprobación de Proyectos
(3, 30, true), -- Ver Proyectos Pendientes
(3, 31, true), -- Aprobar Proyectos
(3, 32, true), -- Rechazar Proyectos
(3, 33, true), -- Observar Proyectos
(3, 34, true), -- Ver Historial de Aprobaciones
-- Categorías
(3, 26, true), -- Ver Categorías
(3, 27, true), -- Crear Categorías
(3, 28, true), -- Editar Categorías
-- Comentarios
(3, 50, true), -- Ver Comentarios
(3, 54, true), -- Eliminar Todos los Comentarios
(3, 55, true), -- Moderar Comentarios
-- Reportes de Contenido
(3, 69, true), -- Ver Todos los Reportes
(3, 70, true), -- Resolver Reportes
(3, 71, true), -- Ver Historial de Reportes
-- Mensajería
(3, 61, true), -- Ver Mis Mensajes
(3, 63, true), -- Ver Todos los Mensajes
(3, 64, true); -- Moderar Mensajes

-- ROL 4: CREADOR DE PROYECTOS (puede crear y gestionar sus proyectos)
INSERT INTO roles.role_ability (role_id, ability_id, granted) VALUES
-- Básicos
(4, 1, true), -- Ver Inicio
(4, 2, true), -- Ver Dashboard
(4, 3, true), -- Ver Estadísticas
(4, 8, true), -- Ver Mi Perfil
(4, 9, true), -- Editar Mi Perfil
(4, 10, true), -- Cambiar Contraseña
-- Proyectos
(4, 19, true), -- Ver Mis Proyectos
(4, 20, true), -- Crear Proyectos
(4, 21, true), -- Editar Mis Proyectos
(4, 23, true), -- Eliminar Mis Proyectos
(4, 25, true), -- Pausar Campaña
-- Categorías
(4, 26, true), -- Ver Categorías
-- Donaciones
(4, 36, true), -- Ver Mis Donaciones
(4, 37, true), -- Realizar Donaciones
(4, 39, true), -- Ver Donaciones de Proyecto
-- Transacciones
(4, 41, true), -- Ver Mis Transacciones
-- Comentarios
(4, 50, true), -- Ver Comentarios
(4, 51, true), -- Crear Comentarios
(4, 52, true), -- Editar Mis Comentarios
(4, 53, true), -- Eliminar Mis Comentarios
-- Actualizaciones
(4, 56, true), -- Ver Actualizaciones
(4, 57, true), -- Crear Actualizaciones
(4, 58, true), -- Editar Mis Actualizaciones
(4, 59, true), -- Eliminar Mis Actualizaciones
-- Mensajería
(4, 61, true), -- Ver Mis Mensajes
(4, 62, true), -- Enviar Mensajes
-- Favoritos
(4, 65, true), -- Ver Favoritos
(4, 66, true), -- Agregar Favoritos
(4, 67, true), -- Quitar Favoritos
-- Reportes
(4, 68, true); -- Reportar Contenido

-- ROL 5: DONANTE (puede donar y ver proyectos)
INSERT INTO roles.role_ability (role_id, ability_id, granted) VALUES
-- Básicos
(5, 1, true), -- Ver Inicio
(5, 8, true), -- Ver Mi Perfil
(5, 9, true), -- Editar Mi Perfil
(5, 10, true), -- Cambiar Contraseña
-- Categorías
(5, 26, true), -- Ver Categorías
-- Donaciones
(5, 36, true), -- Ver Mis Donaciones
(5, 37, true), -- Realizar Donaciones
-- Transacciones
(5, 41, true), -- Ver Mis Transacciones
-- Comentarios
(5, 50, true), -- Ver Comentarios
(5, 51, true), -- Crear Comentarios
(5, 52, true), -- Editar Mis Comentarios
(5, 53, true), -- Eliminar Mis Comentarios
-- Actualizaciones
(5, 56, true), -- Ver Actualizaciones
-- Mensajería
(5, 61, true), -- Ver Mis Mensajes
(5, 62, true), -- Enviar Mensajes
-- Favoritos
(5, 65, true), -- Ver Favoritos
(5, 66, true), -- Agregar Favoritos
(5, 67, true), -- Quitar Favoritos
-- Reportes
(5, 68, true); -- Reportar Contenido

-- ROL 6: USUARIO REGISTRADO (permisos básicos)
INSERT INTO roles.role_ability (role_id, ability_id, granted) VALUES
-- Básicos
(6, 1, true), -- Ver Inicio
(6, 8, true), -- Ver Mi Perfil
(6, 9, true), -- Editar Mi Perfil
(6, 10, true), -- Cambiar Contraseña
-- Categorías
(6, 26, true), -- Ver Categorías
-- Comentarios
(6, 50, true), -- Ver Comentarios
(6, 51, true), -- Crear Comentarios
(6, 52, true), -- Editar Mis Comentarios
(6, 53, true), -- Eliminar Mis Comentarios
-- Actualizaciones
(6, 56, true), -- Ver Actualizaciones
-- Favoritos
(6, 65, true), -- Ver Favoritos
(6, 66, true), -- Agregar Favoritos
(6, 67, true), -- Quitar Favoritos
-- Reportes
(6, 68, true); -- Reportar Contenido

-- ========================================
-- 6. SUPER ADMINISTRADOR INICIAL
-- ========================================
-- Usar la función register_user del archivo procedures.sql
-- La contraseña será hasheada automáticamente con bcrypt

DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Registrar super administrador usando la función existente
    -- Nota: El role_id 1 corresponde a "Super Administrador"
    v_admin_id := users.register_user(
        p_first_name := 'Super',
        p_last_name := 'Administrador',
        p_email := 'admin@aportaya.com',
        p_password := '12345678',  -- Esta contraseña será hasheada por la función
        p_gender := 'male',
        p_birth_date := '2000-01-01',
        p_role_id := 1  -- Super Administrador
    );
    
    -- Activar inmediatamente el usuario (sin verificación de email)
    UPDATE users.user
    SET status = 'active'
    WHERE id = v_admin_id;
    
    -- Marcar el token de verificación como usado
    UPDATE users.email_verification_token
    SET used_at = now()
    WHERE user_id = v_admin_id;
    
    RAISE NOTICE 'Super Administrador creado con ID: %', v_admin_id;
    RAISE NOTICE 'Email: admin@aportaya.com';
    RAISE NOTICE 'Password: 12345678';
END $$;

-- ========================================
-- 5. CATEGORÍAS DE PROYECTOS DE PRUEBA
-- ========================================
INSERT INTO projects.category (id, name, slug, description, parent_id) VALUES
(1, 'Tecnología', 'tecnologia', 'Proyectos relacionados con tecnología e innovación', NULL),
(2, 'Arte y Cultura', 'arte-y-cultura', 'Proyectos artísticos y culturales', NULL),
(3, 'Educación', 'educacion', 'Proyectos educativos y de formación', NULL),
(4, 'Medio Ambiente', 'medio-ambiente', 'Proyectos ecológicos y sostenibles', NULL),
(5, 'Salud', 'salud', 'Proyectos relacionados con salud y bienestar', NULL);

-- ========================================
-- 6. USUARIOS DE PRUEBA (CREADORES)
-- ========================================
DO $$
DECLARE
    v_user1_id UUID;
    v_user2_id UUID;
    v_user3_id UUID;
    v_img1_id UUID;
    v_img2_id UUID;
    v_img3_id UUID;
BEGIN
    -- Primero crear las imágenes de perfil (simulando URLs almacenadas como archivos)
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES 
        ('avatar_maria.jpg', 'https://i.pravatar.cc/150?img=1', 'Avatar de María', FALSE)
    RETURNING id INTO v_img1_id;
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES 
        ('avatar_carlos.jpg', 'https://i.pravatar.cc/150?img=12', 'Avatar de Carlos', FALSE)
    RETURNING id INTO v_img2_id;
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES 
        ('avatar_ana.jpg', 'https://i.pravatar.cc/150?img=5', 'Avatar de Ana', FALSE)
    RETURNING id INTO v_img3_id;
    
    -- Usuario 1: María González (Creadora de proyectos tech)
    SELECT users.register_user(
        p_first_name := 'María',
        p_last_name := 'González',
        p_email := 'maria.gonzalez@example.com',
        p_password := '12345678',
        p_gender := 'female',
        p_birth_date := '1990-05-15',
        p_profile_image_id := v_img1_id,
        p_role_id := 8  -- User (Creator)
    ) INTO v_user1_id;
    
    UPDATE users.user SET status = 'active' WHERE id = v_user1_id;
    UPDATE users.email_verification_token SET used_at = now() WHERE user_id = v_user1_id;
    
    -- Usuario 2: Carlos Ramírez (Creador de proyectos culturales)
    SELECT users.register_user(
        p_first_name := 'Carlos',
        p_last_name := 'Ramírez',
        p_email := 'carlos.ramirez@example.com',
        p_password := '12345678',
        p_gender := 'male',
        p_birth_date := '1985-08-22',
        p_profile_image_id := v_img2_id,
        p_role_id := 8  -- User (Creator)
    ) INTO v_user2_id;
    
    UPDATE users.user SET status = 'active' WHERE id = v_user2_id;
    UPDATE users.email_verification_token SET used_at = now() WHERE user_id = v_user2_id;
    
    -- Usuario 3: Ana Martínez (Creadora de proyectos educativos)
    SELECT users.register_user(
        p_first_name := 'Ana',
        p_last_name := 'Martínez',
        p_email := 'ana.martinez@example.com',
        p_password := '12345678',
        p_gender := 'female',
        p_birth_date := '1992-03-10',
        p_profile_image_id := v_img3_id,
        p_role_id := 8  -- User (Creator)
    ) INTO v_user3_id;
    
    UPDATE users.user SET status = 'active' WHERE id = v_user3_id;
    UPDATE users.email_verification_token SET used_at = now() WHERE user_id = v_user3_id;
    
    RAISE NOTICE 'Imágenes de perfil y usuarios de prueba creados exitosamente';
END $$;

-- ========================================
-- 7. PROYECTOS DE PRUEBA CON MÚLTIPLES IMÁGENES
-- ========================================
DO $$
DECLARE
    v_project1_id UUID;
    v_project2_id UUID;
    v_project3_id UUID;
    v_user1_id UUID;
    v_user2_id UUID;
    v_user3_id UUID;
    -- Arrays para almacenar IDs de imágenes
    v_project1_images UUID[];
    v_project2_images UUID[];
    v_project3_images UUID[];
    v_temp_img_id UUID;
BEGIN
    -- Obtener IDs de usuarios
    SELECT id INTO v_user1_id FROM users.user WHERE email = 'maria.gonzalez@example.com';
    SELECT id INTO v_user2_id FROM users.user WHERE email = 'carlos.ramirez@example.com';
    SELECT id INTO v_user3_id FROM users.user WHERE email = 'ana.martinez@example.com';
    
    -- ========================================
    -- CREAR IMÁGENES PARA PROYECTO 1
    -- ========================================
    v_project1_images := ARRAY[]::UUID[];
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('eduai_cover.jpg', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', 'Estudiantes con laptop', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project1_images := array_append(v_project1_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('eduai_interface.jpg', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 'Interfaz de la app', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project1_images := array_append(v_project1_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('eduai_student.jpg', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', 'Estudiante usando la app', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project1_images := array_append(v_project1_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('eduai_team.jpg', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', 'Equipo de trabajo', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project1_images := array_append(v_project1_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('eduai_dashboard.jpg', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', 'Dashboard de estadísticas', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project1_images := array_append(v_project1_images, v_temp_img_id);
    
    -- ========================================
    -- PROYECTO 1: App Educativa con IA
    -- ========================================
    SELECT projects.create_project(
        p_creator_id := v_user1_id,
        p_title := 'EduAI - Plataforma de Aprendizaje con Inteligencia Artificial',
        p_description := 'Una innovadora aplicación móvil que utiliza inteligencia artificial para personalizar el aprendizaje de matemáticas y ciencias para estudiantes de secundaria. La app adapta el contenido según el ritmo y estilo de aprendizaje de cada estudiante.',
        p_financial_goal := 50000.00,
        p_start_date := now(),
        p_end_date := now() + INTERVAL '60 days',
        p_category_id := 1,  -- Tecnología
        p_location := 'Ciudad de México, México',
        p_video_url := 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        p_currency := 'MXN'
    ) INTO v_project1_id;
    
    -- Agregar múltiples imágenes al proyecto (índice 0 será la portada)
    PERFORM projects.add_project_images(
        v_project1_id,
        v_project1_images,
        0  -- Primera imagen como portada
    );
    
    -- Actualizar proyecto a publicado y campaña activa
    UPDATE projects.project 
    SET approval_status = 'published', 
        campaign_status = 'in_progress',
        summary = 'Plataforma educativa que revoluciona el aprendizaje con IA personalizada'
    WHERE id = v_project1_id;
    
    -- ========================================
    -- CREAR IMÁGENES PARA PROYECTO 2
    -- ========================================
    v_project2_images := ARRAY[]::UUID[];
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('arte_mural_progress.jpg', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800', 'Mural en progreso', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project2_images := array_append(v_project2_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('arte_urbano_colorido.jpg', 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800', 'Arte urbano colorido', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project2_images := array_append(v_project2_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('festival_anterior.jpg', 'https://images.unsplash.com/photo-1499892477393-f675706cbe6e?w=800', 'Festival anterior', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project2_images := array_append(v_project2_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('artista_trabajando.jpg', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800', 'Artista trabajando', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project2_images := array_append(v_project2_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('publico_observando.jpg', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800', 'Público observando', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project2_images := array_append(v_project2_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('mural_terminado.jpg', 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800', 'Mural terminado', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project2_images := array_append(v_project2_images, v_temp_img_id);
    
    -- ========================================
    -- PROYECTO 2: Festival de Arte Urbano
    -- ========================================
    SELECT projects.create_project(
        p_creator_id := v_user2_id,
        p_title := 'Festival Internacional de Arte Urbano 2026',
        p_description := 'El primer festival internacional de arte urbano que reunirá a 50 artistas de murales, grafiti y arte callejero de América Latina. Incluye talleres gratuitos, exhibiciones en vivo y la creación de 15 murales permanentes en espacios públicos de la ciudad.',
        p_financial_goal := 35000.00,
        p_start_date := now(),
        p_end_date := now() + INTERVAL '45 days',
        p_category_id := 2,  -- Arte y Cultura
        p_location := 'Bogotá, Colombia',
        p_video_url := 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        p_currency := 'COP'
    ) INTO v_project2_id;
    
    -- Agregar galería de imágenes del proyecto (índice 2 será la portada)
    PERFORM projects.add_project_images(
        v_project2_id,
        v_project2_images,
        2  -- Tercera imagen como portada
    );
    
    UPDATE projects.project 
    SET approval_status = 'published', 
        campaign_status = 'in_progress',
        summary = 'Transformando la ciudad con arte urbano de clase mundial'
    WHERE id = v_project2_id;
    
    -- Simular donaciones para el proyecto 2
    INSERT INTO payments.donation (project_id, user_id, amount, payment_method, payment_status, is_anonymous)
    VALUES 
        (v_project2_id, v_user1_id, 500.00, 'credit_card', 'completed', false),
        (v_project2_id, v_user3_id, 1000.00, 'paypal', 'completed', false);
    
    -- ========================================
    -- CREAR IMÁGENES PARA PROYECTO 3
    -- ========================================
    v_project3_images := ARRAY[]::UUID[];
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('biblioteca_ninos_leyendo.jpg', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800', 'Niños leyendo', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project3_images := array_append(v_project3_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('biblioteca_tradicional.jpg', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800', 'Biblioteca tradicional', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project3_images := array_append(v_project3_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('tecnologia_educativa.jpg', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800', 'Tecnología educativa', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project3_images := array_append(v_project3_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('comunidad_rural.jpg', 'https://images.unsplash.com/photo-1524069290683-0457abfe42c3?w=800', 'Comunidad rural', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project3_images := array_append(v_project3_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('tablets_contenido.jpg', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 'Tablets con contenido', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project3_images := array_append(v_project3_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('capacitacion.jpg', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', 'Capacitación bibliotecarios', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project3_images := array_append(v_project3_images, v_temp_img_id);
    
    INSERT INTO files.image (file_name, file_path, alt_text, is_temporary)
    VALUES ('ninos_tablets.jpg', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', 'Niños usando tablets', FALSE)
    RETURNING id INTO v_temp_img_id;
    v_project3_images := array_append(v_project3_images, v_temp_img_id);
    
    -- ========================================
    -- PROYECTO 3: Biblioteca Comunitaria Digital
    -- ========================================
    SELECT projects.create_project(
        p_creator_id := v_user3_id,
        p_title := 'Biblioteca Digital para Comunidades Rurales',
        p_description := 'Proyecto para implementar 20 bibliotecas digitales en comunidades rurales sin acceso a libros. Incluye tablets, conexión a internet satelital, y una plataforma con más de 10,000 libros digitales en español. También capacitamos a bibliotecarios locales.',
        p_financial_goal := 75000.00,
        p_start_date := now() - INTERVAL '10 days',
        p_end_date := now() + INTERVAL '50 days',
        p_category_id := 3,  -- Educación
        p_location := 'Cusco, Perú',
        p_video_url := 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        p_currency := 'PEN'
    ) INTO v_project3_id;
    
    -- Agregar múltiples imágenes documentando el proyecto
    PERFORM projects.add_project_images(
        v_project3_id,
        v_project3_images,
        0  -- Primera imagen como portada
    );
    
    UPDATE projects.project 
    SET approval_status = 'published', 
        campaign_status = 'in_progress',
        summary = 'Llevando el conocimiento del mundo a comunidades remotas',
        raised_amount = 15000.00  -- Ya tiene algo recaudado
    WHERE id = v_project3_id;
    
    -- Simular más donaciones
    INSERT INTO payments.donation (project_id, user_id, amount, payment_method, payment_status, is_anonymous)
    VALUES 
        (v_project3_id, v_user1_id, 5000.00, 'bank_transfer', 'completed', false),
        (v_project3_id, v_user2_id, 10000.00, 'credit_card', 'completed', false);
    
    RAISE NOTICE 'Proyectos de prueba creados con múltiples imágenes';
    RAISE NOTICE 'Proyecto 1 (Tech): % - 5 imágenes', v_project1_id;
    RAISE NOTICE 'Proyecto 2 (Arte): % - 6 imágenes', v_project2_id;
    RAISE NOTICE 'Proyecto 3 (Educación): % - 7 imágenes', v_project3_id;
END $$;

-- ========================================
-- RESUMEN DE DATOS CREADOS
-- ========================================
-- Categorías de Roles: 5
-- Módulos: 20
-- Habilidades (Permisos): 82
-- Roles: 6
-- Categorías de Proyectos: 5
-- Usuarios: 4 (1 admin + 3 creadores)
-- Proyectos: 3 (con múltiples imágenes cada uno)
-- Imágenes de Proyectos: 18 (5 + 6 + 7)
-- Donaciones: 4
-- 
-- CREDENCIALES INICIALES:
-- Super Admin:
--   Email: admin@aportaya.com
--   Password: 12345678
-- 
-- Creadores de Prueba:
--   Email: maria.gonzalez@example.com - Password: 12345678
--   Email: carlos.ramirez@example.com - Password: 12345678
--   Email: ana.martinez@example.com - Password: 12345678
-- ========================================

SELECT 'Seed completado exitosamente' AS resultado;
