TRUNCATE TABLE 
    roles.user_role,
    roles.role_ability,
    roles.ability,
    roles.module,
    roles.role_category,
    roles.role,
    audit.audit_log,
    messaging.message,
    messaging.conversation,
    social.favorite,
    social.report,
    social.update,
    social.comment,
    payments.webhook_event,
    payments.payment_transaction,
    payments.donation,
    projects.project_observation,
    projects.project_status_history,
    projects.project_approval_history,
    projects.category_requirements,
    projects.project,
    projects.category,
    users.password_reset_token,
    users.email_verification_token,
    users.user_status_history,
    users.user,
    files.image
RESTART IDENTITY CASCADE;

-- =====================================================
--                 CATEGORÍAS EN ROLES
-- =====================================================


-- Módulo del sistema
select roles.create_role_category(
	'Administración',
	'Funciones exclusivas para administradores'
);

-- Módulo de contenido
select roles.create_role_category(
	'Plataforma',
	'Funcionalidades para usuarios'
);

select * from roles.role_category rc 

-- =====================================================
--                  MÓDULOS EN ROLES
-- =====================================================

-- Módulos de Administración (categoría 1)
select roles.create_module(
	'Administradores',
	1
);

select roles.create_module(
	'Gestión de Usuarios',
	1
);

select roles.create_module(
	'Gestión de Categorías de Proyectos',
	1
);

select roles.create_module(
	'Gestión de Proyectos',
	1
);

select roles.create_module(
	'Estadísticas',
	1
);

-- Módulos de Plataforma (Categoría 2)
select roles.create_module(
	'Mis Proyectos',
	2
);

select roles.create_module(
	'Donaciones',
	2
);

select roles.create_module(
	'Perfil',
	2
);

select roles.create_module(
	'Comentarios',
	2
);

select roles.create_module(
	'Favoritos',
	2
);

select * from roles."module" m 

-- ========================================
-- 3. HABILIDADES (PERMISOS) POR MÓDULO
-- ========================================

-- Módulo Administradores (1)
select roles.create_ability(
	'find',
	'Ver Administradores',
	1
);

select roles.create_ability(
	'update',
	'Actualizar Administradores',
	1
);

select roles.create_ability(
	'create',
	'Crear Administradores',
	1
);

select roles.create_ability(
	'kill',
	'Eliminar Administradores',
	1
);

-- Módulo Gestión de Usuarios (2)
select roles.create_ability(
	'find',
	'Ver Usuarios',
	2
);

select roles.create_ability(
	'update',
	'Actualizar Usuarios',
	2
);

select roles.create_ability(
	'create',
	'Crear Usuarios',
	2
);

select roles.create_ability(
	'kill',
	'Eliminar Usuarios',
	2
);

-- Módulos de Gestión de Categorías de Proyectos (3)
select roles.create_ability(
	'find',
	'Ver Categorías',
	3
);

select roles.create_ability(
	'update',
	'Actualizar Categorías',
	3
);

select roles.create_ability(
	'create',
	'Crear Categorías',
	3
);

select roles.create_ability(
	'kill',
	'Eliminar Categorías',
	3
);

-- Módulo de Gestión de Proyectos (4)
select roles.create_ability(
	'read',
	'Ver Proyectos',
	4
);

select roles.create_ability(
	'approve',
	'Aprobar Proyectos',
	4
);

select roles.create_ability(
	'reject',
	'Rechazar Proyectos',
	4
);

select roles.create_ability(
	'observe',
	'Observar proyectos',
	3
);

-- Módulo de Estadísticas (5)
select roles.create_ability(
	'check',
	'Ver Estadísticas',
	5
);

select roles.create_ability(
	'export',
	'Exportar Estadísticas',
	5
);

-- Módulo de Mis Proyectos (6)
select roles.create_ability(
	'find',
	'Ver Mis Proyectos',
	6
);

select roles.create_ability(
	'update',
	'Actualizar Mis Proyectos',
	6
);

select roles.create_ability(
	'create',
	'Crear Proyecto',
	6
);

select roles.create_ability(
	'kill',
	'Eliminar Campaña',
	6
);

-- Módulo Donaciones (7)
select roles.create_ability(
	'view',
	'Ver Donaciones',
	7
);

select roles.create_ability(
	'donate',
	'Donar',
	7
);

select roles.create_ability(
	'refund',
	'Reembolsar',
	7
);

-- Módulo Perfil (8)
select roles.create_ability(
	'view',
	'Ver Perfil',
	8
);

select roles.create_ability(
	'update',
	'Editar Perfil',
	8
);

-- Módulo de Comentarios (9)
select roles.create_ability(
	'comment',
	'Comentar',
	9
);

select roles.create_ability(
	'find',
	'Leer Comentarios',
	9
);

select roles.create_ability(
	'update',
	'Actualizar Comentario',
	9
);

-- Módulo de Favoritos (10)
select roles.create_ability(
	'find',
	'Ver Mis Favoritos',
	10
);

select roles.create_ability(
	'add',
	'Agregar a Mis Favoritos',
	10
);

select roles.create_ability(
	'remove',
	'Borrar de Mis Favoritos',
	10
);

select * from roles.ability a

-- =====================================================
--                     4. ROLES
-- =====================================================

select roles.create_role(
	'Administrador'
);

select roles.create_role(
	'Usuario'
);

select * from roles."role" r 

-- =====================================================
--            5. ASIGNAR PERMISO A UN ROL
-- =====================================================

select * from roles.ability a;
select * from roles."role" r ;


-- Asignar los Permisos al rol Administrador (1)
select roles.assign_ability_to_role(1, 1, TRUE);
select roles.assign_ability_to_role(1, 2, TRUE);
select roles.assign_ability_to_role(1, 3, TRUE);
select roles.assign_ability_to_role(1, 4, TRUE);
select roles.assign_ability_to_role(1, 5, TRUE);
select roles.assign_ability_to_role(1, 6, TRUE);
select roles.assign_ability_to_role(1, 7, TRUE);
select roles.assign_ability_to_role(1, 8, TRUE);
select roles.assign_ability_to_role(1, 9, TRUE);
select roles.assign_ability_to_role(1, 10, TRUE);
select roles.assign_ability_to_role(1, 11, TRUE);
select roles.assign_ability_to_role(1, 12, TRUE);
select roles.assign_ability_to_role(1, 13, TRUE);
select roles.assign_ability_to_role(1, 14, TRUE);
select roles.assign_ability_to_role(1, 15, TRUE);
select roles.assign_ability_to_role(1, 16, TRUE);
select roles.assign_ability_to_role(1, 17, TRUE);
select roles.assign_ability_to_role(1, 18, TRUE);
select roles.assign_ability_to_role(1, 19, FALSE);
select roles.assign_ability_to_role(1, 20, FALSE);
select roles.assign_ability_to_role(1, 21, FALSE);
select roles.assign_ability_to_role(1, 22, FALSE);
select roles.assign_ability_to_role(1, 23, FALSE);
select roles.assign_ability_to_role(1, 24, FALSE);
select roles.assign_ability_to_role(1, 25, FALSE);
select roles.assign_ability_to_role(1, 26, FALSE);
select roles.assign_ability_to_role(1, 27, FALSE);
select roles.assign_ability_to_role(1, 28, TRUE);
select roles.assign_ability_to_role(1, 29, TRUE);
select roles.assign_ability_to_role(1, 30, TRUE);
select roles.assign_ability_to_role(1, 31, TRUE);
select roles.assign_ability_to_role(1, 32, TRUE);
select roles.assign_ability_to_role(1, 33, TRUE);

-- Asignar permisos al rol Usuario (2)
select roles.assign_ability_to_role(2, 1, FALSE);
select roles.assign_ability_to_role(2, 2, FALSE);
select roles.assign_ability_to_role(2, 3, FALSE);
select roles.assign_ability_to_role(2, 4, FALSE);
select roles.assign_ability_to_role(2, 5, FALSE);
select roles.assign_ability_to_role(2, 6, FALSE);
select roles.assign_ability_to_role(2, 7, FALSE);
select roles.assign_ability_to_role(2, 8, FALSE);
select roles.assign_ability_to_role(2, 9, FALSE);
select roles.assign_ability_to_role(2, 10, FALSE);
select roles.assign_ability_to_role(2, 11, FALSE);
select roles.assign_ability_to_role(2, 12, FALSE);
select roles.assign_ability_to_role(2, 13, FALSE);
select roles.assign_ability_to_role(2, 14, FALSE);
select roles.assign_ability_to_role(2, 15, FALSE);
select roles.assign_ability_to_role(2, 16, FALSE);
select roles.assign_ability_to_role(2, 17, FALSE);
select roles.assign_ability_to_role(2, 18, FALSE);
select roles.assign_ability_to_role(2, 19, TRUE);
select roles.assign_ability_to_role(2, 20, TRUE);
select roles.assign_ability_to_role(2, 21, TRUE);
select roles.assign_ability_to_role(2, 22, TRUE);
select roles.assign_ability_to_role(2, 23, TRUE);
select roles.assign_ability_to_role(2, 24, TRUE);
select roles.assign_ability_to_role(2, 25, TRUE);
select roles.assign_ability_to_role(2, 26, TRUE);
select roles.assign_ability_to_role(2, 27, TRUE);
select roles.assign_ability_to_role(2, 28, FALSE);
select roles.assign_ability_to_role(2, 29, FALSE);
select roles.assign_ability_to_role(2, 30, FALSE);
select roles.assign_ability_to_role(2, 31, FALSE);
select roles.assign_ability_to_role(2, 32, FALSE);
select roles.assign_ability_to_role(2, 33, FALSE);

select * from roles.role_ability ra

-- =====================================================
--               6. CREAR IMÁGENES
-- =====================================================

-- Imagen del Avatar del Administrador
select files.create_image(
	'admin_avatar',
	'uploads/avatar/admin_avatar.png',
	'Super Avatar',
	FALSE
);

select * from files.image i 

-- =====================================================
--               7. CREAR ADMINISTRADOR
-- =====================================================

select users.create_admin(
	'Super',
	'',
	'Admin',
	'',
	'admin@aportaya.com',
	'12345678',
	'M',
	'2001-11-26',
	'9c2812d5-776c-4ea4-82c0-11cfd1aa9695',
	1
);

select users.login_user(
	'admin@aportaya.com',
	'12345678'
);