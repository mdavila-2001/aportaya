const donationRepository = require('../repositories/donationRepository');

const createDonation = async (req, res) => {
    try {
        const userId = req.user.id;

        const donationData = {
            projectId: req.body.projectId,
            userId: userId,
            amount: req.body.amount,
            paymentMethod: req.body.paymentMethod || 'pending',
            isAnonymous: req.body.isAnonymous || false,
            paymentReference: req.body.paymentReference || null
        };

        if (!donationData.projectId || !donationData.amount) {
            return res.status(400).json({
                success: false,
                message: 'Proyecto y monto son requeridos'
            });
        }

        if (donationData.amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        const donationId = await donationRepository.createDonation(donationData);

        res.status(201).json({
            success: true,
            message: 'Donación creada exitosamente',
            data: {
                donationId: donationId
            }
        });
    } catch (error) {
        console.error('Error al crear donación:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear la donación'
        });
    }
};

const getMyDonations = async (req, res) => {
    try {
        const userId = req.user.id;

        const donations = await donationRepository.getUserDonations(userId);

        res.status(200).json({
            success: true,
            message: 'Donaciones obtenidas exitosamente',
            data: {
                donations: donations
            }
        });
    } catch (error) {
        console.error('Error obteniendo donaciones:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener donaciones'
        });
    }
};

const getProjectDonations = async (req, res) => {
    try {
        const { projectId } = req.params;

        const donations = await donationRepository.getProjectDonations(projectId);

        res.status(200).json({
            success: true,
            message: 'Donaciones del proyecto obtenidas exitosamente',
            data: {
                donations: donations,
                totalDonations: donations.length,
                totalAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0)
            }
        });
    } catch (error) {
        console.error('Error obteniendo donaciones del proyecto:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener donaciones del proyecto'
        });
    }
};

const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const providedSignature = req.headers['x-webhook-signature'];

        await donationRepository.logWebhookEvent(
            webhookData.source || 'unknown',
            webhookData.eventType || 'payment',
            webhookData
        );

        if (webhookData.eventType === 'payment.completed' || webhookData.status === 'completed') {
            if (webhookData.donationId) {
                await donationRepository.updateDonationStatus(
                    webhookData.donationId,
                    'completed'
                );

                console.log(`Pago completado para donación: ${webhookData.donationId}`);
            }
        } else if (webhookData.eventType === 'payment.failed' || webhookData.status === 'failed') {
            if (webhookData.donationId) {
                await donationRepository.updateDonationStatus(
                    webhookData.donationId,
                    'failed'
                );

                console.log(`Pago fallido para donación: ${webhookData.donationId}`);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Webhook procesado correctamente'
        });
    } catch (error) {
        console.error('Error procesando webhook:', error);
        res.status(200).json({
            success: false,
            message: 'Error procesando webhook pero recibido',
            error: error.message
        });
    }
};

module.exports = {
    createDonation,
    getMyDonations,
    getProjectDonations,
    handlePaymentWebhook
};
