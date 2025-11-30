const { dbPool } = require('../config/dbConnection');

/**
 * Create a payment transaction for a donation
 * @param {Object} data - { donationId, amount, method }
 * @returns {String} transactionId
 */
const createPaymentTransaction = async (data) => {
    const client = await dbPool.connect();
    try {
        const query = `
            INSERT INTO payments.payment_transaction (
                donation_id,
                provider,
                method,
                amount,
                currency,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;

        const values = [
            data.donationId,
            'internal_gateway',
            data.method || 'qr_scan',
            data.amount,
            'USD',
            'pending'
        ];

        const res = await client.query(query, values);
        return res.rows[0].id;
    } catch (error) {
        console.error('Error creating payment transaction:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get transaction details by ID with donation info
 * @param {String} transactionId - UUID of the transaction
 * @returns {Object} Transaction details
 */
const getTransactionById = async (transactionId) => {
    const client = await dbPool.connect();
    try {
        const query = `
            SELECT 
                pt.id,
                pt.donation_id,
                pt.provider,
                pt.method,
                pt.amount,
                pt.currency,
                pt.status,
                pt.created_at,
                pt.updated_at,
                d.project_id,
                d.user_id,
                d.is_anonymous,
                p.title as project_title,
                p.slug as project_slug
            FROM payments.payment_transaction pt
            INNER JOIN payments.donation d ON pt.donation_id = d.id
            INNER JOIN projects.project p ON d.project_id = p.id
            WHERE pt.id = $1;
        `;

        const { rows } = await client.query(query, [transactionId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting transaction:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Update transaction status
 * @param {String} transactionId - UUID of the transaction
 * @param {String} newStatus - New status (pending, confirmed, failed, etc.)
 * @returns {Boolean} Success
 */
const updateTransactionStatus = async (transactionId, newStatus) => {
    const client = await dbPool.connect();
    try {
        const query = `
            UPDATE payments.payment_transaction
            SET status = $1, updated_at = now()
            WHERE id = $2
            RETURNING id;
        `;

        const res = await client.query(query, [newStatus, transactionId]);
        return res.rowCount > 0;
    } catch (error) {
        console.error('Error updating transaction status:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Log payment confirmation event
 * @param {String} transactionId - UUID of the transaction
 * @param {Object} payload - Additional data about the confirmation
 * @returns {String} Event ID
 */
const logPaymentConfirmation = async (transactionId, payload) => {
    const client = await dbPool.connect();
    try {
        const query = `
            INSERT INTO payments.webhook_event (
                source,
                event_type,
                payload,
                status
            ) VALUES ($1, $2, $3, $4)
            RETURNING id;
        `;

        const values = [
            'internal_gateway',
            'payment.confirmed',
            JSON.stringify({ transactionId, ...payload }),
            'processed'
        ];

        const res = await client.query(query, values);
        return res.rows[0].id;
    } catch (error) {
        console.error('Error logging payment confirmation:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createPaymentTransaction,
    getTransactionById,
    updateTransactionStatus,
    logPaymentConfirmation
};
