const express = require('express');
const router = express.Router();
const publicProjectController = require('../../controllers/projects/publicProjectController');

router.get('/welcome', publicProjectController.getPublicDashboarData);

module.exports = router;