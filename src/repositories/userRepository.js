const { dbPool } = require('../config/dbConnection');


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
            WHERE id = $1;
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

const getUserDashboardData = async (userId) => {
    const client = await dbPool.connect();
    try {
        const userQuery = `
            SELECT 
                first_name,
                middle_name,
                last_name,
                mother_last_name,
                email
            FROM users."user"
            WHERE id = $1;
        `;
        const userResult = await client.query(userQuery, [userId]);
        const user = userResult.rows[0];

        const projectsQuery = `
            SELECT 
                p.id,
                p.title,
                p.description,
                p.financial_goal,
                p.raised_amount,
                p.approval_status,
                i.file_path as image_url
            FROM projects.project p
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = true
            LEFT JOIN files.image i ON pi.image_id = i.id
            WHERE p.creator_id = $1 
                AND p.approval_status IN ('published', 'in_review')
            ORDER BY p.created_at DESC
            LIMIT 4;
        `;
        const projectsResult = await client.query(projectsQuery, [userId]);

        const activityQuery = `
            SELECT 
                d.id,
                'donation' as type,
                'Recibiste un aporte de Bs. ' || d.amount || ' en ' || p.title as description,
                d.donation_date as created_at
            FROM payments.donation d
            JOIN projects.project p ON d.project_id = p.id
            WHERE p.creator_id = $1
            ORDER BY d.donation_date DESC
            LIMIT 5;
        `;
        const activityResult = await client.query(activityQuery, [userId]);

        const recommendedQuery = `
            SELECT 
                p.id,
                p.title,
                p.description,
                i.file_path as image_url
            FROM projects.project p
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = true
            LEFT JOIN files.image i ON pi.image_id = i.id
            WHERE p.creator_id != $1 
                AND p.approval_status = 'published'
            ORDER BY p.created_at DESC
            LIMIT 3;
        `;
        const recommendedResult = await client.query(recommendedQuery, [userId]);

        return {
            user: user,
            projects: projectsResult.rows,
            activity: activityResult.rows,
            recommended: recommendedResult.rows
        };
    } catch (error) {
        console.error('Error obteniendo datos del dashboard:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getUserById,
    getUserDashboardData
};
