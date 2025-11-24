const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/projects', projectController.getProjects);

// Rutas protegidas (requieren autenticación)
router.post('/projects', authMiddleware, projectController.createProject);

module.exports = router;
