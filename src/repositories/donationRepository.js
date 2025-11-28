const { dbPool } = require('../config/dbConnection');


const createDonation = async (donationData) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT payments.create_donation(
                $1,  -- p_project_id
                $2,  -- p_user_id
                $3,  -- p_amount
                $4,  -- p_payment_method
                $5,  -- p_is_anonymous
                $6   -- p_payment_reference
            ) as donation_id;
        `;

        const values = [
            donationData.projectId,
            donationData.userId,
            donationData.amount,
            donationData.paymentMethod || 'pending',
            donationData.isAnonymous || false,
            donationData.paymentReference || null
        ];

        const res = await client.query(query, values);
        return res.rows[0].donation_id;
    } catch (error) {
        console.error('Error creando donación:', error);
        throw error;
    } finally {
        client.release();
    }
};


const getUserDonations = async (userId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                d.id,
                d.amount,
                d.donation_date,
                d.payment_status,
                d.is_anonymous,
                p.title as project_title,
                p.slug as project_slug,
                i.file_path as project_image
            FROM payments.donation d
            INNER JOIN projects.project p ON d.project_id = p.id
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = true
            LEFT JOIN files.image i ON pi.image_id = i.id
            WHERE d.user_id = $1
            ORDER BY d.donation_date DESC;
        `;

        const { rows } = await client.query(query, [userId]);
        return rows;
    } catch (error) {
        console.error('Error obteniendo donaciones del usuario:', error);
        throw error;
    } finally {
        client.release();
    }
};


const getProjectDonations = async (projectId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                d.id,
                d.amount,
                d.donation_date,
                d.payment_status,
                CASE 
                    WHEN d.is_anonymous = true THEN 'Donante Anónimo'
                    ELSE u.first_name || ' ' || u.last_name
                END as donor_name,
                d.is_anonymous
            FROM payments.donation d
            LEFT JOIN users."user" u ON d.user_id = u.id
            WHERE d.project_id = $1 
              AND d.payment_status = 'completed'
            ORDER BY d.donation_date DESC;
        `;

        const { rows } = await client.query(query, [projectId]);
        return rows;
    } catch (error) {
        console.error('Error obteniendo donaciones del proyecto:', error);
        throw error;
    } finally {
        client.release();
    }
};


const updateDonationStatus = async (donationId, status) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT payments.update_payment_status($1, $2) as updated;
        `;

        const res = await client.query(query, [donationId, status]);
        return res.rows[0].updated;
    } catch (error) {
        console.error('Error actualizando estado de donación:', error);
        throw error;
    } finally {
        client.release();
    }
};


const logWebhookEvent = async (source, eventType, payload) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT payments.log_webhook($1, $2, $3) as event_id;
        `;

        const res = await client.query(query, [source, eventType, payload]);
        return res.rows[0].event_id;
    } catch (error) {
        console.error('Error registrando webhook:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createDonation,
    getUserDonations,
    getProjectDonations,
    updateDonationStatus,
    logWebhookEvent
};
