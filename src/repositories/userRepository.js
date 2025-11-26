const { dbPool } = require('../config/dbConnection');

/**
 * Obtener información básica de un usuario
 */
const getUserById = async (userId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                id,
                first_name,
                middle_name,
                last_name,
                mother_last_name,
                email,
                status
            FROM users."user"
            WHERE id = $1 AND deleted_at IS NULL;
        `;

        const { rows } = await client.query(query, [userId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getUserById
};
