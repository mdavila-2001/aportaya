const { dbPool } = require('../config/dbConnection');

const updateCampaignStatus = async (projectId, newStatus, userId) => {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        
        const checkQuery = `
            SELECT creator_id, approval_status, campaign_status 
            FROM projects.project 
            WHERE id = $1
        `;
        const { rows } = await client.query(checkQuery, [projectId]);
        
        if (rows.length === 0) {
            throw new Error('Proyecto no encontrado');
        }
        
        const project = rows[0];
        
        if (project.creator_id !== userId) {
            throw new Error('No tienes permiso para modificar este proyecto');
        }
        
        const currentStatus = project.campaign_status;
        const validTransitions = {
            'not_started': ['active'],
            'active': ['paused', 'finished'],
            'paused': ['active'],
            'finished': []
        };
        
        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            throw new Error(`No puedes cambiar el estado de ${currentStatus} a ${newStatus}`);
        }
        
        if (newStatus === 'active' && currentStatus === 'not_started') {
            if (project.approval_status !== 'published') {
                throw new Error('El proyecto debe estar aprobado antes de iniciar la campaña');
            }
        }
        
        const updateQuery = `
            UPDATE projects.project 
            SET campaign_status = $1, updated_at = NOW()
            WHERE id = $2
        `;
        await client.query(updateQuery, [newStatus, projectId]);
        
        const statusNames = {
            'active': 'iniciada',
            'paused': 'pausada',
            'finished': 'finalizada'
        };
        
        const reason = `Campaña ${statusNames[newStatus] || newStatus} por el creador`;
        
        const historyQuery = `
            INSERT INTO projects.project_status_history 
                (project_id, old_status, new_status, changed_by, reason)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(historyQuery, [projectId, currentStatus, newStatus, userId, reason]);
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando estado de campaña:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    updateCampaignStatus
};
