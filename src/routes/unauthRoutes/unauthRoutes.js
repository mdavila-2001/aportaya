const express = require('express');
const router = express.Router();
const landingController = require('../../controllers/landingController');

router.get('/welcome', landingController.getPublicLandingData);

module.exports = router;