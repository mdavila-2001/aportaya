const express = require('express');
const router = express.Router();
const paymentGatewayController = require('../controllers/paymentGatewayController');
const { authenticate } = require('../middleware/authMiddleware');

// Create payment transaction (authenticated - user must be logged in to donate)
router.post('/payments/create', authenticate, paymentGatewayController.createPaymentTransaction);

// Get payment status (public - allows polling from checkout page and wallet)
router.get('/payments/:transactionId', paymentGatewayController.getPaymentStatus);

// Confirm payment (public - called from digital wallet, no auth required)
router.post('/payments/:transactionId/confirm', paymentGatewayController.confirmPayment);

// Generate QR code (public - displayed in checkout page)
router.get('/payments/qr/:transactionId', paymentGatewayController.generateQRCode);

module.exports = router;
