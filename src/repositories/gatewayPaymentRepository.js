const { dbPool } = require('../config/dbConnection');

const createGatewayPayment = async (donationId, amount) => {
    const client = await dbPool.connect();
    try {
        const query = `
            INSERT INTO payments.gateway_payment (donation_id, amount, status)
            VALUES ($1, $2, 'PENDING')
            RETURNING id, donation_id, amount, status, created_at, qr_code_url, payment_url;
        `;
        const { rows } = await client.query(query, [donationId, amount]);
        return rows[0];
    } catch (error) {
        console.error('Error creando gateway payment:', error);
        throw error;
    } finally {
        client.release();
    }
};

const confirmGatewayPayment = async (paymentId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            UPDATE payments.gateway_payment
            SET status = 'CONFIRMED', confirmed_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND status = 'PENDING'
            RETURNING id, donation_id, amount, status, created_at, confirmed_at;
        `;
        const { rows } = await client.query(query, [paymentId]);

        if (rows.length === 0) {
            throw new Error('Pago no encontrado o ya confirmado');
        }

        return rows[0];
    } catch (error) {
        console.error('Error confirmando gateway payment:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getGatewayPaymentById = async (paymentId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                gp.id, 
                gp.donation_id, 
                gp.amount, 
                gp.status, 
                gp.qr_code_url, 
                gp.payment_url,
                gp.created_at, 
                gp.confirmed_at,
                p.title as project_title,
                i.file_path as project_image
            FROM payments.gateway_payment gp
            JOIN payments.donation d ON gp.donation_id = d.id
            JOIN projects.project p ON d.project_id = p.id
            LEFT JOIN projects.project_image pi ON p.id = pi.project_id AND pi.is_cover = true
            LEFT JOIN files.image i ON pi.image_id = i.id
            WHERE gp.id = $1;
        `;
        const { rows } = await client.query(query, [paymentId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error obteniendo gateway payment:', error);
        throw error;
    } finally {
        client.release();
    }
};

const getGatewayPaymentByDonationId = async (donationId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                id, 
                donation_id, 
                amount, 
                status, 
                qr_code_url, 
                payment_url,
                created_at, 
                confirmed_at
            FROM payments.gateway_payment 
            WHERE donation_id = $1;
        `;
        const { rows } = await client.query(query, [donationId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error obteniendo gateway payment por donation_id:', error);
        throw error;
    } finally {
        client.release();
    }
};

const updatePaymentUrls = async (paymentId, qrCodeUrl, paymentUrl) => {
    const client = await dbPool.connect();
    try {
        const query = `
            UPDATE payments.gateway_payment
            SET qr_code_url = $2, payment_url = $3
            WHERE id = $1
            RETURNING id, qr_code_url, payment_url;
        `;
        const { rows } = await client.query(query, [paymentId, qrCodeUrl, paymentUrl]);
        return rows[0];
    } catch (error) {
        console.error('Error actualizando URLs del pago:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createGatewayPayment,
    confirmGatewayPayment,
    getGatewayPaymentById,
    getGatewayPaymentByDonationId,
    updatePaymentUrls
};
