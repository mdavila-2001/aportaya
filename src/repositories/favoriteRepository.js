const { dbPool } = require('../config/dbConnection');

const toggleFavorite = async (userId, projectId) => {
    const client = await dbPool.connect();
    try {
        const query = 'SELECT social.toggle_favorite($1, $2) as is_favorited';
        const result = await client.query(query, [userId, projectId]);
        return result.rows[0].is_favorited;
    } catch (error) {
        console.error('Error toggling favorite:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getUserFavorites = async (userId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                p.id, p.title, p.slug, p.summary,
                p.financial_goal, p.raised_amount,
                p.end_date, p.location,
                c.name as category_name,
                u.first_name || ' ' || u.last_name as creator_name,
                img.file_path as cover_image_url,
                f.created_at as favorited_at
            FROM social.favorite f
            JOIN projects.project p ON f.project_id = p.id
            JOIN users.user u ON p.creator_id = u.id
            JOIN projects.category c ON p.category_id = c.id
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = TRUE
            LEFT JOIN files.image img ON pi.image_id = img.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC
        `;
        const result = await client.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting user favorites:', error);
        throw error;
    } finally {
        client.release();
    }
};

const checkIfFavorited = async (userId, projectIds) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT project_id
            FROM social.favorite
            WHERE user_id = $1 AND project_id = ANY($2::uuid[])
        `;
        const result = await client.query(query, [userId, projectIds]);
        return result.rows.map(row => row.project_id);
    } catch (error) {
        console.error('Error checking favorites:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    toggleFavorite,
    getUserFavorites,
    checkIfFavorited
};
