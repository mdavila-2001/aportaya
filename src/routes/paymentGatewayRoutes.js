const express = require('express');
const router = express.Router();
const paymentGatewayController = require('../controllers/paymentGatewayController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/projects/:projectSlug/donate',
    authMiddleware.authenticate,
    paymentGatewayController.createPayment
);

router.post('/payments/:id/confirm',
    paymentGatewayController.confirmPayment
);

router.get('/payments/:id',
    paymentGatewayController.getPaymentStatus
);

router.get('/payments/:id/qr',
    paymentGatewayController.generateQR
);

module.exports = router;
