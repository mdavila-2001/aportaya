const { dbPool } = require('../config/dbConnection');


const getProjects = async (searchBy, filterBy) => {
    const client = await dbPool.connect();
    try {
        let sql = `
            SELECT * FROM projects.view_projects
        `;

        const params = [];
        if (searchBy) {
            sql += `WHERE LOWER(title) LIKE LOWER($1) `;
            params.push(`%${searchBy}%`);
        }

        if (filterBy) {
            const { categoryId, state, financialGoalRange, popularity } = filterBy;

            if (categoryId) {
                sql += params.length ? `AND category_id = $${params.length + 1} ` : `WHERE category_id = $1 `;
                params.push(categoryId);
            }

            if (state) {
                sql += params.length ? `AND state = $${params.length + 1} ` : `WHERE state = $1 `;
                params.push(state);
            }

            if (financialGoalRange) {
                const { min, max } = financialGoalRange;
                sql += params.length ? `AND financial_goal BETWEEN $${params.length + 1} AND $${params.length + 2} ` : `WHERE financial_goal BETWEEN $1 AND $2 `;
                params.push(min, max);
            }

            if (popularity) {
                if (popularity === 'financed') {
                    sql += params.length ? `AND raised_amount >= financial_goal ` : `WHERE raised_amount >= financial_goal `;
                } else if (popularity === 'recent') {
                    sql += `ORDER BY created_at DESC `;
                }
            }
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

const createProject = async(projectData, userId) => {
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
            new Date(), // Fecha de inicio (hoy)
            projectData.endDate, // Fecha de fin
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

module.exports = {
    createProject,
    getProjects
}