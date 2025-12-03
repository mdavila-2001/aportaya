const gatewayPaymentRepository = require('../repositories/gatewayPaymentRepository');
const donationRepository = require('../repositories/donationRepository');
const projectRepository = require('../repositories/projectRepository');
const QRCode = require('qrcode');

const createPayment = async (req, res) => {
    const { projectSlug } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    try {
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        const project = await projectRepository.getProjectsBySLUG(projectSlug);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        const donationId = await donationRepository.createDonation({
            projectId: project.id,
            userId: userId,
            amount: amount,
            paymentMethod: 'gateway',
            isAnonymous: false,
            paymentReference: null
        });

        const gatewayPayment = await gatewayPaymentRepository.createGatewayPayment(
            donationId,
            amount
        );
        const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
        const paymentUrl = `${baseUrl}/pages/payment/pay.html?id=${gatewayPayment.id}`;
        const qrUrl = `${baseUrl}/api/gateway/payments/${gatewayPayment.id}/qr`;

        await gatewayPaymentRepository.updatePaymentUrls(
            gatewayPayment.id,
            qrUrl,
            paymentUrl
        );

        res.status(201).json({
            success: true,
            message: 'Pago creado exitosamente',
            data: {
                paymentId: gatewayPayment.id,
                donationId: donationId,
                amount: parseFloat(gatewayPayment.amount),
                status: gatewayPayment.status,
                paymentUrl: paymentUrl,
                qrUrl: qrUrl
            }
        });
    } catch (error) {
        console.error('Error creando pago:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear el pago'
        });
    }
};

const confirmPayment = async (req, res) => {
    const { id } = req.params;

    try {
        const gatewayPayment = await gatewayPaymentRepository.getGatewayPaymentById(id);
        if (!gatewayPayment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        if (gatewayPayment.status === 'CONFIRMED') {
            return res.status(400).json({
                success: false,
                message: 'El pago ya fue confirmado'
            });
        }

        const confirmedPayment = await gatewayPaymentRepository.confirmGatewayPayment(id);

        await donationRepository.updateDonationStatus(
            gatewayPayment.donation_id,
            'completed'
        );

        const donation = await donationRepository.getDonationById(gatewayPayment.donation_id);

        res.json({
            success: true,
            message: 'Pago confirmado exitosamente',
            data: {
                paymentId: confirmedPayment.id,
                status: confirmedPayment.status,
                confirmedAt: confirmedPayment.confirmed_at,
                amount: parseFloat(confirmedPayment.amount)
            }
        });
    } catch (error) {
        console.error('Error confirmando pago:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al confirmar el pago'
        });
    }
};

const getPaymentStatus = async (req, res) => {
    const { id } = req.params;

    try {
        const gatewayPayment = await gatewayPaymentRepository.getGatewayPaymentById(id);
        if (!gatewayPayment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                id: gatewayPayment.id,
                amount: parseFloat(gatewayPayment.amount),
                status: gatewayPayment.status,
                createdAt: gatewayPayment.created_at,
                confirmedAt: gatewayPayment.confirmed_at,
                projectTitle: gatewayPayment.project_title,
                projectImage: gatewayPayment.project_image
            }
        });
    } catch (error) {
        console.error('Error obteniendo estado del pago:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener el estado del pago'
        });
    }
};

const generateQR = async (req, res) => {
    const { id } = req.params;

    try {
        const gatewayPayment = await gatewayPaymentRepository.getGatewayPaymentById(id);
        if (!gatewayPayment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
        const paymentUrl = `${baseUrl}/pages/payment/success.html?id=${id}`;
        const qrBuffer = await QRCode.toBuffer(paymentUrl, {
            type: 'png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="qr-${id}.png"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(qrBuffer);
    } catch (error) {
        console.error('Error generando QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar código QR'
        });
    }
};

module.exports = {
    createPayment,
    confirmPayment,
    getPaymentStatus,
    generateQR
};
