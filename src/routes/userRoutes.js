const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/user/home - Dashboard completo en un solo endpoint
router.get('/home', userController.getUserHome);

module.exports = router;
