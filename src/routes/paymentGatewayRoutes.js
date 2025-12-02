const express = require('express');
const router = express.Router();
const paymentGatewayController = require('../controllers/paymentGatewayController');
const authMiddleware = require('../middleware/authMiddleware');

// Crear pago (requiere autenticación)
router.post('/projects/:projectSlug/donate',
    authMiddleware.authenticate,
    paymentGatewayController.createPayment
);

// Confirmar pago (público - llamado desde página de pago)
router.post('/payments/:id/confirm',
    paymentGatewayController.confirmPayment
);

// Obtener estado del pago (público)
router.get('/payments/:id',
    paymentGatewayController.getPaymentStatus
);

// Generar QR (público)
router.get('/payments/:id/qr',
    paymentGatewayController.generateQR
);

module.exports = router;
