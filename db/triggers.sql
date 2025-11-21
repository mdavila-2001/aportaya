-- ================================================================
-- SEED DE DATOS COMPLETO Y MASIVO - AportaYa (CORREGIDO)
-- ================================================================
-- 1. LIMPIEZA TOTAL
TRUNCATE TABLE 
    roles.user_role, roles.role_ability, roles.ability, roles.module, roles.role_category, roles.role,
    audit.audit_log, messaging.message, messaging.conversation, social.favorite, social.report, social.update, social.comment,
    payments.webhook_event, payments.payment_transaction, payments.donation,
    projects.project_image, -- Se agrego esta tabla para limpieza
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
    v_user_marcelo_id UUID; v_user_carlos_id UUID; v_user_ana_id UUID; v_user_melissa_id UUID;

    -- Categorías de Proyectos
    v_cat_proj_tech_id INT; v_cat_proj_health_id INT; v_cat_proj_social_id INT; v_cat_proj_art_id INT; v_cat_proj_env_id INT;
    
    -- Proyectos (Capturamos IDs para asociar imágenes después)
    v_proj_mochila_id UUID; v_proj_dron_id UUID; v_proj_comedor_id UUID; v_proj_clinica_id UUID; v_proj_murales_id UUID;
    v_proj_limpieza_id UUID; v_proj_impresora_id UUID; v_proj_biblioteca_id UUID; v_proj_telemed_id UUID; v_proj_festival_id UUID;
    v_proj_iot_id UUID; v_proj_reciclaje_id UUID; v_proj_taller_id UUID; v_proj_motor_id UUID; v_proj_ayuda_id UUID;

BEGIN
    RAISE NOTICE '--- INICIANDO SEED MASIVO (CORREGIDO) ---';

    -- =====================================================
    -- 2 - 6. CONFIGURACIÓN DE ROLES Y PERMISOS (Igual que antes)
    -- =====================================================
    -- ... (Este bloque permanece idéntico al anterior, lo omito para brevedad pero DEBE ESTAR) ...
    -- INICIO DEL BLOQUE OMITIDO
    SELECT roles.create_role_category('Administración', 'Funciones exclusivas para administradores') INTO v_cat_role_admin;
    SELECT roles.create_role_category('Plataforma', 'Funcionalidades para usuarios') INTO v_cat_role_platform;

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

    PERFORM roles.create_ability('find', 'Ver Administradores', v_mod_admin);
    PERFORM roles.create_ability('update', 'Actualizar Administradores', v_mod_admin);
    PERFORM roles.create_ability('create', 'Crear Administradores', v_mod_admin);
    PERFORM roles.create_ability('kill', 'Eliminar Administradores', v_mod_admin);

    PERFORM roles.create_ability('find', 'Ver Usuarios', v_mod_users);
    PERFORM roles.create_ability('update', 'Actualizar Usuarios', v_mod_users);
    PERFORM roles.create_ability('create', 'Crear Usuarios', v_mod_users);
    PERFORM roles.create_ability('kill', 'Eliminar Usuarios', v_mod_users);
    PERFORM roles.create_ability('suspend', 'Suspender Usuarios', v_mod_users);

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
    PERFORM roles.create_ability('manage_campaign', 'Gestionar Campaña', v_mod_my_proj);

    PERFORM roles.create_ability('view', 'Ver Donaciones', v_mod_donations);
    PERFORM roles.create_ability('donate', 'Donar', v_mod_donations);
    
    PERFORM roles.create_ability('view', 'Ver Perfil', v_mod_profile);
    PERFORM roles.create_ability('update', 'Editar Perfil', v_mod_profile);

    PERFORM roles.create_ability('comment', 'Comentar', v_mod_comments);
    
    PERFORM roles.create_ability('add', 'Agregar a Mis Favoritos', v_mod_favorites);
    PERFORM roles.create_ability('remove', 'Borrar de Mis Favoritos', v_mod_favorites);

    SELECT roles.create_role('Administrador') INTO v_role_admin_id;
    SELECT roles.create_role('Usuario') INTO v_role_user_id;

    INSERT INTO roles.role_ability (role_id, ability_id)
    SELECT v_role_admin_id, id FROM roles.ability;

    INSERT INTO roles.role_ability (role_id, ability_id)
    SELECT v_role_user_id, a.id
    FROM roles.ability a
    JOIN roles.module m ON a.module_id = m.id
    WHERE m.category_id = v_cat_role_platform;

    RAISE NOTICE 'Sistema de Roles y Permisos configurado.';
    -- FIN DEL BLOQUE OMITIDO

    -- =====================================================
    -- 7. CREAR IMÁGENES BASE
    -- =====================================================
    -- Avatares
    SELECT files.create_image('admin_av', '/uploads/avatar/admin.png', 'Admin', FALSE) INTO v_img_admin_id;
    SELECT files.create_image('marcelo_av', '/uploads/avatar/marcelo.png', 'Marcelo', FALSE) INTO v_img_marcelo_id;
    SELECT files.create_image('melissa_av', '/uploads/avatar/melissa.png', 'Melissa', FALSE) INTO v_img_melissa_id;
    SELECT files.create_image('carlos_av', '/uploads/avatar/carlos.png', 'Carlos', FALSE) INTO v_img_carlos_id;
    SELECT files.create_image('ana_av', '/uploads/avatar/ana.png', 'Ana', FALSE) INTO v_img_ana_id;

    -- Portadas de Proyectos
    SELECT files.create_image('p_tech1', '/uploads/projects/tech1.png', 'Tech 1', FALSE) INTO v_img_p_tech1;
    SELECT files.create_image('p_tech2', '/uploads/projects/tech2.png', 'Tech 2', FALSE) INTO v_img_p_tech2;
    SELECT files.create_image('p_social1', '/uploads/projects/social1.png', 'Social 1', FALSE) INTO v_img_p_social1;
    SELECT files.create_image('p_social2', '/uploads/projects/social2.png', 'Social 2', FALSE) INTO v_img_p_social2;
    SELECT files.create_image('p_art1', '/uploads/projects/art1.png', 'Art 1', FALSE) INTO v_img_p_art1;
    SELECT files.create_image('p_health1', '/uploads/projects/health1.png', 'Health 1', FALSE) INTO v_img_p_health1;

    -- =====================================================
    -- 8. CREAR USUARIOS
    -- =====================================================
    -- Admin
    SELECT users.create_admin('Super', '', 'Admin', '', 'admin@aportaya.com', '12345678', 'M', '1990-01-01', v_img_admin_id, v_role_admin_id) INTO v_user_admin_id;
    
    -- Creadores y Donantes
    SELECT users.register_user('Danny', 'Marcelo', 'Dávila', 'Barrancos', 'marcelo@gmail.com', '12345678', 'M', '1995-05-20', v_img_marcelo_id, v_role_user_id) INTO v_user_marcelo_id;
    SELECT users.register_user('Carlos', '', 'López', 'Sánchez', 'carlos@gmail.com', '12345678', 'M', '1992-08-15', v_img_carlos_id, v_role_user_id) INTO v_user_carlos_id;
    SELECT users.register_user('Ana', '', 'García', '', 'ana@gmail.com', '12345678', 'F', '1998-03-10', v_img_ana_id, v_role_user_id) INTO v_user_ana_id;
    SELECT users.register_user('Alejandra', 'Melissa', 'Rocha', 'Villegas', 'melissa@gmail.com', '12345678', 'F', '1994-03-31', v_img_melissa_id, v_role_user_id) INTO v_user_melissa_id;

    -- Activar usuarios
    UPDATE users.user SET status = 'active' WHERE id IN (v_user_marcelo_id, v_user_carlos_id, v_user_ana_id, v_user_melissa_id);

    RAISE NOTICE 'Usuarios creados y activados.';

    -- =====================================================
    -- 9. CATEGORÍAS DE PROYECTO Y REQUISITOS
    -- =====================================================
    SELECT projects.create_category('Tecnología', 'tecnologia', 'Innovación y desarrollo') INTO v_cat_proj_tech_id;
    SELECT projects.create_category('Salud', 'salud', 'Proyectos médicos y bienestar') INTO v_cat_proj_health_id;
    SELECT projects.create_category('Social', 'social', 'Impacto comunitario') INTO v_cat_proj_social_id;
    SELECT projects.create_category('Arte', 'arte', 'Expresión creativa') INTO v_cat_proj_art_id;
    SELECT projects.create_category('Medio Ambiente', 'medio_ambiente', 'Sostenibilidad') INTO v_cat_proj_env_id;

    INSERT INTO projects.category_requirements (category_id, requirement_name, requirement_value) VALUES
    (v_cat_proj_tech_id, 'Prototipo Funcional', 'Se requiere video demostrativo.'),
    (v_cat_proj_tech_id, 'Plan Técnico', 'Documento de arquitectura técnica.'),
    (v_cat_proj_health_id, 'Certificación Profesional', 'Aval de una institución de salud reconocida.'),
    (v_cat_proj_social_id, 'Población Objetivo', 'Definición clara de la comunidad beneficiada.'),
    (v_cat_proj_art_id, 'Portafolio', 'Muestra de trabajos previos del artista.'),
    (v_cat_proj_env_id, 'Estudio de Impacto Ambiental', 'Documento aprobado.');

    RAISE NOTICE 'Categorías y requisitos configurados.';

    -- =====================================================
    -- 10. CREACIÓN MASIVA DE PROYECTOS (CORREGIDO)
    -- =====================================================
    -- IMPORTANTE: No se usa 'cover_image_id'. Se inserta el proyecto, se captura su ID,
    -- y luego se inserta la relación en 'projects.project_image'.

    -- --- GRUPO 1: PROYECTOS PUBLICADOS (APROBADOS) ---
    
    -- 1. Tecnología (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_marcelo_id, v_cat_proj_tech_id, 'Mochila Solar Pro', 'mochila-solar-pro', '<p>Carga todo.</p>', 'Mochila con paneles.', 5000.00, NOW(), NOW() + INTERVAL '60 days', 'published', 'in_progress', 'La Paz') RETURNING id INTO v_proj_mochila_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_mochila_id, v_img_p_tech1, TRUE);
    
    -- 2. Tecnología (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_ana_id, v_cat_proj_tech_id, 'Dron de Reforestación', 'dron-reforestacion', '<p>Planta árboles.</p>', 'Drones autónomos.', 15000.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'published', 'in_progress', 'Cochabamba') RETURNING id INTO v_proj_dron_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_dron_id, v_img_p_tech2, TRUE);

    -- 3. Social (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_carlos_id, v_cat_proj_social_id, 'Comedor Los Niños', 'comedor-los-ninos', '<p>Alimento diario.</p>', 'Comedor gratuito.', 3000.00, NOW(), NOW() + INTERVAL '45 days', 'published', 'in_progress', 'El Alto') RETURNING id INTO v_proj_comedor_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_comedor_id, v_img_p_social1, TRUE);

    -- 4. Salud (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_ana_id, v_cat_proj_health_id, 'Clínica Móvil Rural', 'clinica-movil-rural', '<p>Salud accesible.</p>', 'Atención médica rural.', 20000.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 'published', 'in_progress', 'Potosí') RETURNING id INTO v_proj_clinica_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_clinica_id, v_img_p_health1, TRUE);

    -- 5. Arte (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_marcelo_id, v_cat_proj_art_id, 'Murales Urbanos', 'murales-urbanos', '<p>Color en la ciudad.</p>', 'Embellecimiento urbano.', 1500.00, NOW(), NOW() + INTERVAL '30 days', 'published', 'in_progress', 'Sucre') RETURNING id INTO v_proj_murales_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_murales_id, v_img_p_art1, TRUE);

    -- 6. Medio Ambiente (Carlos) - Finalizado exitoso
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, raised_amount, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_carlos_id, v_cat_proj_env_id, 'Limpieza Lago Uru Uru', 'limpieza-uru-uru', '<p>Recuperemos el lago.</p>', 'Limpieza de plásticos.', 8000.00, 8500.00, NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day', 'published', 'finished', 'Oruro') RETURNING id INTO v_proj_limpieza_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_limpieza_id, v_img_p_social2, TRUE);

    -- 7. Tecnología (Ana) - Pausado
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_ana_id, v_cat_proj_tech_id, 'Impresora 3D Educativa', 'impresora-3d-edu', '<p>Para escuelas.</p>', 'Kit de impresora 3D.', 4000.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days', 'published', 'paused', 'Tarija') RETURNING id INTO v_proj_impresora_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_impresora_id, v_img_p_tech1, TRUE);

    -- 8. Social (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_marcelo_id, v_cat_proj_social_id, 'Biblioteca Barrial', 'biblioteca-barrial', '<p>Libros para todos.</p>', 'Espacio de lectura.', 2500.00, NOW(), NOW() + INTERVAL '90 days', 'published', 'in_progress', 'Santa Cruz') RETURNING id INTO v_proj_biblioteca_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_biblioteca_id, v_img_p_social1, TRUE);


    -- --- GRUPO 2: OTROS ESTADOS ---

    -- 9. En Revisión (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_carlos_id, v_cat_proj_health_id, 'App de Telemedicina', 'app-telemedicina', '<p>Consultas online.</p>', 'Conectando doctores.', 10000.00, NOW() + INTERVAL '1 day', NOW() + INTERVAL '60 days', 'in_review', 'not_started') RETURNING id INTO v_proj_telemed_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_telemed_id, v_img_p_health1, TRUE);

    -- 10. En Revisión (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_ana_id, v_cat_proj_art_id, 'Festival de Cortometrajes', 'festival-cortos', '<p>Cine independiente.</p>', 'Apoyo a directores.', 5000.00, NOW() + INTERVAL '5 days', NOW() + INTERVAL '35 days', 'in_review', 'not_started') RETURNING id INTO v_proj_festival_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_festival_id, v_img_p_art1, TRUE);

    -- 11. Borrador (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status)
    VALUES (v_user_marcelo_id, v_cat_proj_tech_id, 'Gadget IoT Hogar (Borrador)', 'gadget-iot-draft', '', 'Idea inicial.', 50.00, NOW(), NOW() + INTERVAL '30 days', 'draft', 'not_started') RETURNING id INTO v_proj_iot_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_iot_id, v_img_p_tech2, TRUE);

    -- 12. Borrador (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status)
    VALUES (v_user_carlos_id, v_cat_proj_env_id, 'Campaña Reciclaje (Draft)', 'reciclaje-draft', '', 'Planificando...', 50.00, NOW(), NOW() + INTERVAL '30 days', 'draft', 'not_started') RETURNING id INTO v_proj_reciclaje_id;

    -- 13. Borrador (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status)
    VALUES (v_user_ana_id, v_cat_proj_social_id, 'Taller de Oficios (Draft)', 'taller-oficios-draft', '<p>Falta completar...</p>', 'Capacitación.', 3000.00, NOW(), NOW() + INTERVAL '30 days', 'draft', 'not_started') RETURNING id INTO v_proj_taller_id;

    -- 14. Rechazado (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_marcelo_id, v_cat_proj_tech_id, 'Motor de Agua Perpetuo', 'motor-agua', '<p>Energía infinita.</p>', 'Dispositivo imposible.', 50000.00, NOW(), NOW() + INTERVAL '30 days', 'rejected', 'not_started') RETURNING id INTO v_proj_motor_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_motor_id, v_img_p_tech1, TRUE);
    INSERT INTO projects.project_observation (project_id, admin_id, note) VALUES (v_proj_motor_id, v_user_admin_id, 'Proyecto inviable físicamente.');

    -- 15. Observado (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_carlos_id, v_cat_proj_social_id, 'Ayuda Genérica', 'ayuda-generica', '<p>Queremos ayudar.</p>', 'Sin detalles.', 1000.00, NOW(), NOW() + INTERVAL '30 days', 'observed', 'not_started') RETURNING id INTO v_proj_ayuda_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_ayuda_id, v_img_p_social1, TRUE);
    INSERT INTO projects.project_observation (project_id, admin_id, note) VALUES (v_proj_ayuda_id, v_user_admin_id, 'Por favor, especificar beneficiarios.');

    RAISE NOTICE 'Creación masiva de 15 proyectos completada (8 aprobados).';

    -- =====================================================
    -- 11. INTERACCIONES (Donaciones)
    -- =====================================================
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) VALUES
    (v_proj_mochila_id, v_user_melissa_id, 150.00, 'completed', 'credit_card');

    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) VALUES
    (v_proj_dron_id, v_user_marcelo_id, 50.00, 'completed', 'bank_transfer');

    RAISE NOTICE '--- SEED MASIVO COMPLETADO EXITOSAMENTE ---';
END $$;

select * from projects.project p 