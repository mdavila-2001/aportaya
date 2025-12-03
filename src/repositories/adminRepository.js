const { dbPool } = require('../config/dbConnection');



const getStats = async () => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM users.user) as total_users,
                (SELECT COUNT(*) FROM users.user WHERE status = 'active') as active_users,
                (SELECT COUNT(*) FROM users.user WHERE status = 'pending_verification') as pending_users,
                (SELECT COUNT(*) FROM users.user WHERE status = 'suspended') as suspended_users,
                (SELECT COUNT(*) FROM users.user WHERE status = 'banned') as banned_users,
                
                (SELECT COUNT(*) FROM projects.project) as total_projects,
                (SELECT COUNT(*) FROM projects.project WHERE approval_status = 'published') as published_projects,
                (SELECT COUNT(*) FROM projects.project WHERE approval_status = 'in_review') as pending_projects,
                (SELECT COUNT(*) FROM projects.project WHERE approval_status = 'draft') as draft_projects,
                (SELECT COUNT(*) FROM projects.project WHERE approval_status = 'rejected') as rejected_projects,
                
                (SELECT COUNT(*) FROM payments.donation) as total_donations,
                (SELECT COALESCE(SUM(amount), 0) FROM payments.donation WHERE payment_status = 'completed') as total_donated,
                
                (SELECT COUNT(*) FROM projects.category) as total_categories
        `;

        const { rows } = await client.query(query);
        return rows[0];
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw error;
    } finally {
        client.release();
    }
};



const getUsers = async (filters = {}) => {
    const client = await dbPool.connect();
    try {
        let query = `
            SELECT 
                u.id,
                u.first_name,
                u.middle_name,
                u.last_name,
                u.mother_last_name,
                u.email,
                u.status,
                ur.role_id,
                u.registration_date,
                u.updated_at,
                i.file_path as profile_image_url,
                r.name as role
            FROM users.user u
            LEFT JOIN files.image i ON u.profile_image_id = i.id
            LEFT JOIN roles.user_role ur ON u.id = ur.user_id
            LEFT JOIN roles.role r ON ur.role_id = r.id
            WHERE 1=1 and ur.role_id = 2
        `;

        const params = [];

        if (filters.status) {
            params.push(filters.status);
            query += ` AND u.status = $${params.length}`;
        }

        if (filters.search) {
            params.push(`%${filters.search}%`);
            query += ` AND (
                LOWER(u.first_name) LIKE LOWER($${params.length}) OR
                LOWER(u.last_name) LIKE LOWER($${params.length}) OR
                LOWER(u.email) LIKE LOWER($${params.length})
            )`;
        }

        if (filters.role) {
            params.push(filters.role);
            query += ` AND r.name = $${params.length}`;
        }

        query += ` ORDER BY u.registration_date DESC`;

        if (filters.limit) {
            params.push(filters.limit);
            query += ` LIMIT $${params.length}`;
        }

        if (filters.offset) {
            params.push(filters.offset);
            query += ` OFFSET $${params.length}`;
        }

        const { rows } = await client.query(query, params);
        return rows;
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateUserStatus = async (userId, newStatus, reason = null, changedBy = null) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');


        const updateQuery = `
            UPDATE users.user 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        const { rows } = await client.query(updateQuery, [newStatus, userId]);

        if (rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }


        const historyQuery = `
            INSERT INTO users.user_status_history (user_id, old_status, new_status, changed_by, reason)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(historyQuery, [userId, rows[0].status, newStatus, changedBy, reason]);

        await client.query('COMMIT');
        return rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando estado de usuario:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getUserHistory = async (userId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                h.id,
                h.old_status,
                h.new_status,
                h.reason,
                h.change_date,
                u.first_name || ' ' || u.last_name as changed_by_name
            FROM users.user_status_history h
            LEFT JOIN users.user u ON h.changed_by = u.id
            WHERE h.user_id = $1
            ORDER BY h.change_date DESC
        `;

        const { rows } = await client.query(query, [userId]);
        return rows;
    } catch (error) {
        console.error('Error obteniendo historial de usuario:', error);
        throw error;
    } finally {
        client.release();
    }
};



const getAdministrators = async () => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                u.id,
                u.first_name,
                u.middle_name,
                u.last_name,
                u.mother_last_name,
                u.email,
                u.status,
                u.gender,
                u.birth_date,
                u.registration_date,
                i.file_path as profile_image_url
            FROM users.user u
            LEFT JOIN files.image i ON u.profile_image_id = i.id
            INNER JOIN roles.user_role ur ON u.id = ur.user_id
            INNER JOIN roles.role r ON ur.role_id = r.id
            WHERE r.name = 'Administrador'
            ORDER BY u.registration_date DESC
        `;

        const { rows } = await client.query(query);
        return rows;
    } catch (error) {
        console.error('Error obteniendo administradores:', error);
        throw error;
    } finally {
        client.release();
    }
};

const createAdministrator = async (adminData) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');


        const roleQuery = `SELECT id FROM roles.role WHERE name = 'Administrador'`;
        const roleResult = await client.query(roleQuery);

        if (roleResult.rows.length === 0) {
            throw new Error('Rol de administrador no encontrado');
        }

        const adminRoleId = roleResult.rows[0].id;


        const createQuery = `
            SELECT users.create_admin(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) as admin_id
        `;

        const values = [
            adminData.firstName,
            adminData.middleName || '',
            adminData.lastName,
            adminData.motherLastName || '',
            adminData.email,
            adminData.password,
            adminData.gender || 'U',
            adminData.birthDate || '1990-01-01',
            adminData.profileImageId || null,
            adminRoleId
        ];

        const { rows } = await client.query(createQuery, values);

        await client.query('COMMIT');
        return rows[0].admin_id;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando administrador:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateAdministrator = async (adminId, adminData) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');


        const updateFields = [];
        const values = [];
        let paramCount = 1;


        updateFields.push(`first_name = $${paramCount++}`);
        values.push(adminData.firstName);

        updateFields.push(`middle_name = $${paramCount++}`);
        values.push(adminData.middleName || '');

        updateFields.push(`last_name = $${paramCount++}`);
        values.push(adminData.lastName);

        updateFields.push(`mother_last_name = $${paramCount++}`);
        values.push(adminData.motherLastName || '');

        updateFields.push(`email = $${paramCount++}`);
        values.push(adminData.email);

        updateFields.push(`gender = $${paramCount++}`);
        values.push(adminData.gender || 'U');

        updateFields.push(`birth_date = $${paramCount++}`);
        values.push(adminData.birthDate);

        if (adminData.profileImageId) {
            updateFields.push(`profile_image_id = $${paramCount++}`);
            values.push(adminData.profileImageId);
        }


        if (adminData.password) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            updateFields.push(`password = $${paramCount++}`);
            values.push(hashedPassword);
        }

        updateFields.push(`updated_at = NOW()`);


        values.push(adminId);

        const updateQuery = `
            UPDATE users.user 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id
        `;

        const { rows } = await client.query(updateQuery, values);

        if (rows.length === 0) {
            throw new Error('Administrador no encontrado');
        }

        await client.query('COMMIT');
        return rows[0].id;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando administrador:', error);
        throw error;
    } finally {
        client.release();
    }
};

const deleteAdministrator = async (adminId) => {
    const client = await dbPool.connect();
    try {

        const countQuery = `
            SELECT COUNT(*) as count
            FROM roles.user_role ur
            INNER JOIN roles.role r ON ur.role_id = r.id
            WHERE r.name = 'Administrador'
        `;
        const countResult = await client.query(countQuery);

        if (parseInt(countResult.rows[0].count) <= 1) {
            throw new Error('No se puede eliminar el último administrador del sistema');
        }


        const deleteQuery = `
            UPDATE users.user 
            SET status = 'deleted', deleted_at = NOW()
            WHERE id = $1
            RETURNING id
        `;

        const { rows } = await client.query(deleteQuery, [adminId]);

        if (rows.length === 0) {
            throw new Error('Administrador no encontrado');
        }

        return true;
    } catch (error) {
        console.error('Error eliminando administrador:', error);
        throw error;
    } finally {
        client.release();
    }
};



const getCategories = async () => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                id,
                name,
                slug,
                description,
                parent_id,
                (SELECT name FROM projects.category WHERE id = c.parent_id) as parent_name
            FROM projects.category c
            ORDER BY name ASC
        `;

        const { rows } = await client.query(query);
        return rows;
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        throw error;
    } finally {
        client.release();
    }
};

const createCategory = async (categoryData) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT projects.create_category($1, $2, $3, $4) as category_id
        `;

        const values = [
            categoryData.name,
            categoryData.slug,
            categoryData.description || null,
            categoryData.parentId || null
        ];

        const { rows } = await client.query(query, values);
        return rows[0].category_id;
    } catch (error) {
        console.error('Error creando categoría:', error);
        if (error.code === '23505') {
            throw new Error('El slug de la categoría ya existe');
        }
        throw error;
    } finally {
        client.release();
    }
};

const updateCategory = async (categoryId, categoryData) => {
    const client = await dbPool.connect();
    try {
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (categoryData.name) {
            updateFields.push(`name = $${paramCount++}`);
            values.push(categoryData.name);
        }

        if (categoryData.slug) {
            updateFields.push(`slug = $${paramCount++}`);
            values.push(categoryData.slug);
        }

        if (categoryData.description !== undefined) {
            updateFields.push(`description = $${paramCount++}`);
            values.push(categoryData.description);
        }

        if (categoryData.parentId !== undefined) {
            updateFields.push(`parent_id = $${paramCount++}`);
            values.push(categoryData.parentId);
        }

        if (updateFields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(categoryId);

        const updateQuery = `
            UPDATE projects.category
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id
        `;

        const { rows } = await client.query(updateQuery, values);

        if (rows.length === 0) {
            throw new Error('Categoría no encontrada');
        }

        return rows[0].id;
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        if (error.code === '23505') {
            throw new Error('El slug de la categoría ya existe');
        }
        throw error;
    } finally {
        client.release();
    }
};

const deleteCategory = async (categoryId) => {
    const client = await dbPool.connect();
    try {

        const checkQuery = `
            SELECT COUNT(*) as count
            FROM projects.project
            WHERE category_id = $1
        `;
        const checkResult = await client.query(checkQuery, [categoryId]);

        if (parseInt(checkResult.rows[0].count) > 0) {
            throw new Error('No se puede eliminar la categoría porque tiene proyectos asociados');
        }


        const childrenQuery = `
            SELECT COUNT(*) as count
            FROM projects.category
            WHERE parent_id = $1
        `;
        const childrenResult = await client.query(childrenQuery, [categoryId]);

        if (parseInt(childrenResult.rows[0].count) > 0) {
            throw new Error('No se puede eliminar la categoría porque tiene subcategorías');
        }

        const deleteQuery = `
            DELETE FROM projects.category
            WHERE id = $1
            RETURNING id
        `;

        const { rows } = await client.query(deleteQuery, [categoryId]);

        if (rows.length === 0) {
            throw new Error('Categoría no encontrada');
        }

        return true;
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getProjects = async (filters = {}) => {
    const client = await dbPool.connect();
    try {
        let query = `
            SELECT 
                p.id,
                p.title,
                p.slug,
                p.description,
                p.summary,
                p.financial_goal,
                p.raised_amount,
                p.start_date,
                p.end_date,
                p.approval_status,
                p.campaign_status,
                p.location,
                p.video_url,
                p.created_at,
                p.updated_at,
                u.first_name || ' ' || COALESCE(u.middle_name || ' ', '') || u.last_name || ' ' || COALESCE(u.mother_last_name, '') as creator_name,
                u.id as creator_id,
                c.name as category_name,
                c.id as category_id,
                img.file_path as cover_image_url
            FROM projects.project p
            INNER JOIN users.user u ON p.creator_id = u.id
            LEFT JOIN projects.category c ON p.category_id = c.id
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = TRUE
            LEFT JOIN files.image img ON pi.image_id = img.id
            WHERE 1=1
        `;

        const params = [];

        if (filters.approval_status) {
            params.push(filters.approval_status);
            query += ` AND p.approval_status = $${params.length}`;
        }

        if (filters.searchBy) {
            params.push(`%${filters.searchBy}%`);
            query += ` AND (
                public.normalize_search_text(p.title) LIKE public.normalize_search_text($${params.length}) OR
                public.normalize_search_text(u.first_name || ' ' || COALESCE(u.middle_name, '') || ' ' || u.last_name || ' ' || COALESCE(u.mother_last_name, '')) LIKE public.normalize_search_text($${params.length})
            )`;
        }

        query += ` ORDER BY p.created_at DESC`;

        if (filters.limit) {
            params.push(filters.limit);
            query += ` LIMIT $${params.length}`;
        }

        if (filters.offset) {
            params.push(filters.offset);
            query += ` OFFSET $${params.length}`;
        }

        const { rows } = await client.query(query, params);
        return rows;
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getProjectById = async (projectId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                p.id,
                p.title,
                p.slug,
                p.description,
                p.summary,
                p.financial_goal,
                p.raised_amount,
                p.start_date,
                p.end_date,
                p.approval_status,
                p.campaign_status,
                p.location,
                p.video_url,
                p.created_at,
                p.updated_at,
                u.first_name || ' ' || COALESCE(u.middle_name || ' ', '') || u.last_name || ' ' || COALESCE(u.mother_last_name, '') as creator_name,
                u.id as creator_id,
                c.name as category_name,
                c.id as category_id,
                d.file_path as proof_document_url
            FROM projects.project p
            INNER JOIN users.user u ON p.creator_id = u.id
            LEFT JOIN projects.category c ON p.category_id = c.id
            LEFT JOIN files.document d ON p.proof_document_id = d.id
            WHERE p.id = $1
        `;

        const { rows } = await client.query(query, [projectId]);

        if (rows.length === 0) {
            return null;
        }

        const imagesQuery = `
            SELECT img.file_path, pi.is_cover, pi.display_order
            FROM projects.project_image pi
            INNER JOIN files.image img ON pi.image_id = img.id
            WHERE pi.project_id = $1
            ORDER BY pi.is_cover DESC, pi.display_order ASC
        `;

        const imagesResult = await client.query(imagesQuery, [projectId]);
        rows[0].images = imagesResult.rows.map(img => img.file_path);
        rows[0].cover_image_url = rows[0].images[0] || null;

        return rows[0];
    } catch (error) {
        console.error('Error obteniendo proyecto por ID:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateProjectStatus = async (projectId, status, reason, adminId) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        const getProjectQuery = `SELECT approval_status FROM projects.project WHERE id = $1`;
        const projectResult = await client.query(getProjectQuery, [projectId]);

        if (projectResult.rows.length === 0) {
            throw new Error('Proyecto no encontrado');
        }

        const oldStatus = projectResult.rows[0].approval_status;

        let updateQuery = `
            UPDATE projects.project 
            SET approval_status = $1, updated_at = NOW()
        `;

        updateQuery += ` WHERE id = $2 RETURNING id`;

        await client.query(updateQuery, [status, projectId]);

        const historyQuery = `
            INSERT INTO projects.project_status_history (project_id, old_status, new_status, changed_by, reason)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(historyQuery, [projectId, oldStatus, status, adminId, reason]);

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando estado del proyecto:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getStats,
    getUsers,
    updateUserStatus,
    getUserHistory,
    getAdministrators,
    createAdministrator,
    updateAdministrator,
    deleteAdministrator,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getProjects,
    getProjectById,
    updateProjectStatus
};
