const { dbPool } = require('../config/dbConnection');

// ==================== ESTADÍSTICAS ====================

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

// ==================== USUARIOS ====================

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

        // Actualizar estado del usuario
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

        // Registrar en historial
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

// ==================== ADMINISTRADORES ====================

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

        // Obtener el ID del rol de administrador
        const roleQuery = `SELECT id FROM roles.role WHERE name = 'Administrador'`;
        const roleResult = await client.query(roleQuery);

        if (roleResult.rows.length === 0) {
            throw new Error('Rol de administrador no encontrado');
        }

        const adminRoleId = roleResult.rows[0].id;

        // Crear el usuario admin usando la función de la BD
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

        // Build dynamic update query
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        // Always update these fields
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

        // Password is optional for updates
        if (adminData.password) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            updateFields.push(`password = $${paramCount++}`);
            values.push(hashedPassword);
        }

        updateFields.push(`updated_at = NOW()`);

        // Add adminId as the last parameter
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
        // Verificar que no sea el último admin
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

        // Eliminar el usuario (esto eliminará en cascada el rol)
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

// ==================== CATEGORÍAS ====================

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
        if (error.code === '23505') { // Unique violation
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
        if (error.code === '23505') { // Unique violation
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
        // Verificar si la categoría tiene proyectos asociados
        const checkQuery = `
            SELECT COUNT(*) as count
            FROM projects.project
            WHERE category_id = $1
        `;
        const checkResult = await client.query(checkQuery, [categoryId]);

        if (parseInt(checkResult.rows[0].count) > 0) {
            throw new Error('No se puede eliminar la categoría porque tiene proyectos asociados');
        }

        // Verificar si tiene categorías hijas
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
    deleteCategory
};
