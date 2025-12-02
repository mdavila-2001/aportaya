const { dbPool } = require('../config/dbConnection');

const getProjectCategories = async () => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT id, name FROM projects.category;
        `;
        const { rows } = await client.query(query);
        return rows;
    } catch (error) {
        console.error('Error obteniendo categorías de proyectos:', error);
    } finally {
        client.release();
    }
}


const getProjects = async (searchBy, filterBy) => {
    const client = await dbPool.connect();
    try {
        let sql = `
            SELECT 
                p.id,
                p.title,
                p.slug,
                p.summary as description,
                p.approval_status,
                p.campaign_status,
                i.file_path as cover_image_url,
                p.category_id,
                c.name AS category_name,
                p.raised_amount,
                p.financial_goal as goal_amount,
                p.start_date,
                p.end_date,
                p.created_at
            FROM projects.project p
            INNER JOIN projects.category c ON p.category_id = c.id
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = true
            LEFT JOIN files.image i ON pi.image_id = i.id
            WHERE p.approval_status = 'published'
        `;

        const params = [];
        if (searchBy) {
            sql += `AND LOWER(p.title) LIKE LOWER($1) `;
            params.push(`%${searchBy}%`);
        }

        if (filterBy) {
            const { categoryId, state, financialGoalRange, popularity } = filterBy;

            if (categoryId) {
                sql += params.length ? `AND p.category_id = $${params.length + 1} ` : `AND p.category_id = $1 `;
                params.push(categoryId);
            }

            if (state) {
                sql += params.length ? `AND p.campaign_status = $${params.length + 1} ` : `AND p.campaign_status = $1 `;
                params.push(state);
            }

            if (financialGoalRange) {
                const { min, max } = financialGoalRange;
                sql += params.length ? `AND p.financial_goal BETWEEN $${params.length + 1} AND $${params.length + 2} ` : `AND p.financial_goal BETWEEN $1 AND $2 `;
                params.push(min, max);
            }

            if (popularity) {
                if (popularity === 'financed') {
                    sql += params.length ? `AND p.raised_amount >= p.financial_goal ` : `AND p.raised_amount >= p.financial_goal `;
                } else if (popularity === 'recent') {
                    sql += `ORDER BY p.created_at DESC `;
                }
            }
        }

        if (!sql.includes('ORDER BY')) {
            sql += `ORDER BY p.created_at DESC `;
        }

        const { rows } = await dbPool.query(sql, params);
        return rows;
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        throw error;
    } finally {
        client.release();
    }
}

const getProjectsBySLUG = async (slug) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                p.id,
                p.title,
                p.description,
                p.financial_goal as goal_amount,
                p.raised_amount,
                p.end_date,
                p.start_date,
                p.location,
                p.slug,
                p.creator_id,
                u.first_name || ' ' || u.last_name as creator_name,
                avatar.file_path as creator_image,
                c.name as category_name,
                f.file_path as cover_image_url
            FROM projects.project p
            JOIN users.user u ON p.creator_id = u.id
            LEFT JOIN files.image avatar ON u.profile_image_id = avatar.id
            JOIN projects.category c ON p.category_id = c.id
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = TRUE
            LEFT JOIN files.image f ON pi.image_id = f.id
            WHERE p.slug = $1
        `;

        const { rows } = await client.query(query, [slug]);
        return rows[0];
    } catch (error) {
        console.error('Error obteniendo proyecto por SLUG:', error);
        throw error;
    } finally {
        client.release();
    }
};

const createProject = async (projectData, userId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT projects.create_project(
                $1,  -- p_creator_id
                $2,  -- p_title
                $3,  -- p_description
                $4,  -- p_financial_goal
                $5,  -- p_start_date
                $6,  -- p_end_date
                $7,  -- p_category_id
                $8,  -- p_location (Opcional)
                $9,  -- p_cover_image_id (Opcional)
                $10, -- p_video_url (Opcional)
                $11  -- p_proof_document_id (Opcional)
            ) as project_id;
        `;

        const values = [
            userId,
            projectData.title,
            projectData.description,
            projectData.financialGoal,
            new Date(),
            projectData.endDate,
            projectData.categoryId,
            projectData.location || null,
            projectData.coverImageId || null,
            projectData.videoUrl || null,
            projectData.proofDocumentId || null
        ];

        const res = await client.query(query, values);
        return res.rows[0].project_id;
    } catch (error) {
        console.error('Error creando proyecto:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getProjectDonors = async (projectId, limit = 3) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                u.first_name || ' ' || u.last_name as donor_name,
                avatar.file_path as donor_avatar,
                d.amount,
                d.created_at
            FROM payments.donation d
            JOIN users.user u ON d.user_id = u.id
            LEFT JOIN files.image avatar ON u.profile_image_id = avatar.id
            WHERE d.project_id = $1 AND d.status = 'completed'
            ORDER BY d.amount DESC
            LIMIT $3;
        `;
        const { rows } = await client.query(query, [projectId, limit]);
        return rows;
    } catch (error) {
        console.error('Error obteniendo donadores del proyecto:', error);
        return [];
    } finally {
        client.release();
    }
};

const getProjectComments = async (projectId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                c.id,
                c.content,
                c.created_at,
                TRIM(CONCAT_WS(' ', 
                    u.first_name, 
                    u.middle_name, 
                    u.last_name, 
                    u.mother_last_name
                )) as author_name,
                avatar.file_path as author_avatar
            FROM social.comment c
            JOIN users.user u ON c.user_id = u.id
            LEFT JOIN files.image avatar ON u.profile_image_id = avatar.id
            WHERE c.project_id = $1
            ORDER BY c.created_at DESC;
        `;
        const { rows } = await client.query(query, [projectId]);
        return rows;
    } catch (error) {
        console.error('Error obteniendo comentarios del proyecto:', error);
        return [];
    } finally {
        client.release();
    }
};

const getProjectUpdates = async (projectId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                id,
                title,
                content,
                created_at
            FROM social.project_update
            WHERE project_id = $1
            ORDER BY created_at DESC;
        `;
        const { rows } = await client.query(query, [projectId]);
        return rows;
    } catch (error) {
        console.error('Error obteniendo actualizaciones del proyecto:', error);
        return [];
    } finally {
        client.release();
    }
};

const createComment = async (projectId, userId, content) => {
    const client = await dbPool.connect();
    try {
        // Llamar a la función de BD para crear el comentario
        const createQuery = `
            SELECT social.create_comment($1, $2, $3) as comment_id;
        `;
        const createResult = await client.query(createQuery, [projectId, userId, content]);
        const commentId = createResult.rows[0].comment_id;

        // Obtener el comentario creado con información del autor
        const getQuery = `
            SELECT 
                c.id,
                c.content,
                c.created_at,
                TRIM(CONCAT_WS(' ', 
                    u.first_name, 
                    u.middle_name, 
                    u.last_name, 
                    u.mother_last_name
                )) as author_name,
                avatar.file_path as author_avatar
            FROM social.comment c
            JOIN users.user u ON c.user_id = u.id
            LEFT JOIN files.image avatar ON u.profile_image_id = avatar.id
            WHERE c.id = $1;
        `;
        const getResult = await client.query(getQuery, [commentId]);
        return getResult.rows[0];
    } catch (error) {
        console.error('Error creando comentario:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectCategories,
    getProjectsBySLUG,
    getProjectDonors,
    getProjectComments,
    getProjectUpdates,
    createComment
};