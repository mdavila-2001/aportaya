const paymentGatewayRepository = require('../repositories/paymentGatewayRepository');
const donationRepository = require('../repositories/donationRepository');
const QRCode = require('qrcode');

/**
 * POST /api/payments/create
 * Create a payment transaction and generate QR code URL
 */
const createPaymentTransaction = async (req, res) => {
    try {
        const { donationId, amount } = req.body;

        // Validate input
        if (!donationId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'donationId y amount son requeridos'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        // Create payment transaction
        const transactionId = await paymentGatewayRepository.createPaymentTransaction({
            donationId,
            amount,
            method: 'qr_scan'
        });

        // Generate QR URL
        const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
        const qrUrl = `${publicUrl}/api/payments/qr/${transactionId}`;

        res.status(201).json({
            success: true,
            message: 'Transacción de pago creada exitosamente',
            data: {
                transactionId,
                qrUrl,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Error creating payment transaction:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear transacción de pago'
        });
    }
};

/**
 * GET /api/payments/:transactionId
 * Get payment transaction status and details
 */
const getPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await paymentGatewayRepository.getTransactionById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: transaction.id,
                amount: parseFloat(transaction.amount),
                currency: transaction.currency,
                status: transaction.status,
                method: transaction.method,
                createdAt: transaction.created_at,
                projectTitle: transaction.project_title,
                projectSlug: transaction.project_slug
            }
        });
    } catch (error) {
        console.error('Error getting payment status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener estado del pago'
        });
    }
};

/**
 * POST /api/payments/:transactionId/confirm
 * Confirm payment from digital wallet
 */
const confirmPayment = async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Get transaction details
        const transaction = await paymentGatewayRepository.getTransactionById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        // Check if already confirmed
        if (transaction.status === 'confirmed' || transaction.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Esta transacción ya fue confirmada'
            });
        }

        // Update transaction status
        await paymentGatewayRepository.updateTransactionStatus(transactionId, 'confirmed');

        // Update donation status to completed
        await donationRepository.updateDonationStatus(transaction.donation_id, 'completed');

        // Log confirmation event
        await paymentGatewayRepository.logPaymentConfirmation(transactionId, {
            confirmedAt: new Date().toISOString(),
            donationId: transaction.donation_id,
            amount: transaction.amount
        });

        console.log(`Payment confirmed for transaction: ${transactionId}, donation: ${transaction.donation_id}`);

        res.status(200).json({
            success: true,
            message: 'Pago confirmado exitosamente',
            data: {
                transactionId,
                donationId: transaction.donation_id,
                status: 'confirmed'
            }
        });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al confirmar el pago'
        });
    }
};

/**
 * GET /api/payments/qr/:transactionId
 * Generate QR code image for payment transaction
 */
const generateQRCode = async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Verify transaction exists
        const transaction = await paymentGatewayRepository.getTransactionById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        // Generate QR code with transaction ID
        // The QR contains just the transaction ID, the wallet will use it to fetch details
        const qrBuffer = await QRCode.toBuffer(transactionId, {
            type: 'png',
            width: 300,
            margin: 2
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="qr-${transactionId}.png"`);
        res.send(qrBuffer);
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al generar código QR'
        });
    }
};

module.exports = {
    createPaymentTransaction,
    getPaymentStatus,
    confirmPayment,
    generateQRCode
};
