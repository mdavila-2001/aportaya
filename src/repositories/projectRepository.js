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
                $8,  -- p_summary
                $9,  -- p_location
                $10, -- p_cover_image_id
                $11, -- p_video_url
                $12  -- p_proof_document_id
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
            projectData.summary || null,
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
                d.donation_date
            FROM payments.donation d
            JOIN users.user u ON d.user_id = u.id
            LEFT JOIN files.image avatar ON u.profile_image_id = avatar.id
            WHERE d.project_id = $1 AND d.payment_status = 'completed'
            ORDER BY d.amount DESC
            LIMIT $2;
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
        const createQuery = `
            SELECT social.create_comment($1, $2, $3) as comment_id;
        `;
        const createResult = await client.query(createQuery, [projectId, userId, content]);
        const commentId = createResult.rows[0].comment_id;

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

const getProjectsByCreator = async (creatorId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                p.id,
                p.title,
                p.slug,
                p.summary as description,
                p.financial_goal as goal_amount,
                p.raised_amount,
                p.start_date,
                p.end_date,
                p.approval_status as status,
                p.campaign_status,
                c.name as category_name,
                img.file_path as cover_image_url
            FROM projects.project p
            LEFT JOIN projects.category c ON p.category_id = c.id
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = TRUE
            LEFT JOIN files.image img ON pi.image_id = img.id
            WHERE p.creator_id = $1
            ORDER BY p.created_at DESC
        `;

        const { rows } = await client.query(query, [creatorId]);
        return rows;
    } catch (error) {
        console.error('Error obteniendo proyectos del creador:', error);
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
                p.description,
                p.summary,
                p.financial_goal,
                p.raised_amount,
                p.end_date,
                p.location,
                p.category_id,
                p.approval_status,
                p.campaign_status,
                p.creator_id,
                p.video_url,
                p.proof_document_id,
                c.name as category_name,
                pi_cover.image_id as cover_image_id,
                img_cover.file_path as cover_image_url,
                doc.file_path as proof_document_url,
                doc.file_name as proof_document_name
            FROM projects.project p
            LEFT JOIN projects.category c ON p.category_id = c.id
            LEFT JOIN projects.project_image pi_cover ON p.id = pi_cover.project_id AND pi_cover.is_cover = TRUE
            LEFT JOIN files.image img_cover ON pi_cover.image_id = img_cover.id
            LEFT JOIN files.document doc ON p.proof_document_id = doc.id
            WHERE p.id = $1
        `;

        const { rows } = await client.query(query, [projectId]);
        return rows[0];
    } catch (error) {
        console.error('Error obteniendo proyecto por ID:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updateProject = async (projectId, updateData) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        // Construir query dinámicamente solo con campos proporcionados
        const updates = [];
        const values = [projectId];
        let paramIndex = 2;

        if (updateData.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(updateData.title);
        }
        if (updateData.summary !== undefined) {
            updates.push(`summary = $${paramIndex++}`);
            values.push(updateData.summary);
        }
        if (updateData.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(updateData.description);
        }
        if (updateData.financialGoal !== undefined) {
            updates.push(`financial_goal = $${paramIndex++}`);
            values.push(updateData.financialGoal);
        }
        if (updateData.categoryId !== undefined) {
            updates.push(`category_id = $${paramIndex++}`);
            values.push(updateData.categoryId);
        }
        if (updateData.location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            values.push(updateData.location);
        }
        if (updateData.endDate !== undefined) {
            updates.push(`end_date = $${paramIndex++}`);
            values.push(updateData.endDate);
        }
        if (updateData.videoUrl !== undefined) {
            updates.push(`video_url = $${paramIndex++}`);
            values.push(updateData.videoUrl);
        }

        // Siempre actualizar updated_at
        updates.push('updated_at = NOW()');

        if (updates.length === 1) { // Solo updated_at
            return true; // No hay nada que actualizar
        }

        const query = `
            UPDATE projects.project
            SET ${updates.join(', ')}
            WHERE id = $1
        `;

        await client.query(query, values);

        // Actualizar imagen de portada si se proporciona
        if (updateData.coverImageId !== undefined) {
            // Primero eliminar imagen anterior
            await client.query(`
                DELETE FROM projects.project_image 
                WHERE project_id = $1 AND is_cover = TRUE
            `, [projectId]);

            // Insertar nueva imagen
            if (updateData.coverImageId) {
                await client.query(`
                    INSERT INTO projects.project_image (project_id, image_id, is_cover)
                    VALUES ($1, $2, TRUE)
                `, [projectId, updateData.coverImageId]);
            }
        }

        // Actualizar documento de prueba si se proporciona
        if (updateData.proofDocumentId !== undefined) {
            // Primero eliminar documento anterior
            await client.query(`
                DELETE FROM projects.project_document 
                WHERE project_id = $1
            `, [projectId]);

            // Insertar nuevo documento
            if (updateData.proofDocumentId) {
                await client.query(`
                    INSERT INTO projects.project_document (project_id, document_id)
                    VALUES ($1, $2)
                `, [projectId, updateData.proofDocumentId]);
            }
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando proyecto:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getProjectObservations = async (projectId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                h.reason,
                h.change_date,
                u.first_name || ' ' || COALESCE(u.last_name, '') as admin_name
            FROM projects.project_status_history h
            LEFT JOIN users.user u ON h.changed_by = u.id
            LEFT JOIN projects.project p ON h.project_id = p.id
            WHERE h.project_id = $1 
              AND h.new_status = 'observed'
              AND h.changed_by IS NOT NULL
              AND h.changed_by != p.creator_id
            ORDER BY h.change_date DESC
            LIMIT 1
        `;

        const { rows } = await client.query(query, [projectId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error obteniendo observaciones del proyecto:', error);
        throw error;
    } finally {
        client.release();
    }
};

const resubmitProject = async (projectId, userId) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que el proyecto pertenece al usuario y está observado
        const checkQuery = `
            SELECT creator_id, approval_status 
            FROM projects.project 
            WHERE id = $1
        `;
        const checkResult = await client.query(checkQuery, [projectId]);

        if (checkResult.rows.length === 0) {
            throw new Error('Proyecto no encontrado');
        }

        const project = checkResult.rows[0];

        if (project.creator_id !== userId) {
            throw new Error('No tienes permiso para reenviar este proyecto');
        }

        if (project.approval_status !== 'observed') {
            throw new Error('Solo se pueden reenviar proyectos observados');
        }

        // Cambiar estado a in_review
        const updateQuery = `
            UPDATE projects.project 
            SET approval_status = 'in_review', updated_at = NOW()
            WHERE id = $1
        `;
        await client.query(updateQuery, [projectId]);

        // Registrar en historial
        const historyQuery = `
            INSERT INTO projects.project_status_history 
                (project_id, old_status, new_status, changed_by, reason)
            VALUES ($1, 'observed', 'in_review', $2, 'Proyecto reenviado por el creador')
        `;
        await client.query(historyQuery, [projectId, userId]);

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error reenviando proyecto:', error);
        throw error;
    } finally {
        client.release();
    }
};

const submitProjectForApproval = async (projectId, userId) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        // Validar que sea el owner y estado actual
        const projectQuery = `
            SELECT creator_id, approval_status 
            FROM projects.project 
            WHERE id = $1
        `;
        const { rows } = await client.query(projectQuery, [projectId]);

        if (rows.length === 0) {
            throw new Error('Proyecto no encontrado');
        }

        if (rows[0].creator_id !== userId) {
            throw new Error('No tienes permiso para enviar este proyecto');
        }

        if (rows[0].approval_status !== 'draft') {
            throw new Error('Solo puedes enviar proyectos en borrador');
        }

        // Cambiar estado
        const updateQuery = `
            UPDATE projects.project 
            SET approval_status = 'in_review', updated_at = NOW()
            WHERE id = $1
        `;
        await client.query(updateQuery, [projectId]);

        // Registrar en historial
        const historyQuery = `
            INSERT INTO projects.project_status_history 
                (project_id, old_status, new_status, changed_by, reason)
            VALUES ($1, 'draft', 'in_review', $2, 'Proyecto enviado a revisión por el creador')
        `;
        await client.query(historyQuery, [projectId, userId]);

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error enviando proyecto a aprobación:', error);
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
    createComment,
    getProjectsByCreator,
    getProjectById,
    updateProject,
    getProjectObservations,
    resubmitProject,
    submitProjectForApproval
};
