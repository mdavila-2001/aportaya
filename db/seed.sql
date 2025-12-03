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
    v_user_juan_id UUID; v_user_maria_id UUID; v_user_pedro_id UUID; v_user_lucia_id UUID;

    -- Categorías de Proyectos
    v_cat_proj_tech_id INT; v_cat_proj_health_id INT; v_cat_proj_social_id INT; v_cat_proj_art_id INT; v_cat_proj_env_id INT;
    
    -- Proyectos (Capturamos IDs para asociar imágenes después)
    v_proj_mochila_id UUID; v_proj_dron_id UUID; v_proj_comedor_id UUID; v_proj_clinica_id UUID; v_proj_murales_id UUID;
    v_proj_limpieza_id UUID; v_proj_impresora_id UUID; v_proj_biblioteca_id UUID; v_proj_telemed_id UUID; v_proj_festival_id UUID;
    v_proj_iot_id UUID; v_proj_reciclaje_id UUID; v_proj_taller_id UUID; v_proj_motor_id UUID; v_proj_ayuda_id UUID;
    
    -- Donaciones
    v_donation_id UUID;
    
    -- Conversaciones
    v_conv_id UUID;

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
    
    -- Usuarios adicionales para donaciones y comentarios
    SELECT users.register_user('Juan', 'Pablo', 'Fernández', '', 'juan@gmail.com', '12345678', 'M', '1990-07-12', NULL, v_role_user_id) INTO v_user_juan_id;
    SELECT users.register_user('María', 'Elena', 'Torres', 'Pérez', 'maria@gmail.com', '12345678', 'F', '1996-11-25', NULL, v_role_user_id) INTO v_user_maria_id;
    SELECT users.register_user('Pedro', '', 'Ramírez', '', 'pedro@gmail.com', '12345678', 'M', '1988-04-08', NULL, v_role_user_id) INTO v_user_pedro_id;
    SELECT users.register_user('Lucía', '', 'Martínez', 'Vargas', 'lucia@gmail.com', '12345678', 'F', '1993-09-30', NULL, v_role_user_id) INTO v_user_lucia_id;

    -- Activar usuarios
    UPDATE users.user SET status = 'active' WHERE id IN (
        v_user_marcelo_id, v_user_carlos_id, v_user_ana_id, v_user_melissa_id,
        v_user_juan_id, v_user_maria_id, v_user_pedro_id, v_user_lucia_id
    );

    RAISE NOTICE 'Usuarios creados y activados (8 usuarios regulares).';

    -- =====================================================
    -- 9. CATEGORÍAS DE PROYECTO Y REQUISITOS
    -- =====================================================
    SELECT projects.create_category('Tecnología', 'tecnologia', 'Innovación y desarrollo') INTO v_cat_proj_tech_id;
    SELECT projects.create_category('Salud', 'salud', 'Proyectos médicos y bienestar') INTO v_cat_proj_health_id;
    SELECT projects.create_category('Social', 'social', 'Impacto comunitario') INTO v_cat_proj_social_id;
    SELECT projects.create_category('Arte', 'arte', 'Expresión creativa') INTO v_cat_proj_art_id;
    SELECT projects.create_category('Medio Ambiente', 'medio_ambiente', 'Sostenibilidad') INTO v_cat_proj_env_id;

    -- Agregar requisitos para Tecnología
    PERFORM projects.add_category_requirements(
        v_cat_proj_tech_id,
        '[
            {"name": "Prototipo Funcional", "value": "Se requiere video demostrativo del prototipo funcionando o evidencia fotográfica del desarrollo."},
            {"name": "Plan Técnico", "value": "Documento de arquitectura técnica o descripción detallada de la implementación (mínimo 200 caracteres)."}
        ]'::jsonb
    );

    -- Agregar requisitos para Salud
    PERFORM projects.add_category_requirements(
        v_cat_proj_health_id,
        '[
            {"name": "Certificación Profesional", "value": "Aval de una institución de salud reconocida o profesional médico certificado."},
            {"name": "Presupuesto Médico", "value": "Desglose detallado de costos médicos, equipamiento o materiales sanitarios."}
        ]'::jsonb
    );

    -- Agregar requisitos para Social
    PERFORM projects.add_category_requirements(
        v_cat_proj_social_id,
        '[
            {"name": "Población Objetivo", "value": "Definición clara de la comunidad o grupo beneficiado con datos demográficos."},
            {"name": "Plan de Impacto", "value": "Descripción de cómo se medirá el impacto social del proyecto."}
        ]'::jsonb
    );

    -- Agregar requisitos para Arte
    PERFORM projects.add_category_requirements(
        v_cat_proj_art_id,
        '[
            {"name": "Portafolio", "value": "Muestra de trabajos previos del artista o colectivo (imágenes, videos o enlaces)."},
            {"name": "Propuesta Creativa", "value": "Descripción detallada del concepto artístico y su mensaje."}
        ]'::jsonb
    );

    -- Agregar requisitos para Medio Ambiente
    PERFORM projects.add_category_requirements(
        v_cat_proj_env_id,
        '[
            {"name": "Estudio de Impacto Ambiental", "value": "Documento o descripción del impacto ambiental positivo esperado."},
            {"name": "Plan de Sostenibilidad", "value": "Estrategia de cómo el proyecto será sostenible a largo plazo."}
        ]'::jsonb
    );

    RAISE NOTICE 'Categorías y requisitos configurados.';

    -- =====================================================
    -- 10. CREACIÓN MASIVA DE PROYECTOS (CORREGIDO)
    -- =====================================================
    -- IMPORTANTE: No se usa 'cover_image_id'. Se inserta el proyecto, se captura su ID,
    -- y luego se inserta la relación en 'projects.project_image'.

    -- --- GRUPO 1: PROYECTOS PUBLICADOS (APROBADOS) ---
    
    -- 1. Tecnología (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_marcelo_id, v_cat_proj_tech_id, 'Mochila Solar Pro', 'mochila-solar-pro', 'Carga todo.', 'Mochila con paneles.', 5000.00, NOW(), NOW() + INTERVAL '60 days', 'published', 'in_progress', 'La Paz') RETURNING id INTO v_proj_mochila_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_mochila_id, v_img_p_tech1, TRUE);
    
    -- 2. Tecnología (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_ana_id, v_cat_proj_tech_id, 'Dron de Reforestación', 'dron-reforestacion', 'Planta árboles.', 'Drones autónomos.', 15000.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'published', 'in_progress', 'Cochabamba') RETURNING id INTO v_proj_dron_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_dron_id, v_img_p_tech2, TRUE);

    -- 3. Social (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_carlos_id, v_cat_proj_social_id, 'Comedor Los Niños', 'comedor-los-ninos', 'Alimento diario.', 'Comedor gratuito.', 3000.00, NOW(), NOW() + INTERVAL '45 days', 'published', 'in_progress', 'El Alto') RETURNING id INTO v_proj_comedor_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_comedor_id, v_img_p_social1, TRUE);

    -- 4. Salud (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_ana_id, v_cat_proj_health_id, 'Clínica Móvil Rural', 'clinica-movil-rural', 'Salud accesible.', 'Atención médica rural.', 20000.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 'published', 'in_progress', 'Potosí') RETURNING id INTO v_proj_clinica_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_clinica_id, v_img_p_health1, TRUE);

    -- 5. Arte (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_marcelo_id, v_cat_proj_art_id, 'Murales Urbanos', 'murales-urbanos', 'Color en la ciudad.', 'Embellecimiento urbano.', 1500.00, NOW(), NOW() + INTERVAL '30 days', 'published', 'in_progress', 'Sucre') RETURNING id INTO v_proj_murales_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_murales_id, v_img_p_art1, TRUE);

    -- 6. Medio Ambiente (Carlos) - Finalizado exitoso
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, raised_amount, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_carlos_id, v_cat_proj_env_id, 'Limpieza Lago Uru Uru', 'limpieza-uru-uru', 'Recuperemos el lago.', 'Limpieza de plásticos.', 8000.00, 8500.00, NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day', 'published', 'finished', 'Oruro') RETURNING id INTO v_proj_limpieza_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_limpieza_id, v_img_p_social2, TRUE);

    -- 7. Tecnología (Ana) - Pausado
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_ana_id, v_cat_proj_tech_id, 'Impresora 3D Educativa', 'impresora-3d-edu', 'Para escuelas.', 'Kit de impresora 3D.', 4000.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days', 'published', 'paused', 'Tarija') RETURNING id INTO v_proj_impresora_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_impresora_id, v_img_p_tech1, TRUE);

    -- 8. Social (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status, location) 
    VALUES (v_user_marcelo_id, v_cat_proj_social_id, 'Biblioteca Barrial', 'biblioteca-barrial', 'Libros para todos.', 'Espacio de lectura.', 2500.00, NOW(), NOW() + INTERVAL '90 days', 'published', 'in_progress', 'Santa Cruz') RETURNING id INTO v_proj_biblioteca_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_biblioteca_id, v_img_p_social1, TRUE);


    -- --- GRUPO 2: OTROS ESTADOS ---

    -- 9. En Revisión (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_carlos_id, v_cat_proj_health_id, 'App de Telemedicina', 'app-telemedicina', 'Consultas online.', 'Conectando doctores.', 10000.00, NOW() + INTERVAL '1 day', NOW() + INTERVAL '60 days', 'in_review', 'not_started') RETURNING id INTO v_proj_telemed_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_telemed_id, v_img_p_health1, TRUE);

    -- 10. En Revisión (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_ana_id, v_cat_proj_art_id, 'Festival de Cortometrajes', 'festival-cortos', 'Cine independiente.', 'Apoyo a directores.', 5000.00, NOW() + INTERVAL '5 days', NOW() + INTERVAL '35 days', 'in_review', 'not_started') RETURNING id INTO v_proj_festival_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_festival_id, v_img_p_art1, TRUE);

    -- 11. Borrador (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status)
    VALUES (v_user_marcelo_id, v_cat_proj_tech_id, 'Gadget IoT Hogar (Borrador)', 'gadget-iot-draft', '', 'Idea inicial.', 500.00, NOW(), NOW() + INTERVAL '30 days', 'draft', 'not_started') RETURNING id INTO v_proj_iot_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_iot_id, v_img_p_tech2, TRUE);

    -- 12. Borrador (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status)
    VALUES (v_user_carlos_id, v_cat_proj_env_id, 'Campaña Reciclaje (Draft)', 'reciclaje-draft', '', 'Planificando...', 500.00, NOW(), NOW() + INTERVAL '30 days', 'draft', 'not_started') RETURNING id INTO v_proj_reciclaje_id;

    -- 13. Borrador (Ana)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status)
    VALUES (v_user_ana_id, v_cat_proj_social_id, 'Taller de Oficios (Draft)', 'taller-oficios-draft', 'Falta completar...', 'Capacitación.', 3000.00, NOW(), NOW() + INTERVAL '30 days', 'draft', 'not_started') RETURNING id INTO v_proj_taller_id;

    -- 14. Rechazado (Marcelo)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_marcelo_id, v_cat_proj_tech_id, 'Motor de Agua Perpetuo', 'motor-agua', 'Energía infinita.', 'Dispositivo imposible.', 50000.00, NOW(), NOW() + INTERVAL '30 days', 'rejected', 'not_started') RETURNING id INTO v_proj_motor_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_motor_id, v_img_p_tech1, TRUE);
    INSERT INTO projects.project_observation (project_id, admin_id, note) VALUES (v_proj_motor_id, v_user_admin_id, 'Proyecto inviable físicamente.');

    -- 15. Observado (Carlos)
    INSERT INTO projects.project (creator_id, category_id, title, slug, description, summary, financial_goal, start_date, end_date, approval_status, campaign_status) 
    VALUES (v_user_carlos_id, v_cat_proj_social_id, 'Ayuda Genérica', 'ayuda-generica', 'Queremos ayudar.', 'Sin detalles.', 1000.00, NOW(), NOW() + INTERVAL '30 days', 'observed', 'not_started') RETURNING id INTO v_proj_ayuda_id;
    INSERT INTO projects.project_image (project_id, image_id, is_cover) VALUES (v_proj_ayuda_id, v_img_p_social1, TRUE);
    INSERT INTO projects.project_observation (project_id, admin_id, note) VALUES (v_proj_ayuda_id, v_user_admin_id, 'Por favor, especificar beneficiarios.');

    RAISE NOTICE 'Creación masiva de 15 proyectos completada (8 aprobados).';

    -- =====================================================
    -- 11. INTERACCIONES SOCIALES Y DONACIONES
    -- =====================================================
    
    -- ========== DONACIONES ==========
    RAISE NOTICE 'Creando donaciones...';
    
    -- Donaciones para Mochila Solar Pro
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_mochila_id, v_user_melissa_id, 150.00, 'completed', 'credit_card');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_mochila_id, v_user_juan_id, 200.00, 'completed', 'bank_transfer');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_mochila_id, v_user_maria_id, 50.00, 'completed', 'credit_card');

    -- Donaciones para Dron de Reforestación
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_dron_id, v_user_marcelo_id, 500.00, 'completed', 'bank_transfer');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_dron_id, v_user_pedro_id, 300.00, 'completed', 'credit_card');

    -- Donaciones para Comedor Los Niños
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_comedor_id, v_user_ana_id, 300.00, 'completed', 'credit_card');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_comedor_id, v_user_lucia_id, 100.00, 'completed', 'bank_transfer');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_comedor_id, v_user_melissa_id, 200.00, 'completed', 'credit_card');

    -- Donaciones para Clínica Móvil Rural
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_clinica_id, v_user_carlos_id, 500.00, 'completed', 'bank_transfer');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_clinica_id, v_user_juan_id, 350.00, 'completed', 'credit_card');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_clinica_id, v_user_maria_id, 250.00, 'completed', 'bank_transfer');

    -- Donaciones para Murales Urbanos
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_murales_id, v_user_melissa_id, 100.00, 'completed', 'credit_card');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_murales_id, v_user_pedro_id, 75.00, 'completed', 'credit_card');

    -- Donaciones para Limpieza Lago (proyecto finalizado)
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_limpieza_id, v_user_ana_id, 1000.00, 'completed', 'bank_transfer');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_limpieza_id, v_user_marcelo_id, 1500.00, 'completed', 'credit_card');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_limpieza_id, v_user_carlos_id, 2000.00, 'completed', 'bank_transfer');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_limpieza_id, v_user_lucia_id, 2000.00, 'completed', 'credit_card');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_limpieza_id, v_user_juan_id, 1500.00, 'completed', 'bank_transfer');
    
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_limpieza_id, v_user_maria_id, 500.00, 'completed', 'credit_card');

    -- Donaciones para Biblioteca Barrial
    INSERT INTO payments.donation (project_id, user_id, amount, payment_status, payment_method) 
    VALUES (v_proj_biblioteca_id, v_user_pedro_id, 150.00, 'completed', 'credit_card');

    RAISE NOTICE 'Donaciones creadas (20 donaciones). El raised_amount se actualiza automáticamente por trigger.';

    -- ========== COMENTARIOS ==========
    RAISE NOTICE 'Creando comentarios en proyectos...';
    
    -- Comentarios en Mochila Solar Pro
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_mochila_id, v_user_melissa_id, '¡Excelente proyecto! Me encanta la idea de usar energía solar para cargar dispositivos.');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_mochila_id, v_user_juan_id, 'Perfecto para excursionistas. ¿Cuánto tiempo tarda en cargar un celular?');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_mochila_id, v_user_maria_id, 'Ya doné. Espero ver el prototipo pronto.');

    -- Comentarios en Dron de Reforestación
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_dron_id, v_user_pedro_id, 'Innovación que realmente ayuda al planeta. Gran iniciativa.');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_dron_id, v_user_carlos_id, '¿Tienen plan para expandir esto a otras regiones del país?');

    -- Comentarios en Comedor Los Niños
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_comedor_id, v_user_lucia_id, 'Hermoso proyecto social. ¿Cómo puedo colaborar como voluntaria?');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_comedor_id, v_user_ana_id, 'Esto es lo que necesita nuestra comunidad. Felicitaciones.');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_comedor_id, v_user_melissa_id, 'Apoyando proyectos que alimentan a niños. ¡Éxito!');

    -- Comentarios en Clínica Móvil Rural
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_clinica_id, v_user_juan_id, 'Salud para todos. Este proyecto puede salvar vidas.');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_clinica_id, v_user_marcelo_id, '¿Qué especialidades médicas estarán disponibles?');

    -- Comentarios en Murales Urbanos
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_murales_id, v_user_pedro_id, 'El arte urbano transforma ciudades. Gran idea.');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_murales_id, v_user_maria_id, '¿Habrá participación de la comunidad en el diseño?');

    -- Comentarios en Limpieza Lago (proyecto finalizado)
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_limpieza_id, v_user_carlos_id, '¡Felicitaciones por completar la meta! Orgullo boliviano.');
    
    INSERT INTO social.comment (project_id, user_id, content) 
    VALUES (v_proj_limpieza_id, v_user_lucia_id, 'Gracias por cuidar nuestro medio ambiente.');

    RAISE NOTICE 'Comentarios creados (14 comentarios).';

    -- ========== FAVORITOS ==========
    RAISE NOTICE 'Creando favoritos...';
    
    INSERT INTO social.favorite (user_id, project_id) VALUES
    (v_user_melissa_id, v_proj_mochila_id),
    (v_user_melissa_id, v_proj_comedor_id),
    (v_user_melissa_id, v_proj_murales_id),
    (v_user_juan_id, v_proj_mochila_id),
    (v_user_juan_id, v_proj_clinica_id),
    (v_user_maria_id, v_proj_dron_id),
    (v_user_maria_id, v_proj_comedor_id),
    (v_user_pedro_id, v_proj_dron_id),
    (v_user_pedro_id, v_proj_murales_id),
    (v_user_pedro_id, v_proj_limpieza_id),
    (v_user_lucia_id, v_proj_comedor_id),
    (v_user_lucia_id, v_proj_clinica_id),
    (v_user_carlos_id, v_proj_limpieza_id),
    (v_user_ana_id, v_proj_comedor_id),
    (v_user_marcelo_id, v_proj_dron_id);

    RAISE NOTICE 'Favoritos creados (15 favoritos).';

    -- ========== ACTUALIZACIONES DE PROYECTOS ==========
    RAISE NOTICE 'Creando actualizaciones de proyectos...';
    
    -- Updates para Mochila Solar Pro
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_mochila_id, 'Prototipo en desarrollo', 
    'Hemos completado el diseño del circuito solar. Próximamente fotos del prototipo.');
    
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_mochila_id, '¡Gracias por el apoyo!', 
    'Ya alcanzamos el 10% de la meta en solo una semana. Estamos muy agradecidos con todos ustedes.');

    -- Updates para Dron de Reforestación
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_dron_id, 'Primera prueba de vuelo exitosa', 
    'El dron completó su primer vuelo de prueba dispersando semillas. Video próximamente.');
    
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_dron_id, 'Alianza con ONG ambiental', 
    'Firmamos acuerdo con una ONG local para expandir el alcance del proyecto.');

    -- Updates para Comedor Los Niños
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_comedor_id, 'Local asegurado', 
    'Ya tenemos el espacio para el comedor. Ahora necesitamos equipamiento de cocina.');
    
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_comedor_id, 'Menú nutricional diseñado', 
    'Con ayuda de nutricionistas, diseñamos un menú balanceado para los niños.');

    -- Updates para Clínica Móvil Rural
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_clinica_id, 'Vehículo adquirido', 
    'Conseguimos el vehículo que será adaptado como clínica móvil.');
    
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_clinica_id, 'Médicos voluntarios confirmados', 
    '5 médicos se han sumado como voluntarios para las jornadas médicas.');

    -- Updates para Murales Urbanos
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_murales_id, 'Diseños finalizados', 
    'Los diseños de los murales están listos. ¡Pronto comenzamos a pintar!');

    -- Updates para Limpieza Lago (proyecto finalizado)
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_limpieza_id, '¡Proyecto completado!', 
    'Gracias a todos retiramos 5 toneladas de plástico del lago. ¡Misión cumplida!');
    
    INSERT INTO social.update (project_id, title, content) 
    VALUES (v_proj_limpieza_id, 'Informe final', 
    'Pueden ver el informe completo con fotos del antes y después en nuestro sitio web.');

    RAISE NOTICE 'Actualizaciones de proyectos creadas (11 updates).';

    -- ========== CONVERSACIONES Y MENSAJES ==========
    RAISE NOTICE 'Creando conversaciones y mensajes...';
    
    -- Conversación: Melissa pregunta a Marcelo sobre Mochila Solar
    INSERT INTO messaging.conversation (project_id, created_by, status)
    VALUES (v_proj_mochila_id, v_user_melissa_id, 'active')
    RETURNING id INTO v_conv_id;
    
    INSERT INTO messaging.message (conversation_id, sender_id, content, read) VALUES
    (v_conv_id, v_user_melissa_id, '¡Hola Marcelo! Me encanta tu proyecto. ¿Cuándo estará listo el prototipo?', TRUE),
    (v_conv_id, v_user_marcelo_id, 'Hola Melissa, gracias por tu apoyo. Estimamos tenerlo en 2 meses.', TRUE),
    (v_conv_id, v_user_melissa_id, '¡Excelente! ¿Planeas producirlo en serie?', FALSE);

    -- Conversación: Juan pregunta a Ana sobre Dron
    INSERT INTO messaging.conversation (project_id, created_by, status)
    VALUES (v_proj_dron_id, v_user_juan_id, 'active')
    RETURNING id INTO v_conv_id;
    
    INSERT INTO messaging.message (conversation_id, sender_id, content, read) VALUES
    (v_conv_id, v_user_juan_id, 'Ana, ¿qué tipo de semillas usarán en el dron?', TRUE),
    (v_conv_id, v_user_ana_id, 'Usaremos especies nativas de la región. Ya tenemos el listado.', TRUE);

    -- Conversación: Lucia pregunta a Carlos sobre Comedor
    INSERT INTO messaging.conversation (project_id, created_by, status)
    VALUES (v_proj_comedor_id, v_user_lucia_id, 'active')
    RETURNING id INTO v_conv_id;
    
    INSERT INTO messaging.message (conversation_id, sender_id, content, read) VALUES
    (v_conv_id, v_user_lucia_id, 'Carlos, me gustaría ser voluntaria. ¿Cómo puedo ayudar?', TRUE),
    (v_conv_id, v_user_carlos_id, '¡Genial! Te envío el formulario de voluntarios por correo.', FALSE);

    -- Conversación: Pedro pregunta a Ana sobre Clínica
    INSERT INTO messaging.conversation (project_id, created_by, status)
    VALUES (v_proj_clinica_id, v_user_pedro_id, 'active')
    RETURNING id INTO v_conv_id;
    
    INSERT INTO messaging.message (conversation_id, sender_id, content, read) VALUES
    (v_conv_id, v_user_pedro_id, '¿Qué comunidades atenderán primero?', TRUE),
    (v_conv_id, v_user_ana_id, 'Comenzaremos por las comunidades más alejadas de Potosí.', TRUE),
    (v_conv_id, v_user_pedro_id, 'Perfecto, conozco a médicos que podrían sumarse.', TRUE),
    (v_conv_id, v_user_ana_id, '¡Excelente! Por favor contáctame por email para coordinar.', FALSE);

    RAISE NOTICE 'Conversaciones y mensajes creados (4 conversaciones, 12 mensajes).';

    RAISE NOTICE '--- SEED MASIVO COMPLETADO EXITOSAMENTE ---';
END $$;
