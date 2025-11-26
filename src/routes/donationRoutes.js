const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticate } = require('../middleware/authMiddleware');

// Crear donación (requiere autenticación)
router.post('/donations', authenticate, donationController.createDonation);

// Obtener mis donaciones (requiere autenticación)
router.get('/donations', authenticate, donationController.getMyDonations);

// Obtener donaciones de un proyecto (público)
router.get('/projects/:projectId/donations', donationController.getProjectDonations);

// Webhook de pagos (NO requiere autenticación - es llamado por el proveedor)
router.post('/webhooks/payment', donationController.handlePaymentWebhook);

module.exports = router;
