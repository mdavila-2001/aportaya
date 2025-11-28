const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticate } = require('../middleware/authMiddleware');


router.post('/donations', authenticate, donationController.createDonation);


router.get('/donations', authenticate, donationController.getMyDonations);


router.get('/projects/:projectId/donations', donationController.getProjectDonations);


router.post('/webhooks/payment', donationController.handlePaymentWebhook);

module.exports = router;
