-- ================================================================
-- SEED DE DATOS COMPLETO Y MASIVO - AportaYa
-- ================================================================
-- Ejecutar este script llenará tu BD con datos de prueba coherentes.
-- Incluye: Roles, Permisos, Usuarios, Categorías con Requisitos,
-- y 15 Proyectos en distintos estados (8 aprobados).
-- ================================================================

-- 1. LIMPIEZA TOTAL (Borrón y cuenta nueva)
TRUNCATE TABLE 
    roles.user_role, roles.role_ability, roles.ability, roles.module, roles.role_category, roles.role,
    audit.audit_log, messaging.message, messaging.conversation, social.favorite, social.report, social.update, social.comment,
    payments.webhook_event, payments.payment_transaction, payments.donation,
    projects.project_observation, projects.project_status_history, projects.project_approval_history,
    projects.category_requirements, projects.project, projects.category,
    users.password_reset_token, users.email_verification_token, users.user_status_history, users.user,
    files.image
RESTART IDENTITY CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- INICIO DEL BLOQUE ANÓNIMO DINÁMICO
-- =====================================================
DO $$ 
DECLARE
    -- --- VARIABLES PARA CAPTURAR IDs ---
    
    -- Categorías y Roles
    v_cat_role_admin INT; v_cat_role_platform INT;
    v_role_admin_id INT; v_role_user_id INT;

    -- Módulos
    v_mod_admin INT; v_mod_users INT; v_mod_proj_cat INT; v_mod_proj_manage INT; v_mod_stats INT;
    v_mod_my_proj INT; v_mod_donations INT; v_mod_profile INT; v_mod_comments INT; v_mod_favorites INT;

    -- Imágenes (Usuarios y Proyectos Base)
    v_img_admin_id UUID; v_img_marcelo_id UUID; v_img_melissa_id UUID; v_img_carlos_id UUID; v_img_ana_id UUID;
    v_img_p_tech1 UUID; v_img_p_tech2 UUID; v_img_p_social1 UUID; v_img_p_social2 UUID; v_img_p_art1 UUID; v_img_p_health1 UUID;

    -- Usuarios
    v_user_admin_id UUID;
    v_user_marcelo_id UUID;   -- Creador 1
    v_user_carlos_id UUID; -- Creador 2
    v_user_ana_id UUID;    -- Creador 3
    v_user_melissa_id UUID;  -- Donante

    -- Categorías de Proyectos
    v_cat_proj_tech_id INT; v_cat_proj_health_id INT; v_cat_proj_social_id INT; v_cat_proj_art_id INT; v_cat_proj_env_id INT;
    
    -- Variables temporales para loops o asignaciones masivas
    v_ability_record RECORD;

BEGIN
    RAISE NOTICE '--- INICIANDO SEED MASIVO ---';

    -- =====================================================
    -- 2 - 6. CONFIGURACIÓN DE ROLES Y PERMISOS (Igual que antes)
    -- =====================================================
    
    -- 2. Categorías en Roles
    SELECT roles.create_role_category('Administración', 'Funciones exclusivas para administradores') INTO v_cat_role_admin;
    SELECT roles.create_role_category('Plataforma', 'Funcionalidades para usuarios') INTO v_cat_role_platform;

    -- 3. Módulos
    SELECT roles.create_module('Administradores', v_cat_role_admin) INTO v_mod_admin;
    SELECT roles.create_module('Gestión de Usuarios', v_cat_role_admin) INTO v_mod_users;
    SELECT roles.create_module('Gestión de Categorías de Proyectos', v_cat_role_admin) INTO v_mod_proj_cat;
    SELECT roles.create_module('Gestión de Proyectos', v_cat_role_admin) INTO v_mod_proj_manage;
    SELECT roles.create_module('Estadísticas', v_cat_role_admin) INTO v_mod_stats;

    SELECT roles.create_module('Mis Proyectos', v_cat_role_platform) INTO v_mod_my_proj;
    SELECT roles.create_module('Donaciones', v_cat_role_platform) INTO v_mod_donations;
    SELECT roles.create_module('Perfil', v_cat_role_platform) INTO v_mod_profile;
    SELECT roles.create_module('Comentarios', v_cat_role_platform) INTO v_mod_comments;
    SELECT roles.create_module('Favoritos', v_cat_role_platform) INTO v_mod_favorites;

    -- 4. Habilidades (Se crean todas dinámicamente)
    PERFORM roles.create_ability('find', 'Ver Administradores', v_mod_admin);
    PERFORM roles.create_ability('update', 'Actualizar Administradores', v_mod_admin);
    PERFORM roles.create_ability('create', 'Crear Administradores', v_mod_admin);
    PERFORM roles.create_ability('kill', 'Eliminar Administradores', v_mod_admin);

    PERFORM roles.create_ability('find', 'Ver Usuarios', v_mod_users);
    PERFORM roles.create_ability('update', 'Actualizar Usuarios', v_mod_users);
    PERFORM roles.create_ability('create', 'Crear Usuarios', v_mod_users);
    PERFORM roles.create_ability('kill', 'Eliminar Usuarios', v_mod_users);
    PERFORM roles.create_ability('suspend', 'Suspender Usuarios', v_mod_users); -- Agregado útil

    PERFORM roles.create_ability('find', 'Ver Categorías', v_mod_proj_cat);
    PERFORM roles.create_ability('update', 'Actualizar Categorías', v_mod_proj_cat);
    PERFORM roles.create_ability('create', 'Crear Categorías', v_mod_proj_cat);
    PERFORM roles.create_ability('kill', 'Eliminar Categorías', v_mod_proj_cat);

    PERFORM roles.create_ability('read', 'Ver Proyectos', v_mod_proj_manage);
    PERFORM roles.create_ability('approve', 'Aprobar Proyectos', v_mod_proj_manage);
    PERFORM roles.create_ability('reject', 'Rechazar Proyectos', v_mod_proj_manage);
    PERFORM roles.create_ability('observe', 'Observar proyectos', v_mod_proj_manage);

    PERFORM roles.create_ability('check', 'Ver Estadísticas', v_mod_stats);
    PERFORM roles.create_ability('export', 'Exportar Estadísticas', v_mod_stats);

    PERFORM roles.create_ability('find', 'Ver Mis Proyectos', v_mod_my_proj);
    PERFORM roles.create_ability('update', 'Actualizar Mis Proyectos', v_mod_my_proj);
    PERFORM roles.create_ability('create', 'Crear Proyecto', v_mod_my_proj);
    PERFORM roles.create_ability('manage_campaign', 'Gestionar Campaña', v_mod_my_proj); -- Agregado

    PERFORM roles.create_ability('view', 'Ver Donaciones', v_mod_donations);
    PERFORM roles.create_ability('donate', 'Donar', v_mod_donations);
    
    PERFORM roles.create_ability('view', 'Ver Perfil', v_mod_profile);
    PERFORM roles.create_ability('update', 'Editar Perfil', v_mod_profile);

    PERFORM roles.create_ability('comment', 'Comentar', v_mod_comments);
    
    PERFORM roles.create_ability('add', 'Agregar a Mis Favoritos', v_mod_favorites);
    PERFORM roles.create_ability('remove', 'Borrar de Mis Favoritos', v_mod_favorites);

    -- 5. Roles
    SELECT roles.create_role('Administrador') INTO v_role_admin_id;
    SELECT roles.create_role('Usuario') INTO v_role_user_id;

    -- 6. Asignación Masiva de Permisos
    -- Admin: Todo
    INSERT INTO roles.role_ability (role_id, ability_id)
    SELECT v_role_admin_id, id FROM roles.ability;

    -- Usuario: Solo Plataforma
    INSERT INTO roles.role_ability (role_id, ability_id)
    SELECT v_role_user_id, a.id
    FROM roles.ability a
    JOIN roles.module m ON a.module_id = m.id
    WHERE m.category_id = v_cat_role_platform;

    RAISE NOTICE 'Sistema de Roles y Permisos configurado.';

    -- =====================================================
    -- 7. CREAR IMÁGENES BASE
    -- =====================================================
    -- Avatares
    SELECT files.create_image('admin_av', '/uploads/avatar/admin.png', 'Admin', FALSE) INTO v_img_admin_id;
    SELECT files.create_image('marcelo_av', '/uploads/avatar/marcelo.png', 'Marcelo', FALSE) INTO v_img_marcelo_id;
    SELECT files.create_image('melissa_av', '/uploads/avatar/melissa.png', 'Melissa', FALSE) INTO v_img_melissa_id;
    SELECT files.create_image('carlos_av', '/uploads/avatar/carlos.png', 'Carlos', FALSE) INTO v_img_carlos_id;
    SELECT files.create_image('ana_av', '/uploads/avatar/ana.png', 'Ana', FALSE) INTO v_img_ana_id;

    -- Portadas de Proyectos (Pool de imágenes para usar)
    SELECT files.create_image('p_tech1', '/uploads/projects/tech1.jpg', 'Tech 1', FALSE) INTO v_img_p_tech1;
    SELECT files.create_image('p_tech2', '/uploads/projects/tech2.jpg', 'Tech 2', FALSE) INTO v_img_p_tech2;
    SELECT files.create_image('p_social1', '/uploads/projects/social1.jpg', 'Social 1', FALSE) INTO v_img_p_social1;
    SELECT files.create_image('p_social2', '/uploads/projects/social2.jpg', 'Social 2', FALSE) INTO v_img_p_social2;
    SELECT files.create_image('p_art1', '/uploads/projects/art1.jpg', 'Art 1', FALSE) INTO v_img_p_art1;
    SELECT files.create_image('p_health1', '/uploads/projects/health1.jpg', 'Health 1', FALSE) INTO v_img_p_health1;

    -- =====================================================
    -- 8. CREAR USUARIOS (Más creadores para variar)
    -- =====================================================
    -- Admin
    SELECT users.create_admin('Super', 'Admin', 'System', '', 'admin@aportaya.com', '12345678', 'M', '1990-01-01', v_img_admin_id, v_role_admin_id) INTO v_user_admin_id;
    
    -- Creadores y Donantes
    SELECT users.register_user('Danny', 'Marcelo', 'Dávila', 'Barrancos', 'dmarcelo201@gmail.com', '12345678', 'M', '2001-11-26', v_img_marcelo_id, v_role_user_id) INTO v_user_marcelo_id;
    SELECT users.register_user('Carlos', '', 'Sánchez', '', 'csanchez@gmail.com', '12345678', 'M', '1992-08-15', v_img_carlos_id, v_role_user_id) INTO v_user_carlos_id;
    SELECT users.register_user('Ana', '', 'García', 'Méndez', 'agarcia@gmail.com', '12345678', 'F', '1998-03-10', v_img_ana_id, v_role_user_id) INTO v_user_ana_id;
    SELECT users.register_user('Alejandra', 'Melissa', 'Rocha', 'Villegas', 'mrocha@gmail.com', '12345678', 'F', '1994-03-31', v_img_melissa_id, v_role_user_id) INTO v_user_melissa_id;

    -- Activar usuarios manualmente para pruebas
    UPDATE users.user SET status = 'active' WHERE id IN (v_user_marcelo_id, v_user_carlos_id, v_user_ana_id, v_user_melissa_id);

    RAISE NOTICE 'Usuarios creados y activados.';

    -- =====================================================
    -- 9. CATEGORÍAS DE PROYECTO Y REQUISITOS
    -- =====================================================
    
    -- A. Crear Categorías
    SELECT projects.create_category('Tecnología', 'tecnologia', 'Innovación y desarrollo') INTO v_cat_proj_tech_id;
    SELECT projects.create_category('Salud', 'salud', 'Proyectos médicos y bienestar') INTO v_cat_proj_health_id;
    SELECT projects.create_category('Social', 'social', 'Impacto comunitario') INTO v_cat_proj_social_id;
    SELECT projects.create_category('Arte', 'arte', 'Expresión creativa') INTO v_cat_proj_art_id;
    SELECT projects.create_category('Medio Ambiente', 'medio_ambiente', 'Sostenibilidad') INTO v_cat_proj_env_id;

    -- B. Crear Requisitos por Categoría (¡NUEVO!)
    INSERT INTO projects.category_requirements (category_id, requirement_name, requirement_value) VALUES
    (v_cat_proj_tech_id, 'Prototipo Funcional', 'Se requiere video demostrativo del prototipo.'),
    (v_cat_proj_tech_id, 'Plan Técnico', 'Documento de arquitectura técnica.'),
    
    (v_cat_proj_health_id, 'Certificación Profesional', 'Aval de una institución de salud reconocida.'),
    (v_cat_proj_health_id, 'Estudio de Impacto', 'Análisis de beneficiarios y riesgos.'),
    
    (v_cat_proj_social_id, 'Población Objetivo', 'Definición clara de la comunidad beneficiada.'),
    (v_cat_proj_social_id, 'Cartas de Apoyo', 'Al menos 3 cartas de organizaciones locales.'),

    (v_cat_proj_art_id, 'Portafolio', 'Muestra de trabajos previos del artista.'),
    
    (v_cat_proj_env_id, 'Estudio de Impacto Ambiental', 'Documento aprobado por entidad regulatoria.');

    RAISE NOTICE 'Categorías y sus requisitos configurados.';

    -- =====================================================
    -- 10. CREACIÓN MASIVA DE PROYECTOS (TOTAL 15)
    -- =====================================================
    -- Usamos INSERT directo para agilizar la creación masiva, 
    -- ya que tenemos todas las variables de IDs necesarias.

    -- --- GRUPO 1: PROYECTOS PUBLICADOS (APROBADOS) - TOTAL 8 ---
    
    -- 1. Tecnología (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_marcelo_id, v_cat_proj_tech_id, 'Mochila Solar Pro', 'mochila-solar-pro', '<p>Carga todo.</p>', 'Mochila con paneles de alta eficiencia.', 5000.00, NOW(), NOW() + INTERVAL '60 days', 'published', 'in_progress', v_img_p_tech1, 'La Paz');
    
    -- 2. Tecnología (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_ana_id, v_cat_proj_tech_id, 'Dron de Reforestación', 'dron-reforestacion', '<p>Planta árboles.</p>', 'Drones autónomos para plantar semillas.', 15000.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'published', 'in_progress', v_img_p_tech2, 'Cochabamba');

    -- 3. Social (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_carlos_id, v_cat_proj_social_id, 'Comedor Los Niños', 'comedor-los-ninos', '<p>Alimento diario.</p>', 'Comedor gratuito para 100 niños.', 3000.00, NOW(), NOW() + INTERVAL '45 days', 'published', 'in_progress', v_img_p_social1, 'El Alto');

    -- 4. Salud (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_ana_id, v_cat_proj_health_id, 'Clínica Móvil Rural', 'clinica-movil-rural', '<p>Salud accesible.</p>', 'Atención médica en zonas alejadas.', 20000.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 'published', 'in_progress', v_img_p_health1, 'Potosí');

    -- 5. Arte (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_marcelo_id, v_cat_proj_art_id, 'Murales Urbanos', 'murales-urbanos', '<p>Color en la ciudad.</p>', 'Embellecimiento de espacios públicos.', 1500.00, NOW(), NOW() + INTERVAL '30 days', 'published', 'in_progress', v_img_p_art1, 'Sucre');

    -- 6. Medio Ambiente (Carlos) - Finalizado exitoso
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, raised_amount, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_carlos_id, v_cat_proj_env_id, 'Limpieza Lago Uru Uru', 'limpieza-uru-uru', '<p>Recuperemos el lago.</p>', 'Campaña masiva de limpieza de plásticos.', 8000.00, 8500.00, NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day', 'published', 'finished', v_img_p_social2, 'Oruro');

    -- 7. Tecnología (Ana) - Pausado
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_ana_id, v_cat_proj_tech_id, 'Impresora 3D Educativa', 'impresora-3d-edu', '<p>Para escuelas.</p>', 'Kit de impresora 3D de bajo costo.', 4000.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days', 'published', 'paused', v_img_p_tech1, 'Tarija');

    -- 8. Social (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id, location) VALUES
    (v_user_marcelo_id, v_cat_proj_social_id, 'Biblioteca Barrial', 'biblioteca-barrial', '<p>Libros para todos.</p>', 'Espacio de lectura y aprendizaje.', 2500.00, NOW(), NOW() + INTERVAL '90 days', 'published', 'in_progress', v_img_p_social1, 'Santa Cruz');


    -- --- GRUPO 2: OTROS ESTADOS (PARA PRUEBAS DE ADMIN/CREADOR) - TOTAL 7 ---

    -- 9. En Revisión (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id) VALUES
    (v_user_carlos_id, v_cat_proj_health_id, 'App de Telemedicina', 'app-telemedicina', '<p>Consultas online.</p>', 'Conectando doctores y pacientes.', 10000.00, NOW() + INTERVAL '1 day', NOW() + INTERVAL '60 days', 'in_review', 'not_started', v_img_p_health1);

    -- 10. En Revisión (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id) VALUES
    (v_user_ana_id, v_cat_proj_art_id, 'Festival de Cortometrajes', 'festival-cortos', '<p>Cine independiente.</p>', 'Apoyo a nuevos directores.', 5000.00, NOW() + INTERVAL '5 days', NOW() + INTERVAL '35 days', 'in_review', 'not_started', v_img_p_art1);

    -- 11. Borrador (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, approval_status, campaign_status, cover_image_id) VALUES
    (v_user_marcelo_id, v_cat_proj_tech_id, 'Gadget IoT Hogar (Borrador)', 'gadget-iot-draft', NULL, 'Idea inicial.', NULL, 'draft', 'not_started', v_img_p_tech2);

    -- 12. Borrador (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, approval_status, campaign_status) VALUES
    (v_user_carlos_id, v_cat_proj_env_id, 'Campaña Reciclaje (Draft)', 'reciclaje-draft', NULL, 'Planificando...', 1000.00, 'draft', 'not_started');

    -- 13. Borrador (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, approval_status, campaign_status) VALUES
    (v_user_ana_id, v_cat_proj_social_id, 'Taller de Oficios (Draft)', 'taller-oficios-draft', '<p>Falta completar...</p>', 'Capacitación laboral.', 3000.00, 'draft', 'not_started');

    -- 14. Rechazado (Marcelo) - Requiere observación
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id) VALUES
    (v_user_marcelo_id, v_cat_proj_tech_id, 'Motor de Agua Perpetuo', 'motor-agua', '<p>Energía infinita.</p>', 'Dispositivo de energía libre.', 50000.00, NOW(), NOW() + INTERVAL '30 days', 'rejected', 'not_started', v_img_p_tech1);
    -- Insertar observación del admin
    INSERT INTO projects.project_observation (project_id, admin_id, observation, type) VALUES
    ((SELECT id FROM projects.project WHERE slug = 'motor-agua'), v_user_admin_id, 'Proyecto inviable físicamente. Viola las leyes de la termodinámica.', 'rejection');

    -- 15. Observado (Carlos) - Requiere observación
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, cover_image_id) VALUES
    (v_user_carlos_id, v_cat_proj_social_id, 'Ayuda Genérica', 'ayuda-generica', '<p>Queremos ayudar.</p>', 'Sin detalles claros.', 1000.00, NOW(), NOW() + INTERVAL '30 days', 'observed', 'not_started', v_img_p_social1);
    -- Insertar observación del admin
    INSERT INTO projects.project_observation (project_id, admin_id, observation, type) VALUES
    ((SELECT id FROM projects.project WHERE slug = 'ayuda-generica'), v_user_admin_id, 'Por favor, especificar quiénes son los beneficiarios y cómo se usarán los fondos.', 'observation');


    RAISE NOTICE 'Creación masiva de 15 proyectos completada (8 aprobados).';

    -- =====================================================
    -- 11. INTERACCIONES (Algunas donaciones de prueba)
    -- =====================================================
    -- Melissa dona a la Mochila Solar Pro
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) VALUES
    ((SELECT id FROM projects.project WHERE slug = 'mochila-solar-pro'), v_user_melissa_id, 150.00, 'completed', 'credit_card');

    -- Juan dona al Dron de Ana (entre creadores se apoyan)
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) VALUES
    ((SELECT id FROM projects.project WHERE slug = 'dron-reforestacion'), v_user_juan_id, 50.00, 'completed', 'bank_transfer');

    RAISE NOTICE '--- SEED MASIVO COMPLETADO EXITOSAMENTE ---';
END $$;