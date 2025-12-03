const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const favoriteController = require('../controllers/favoriteController');
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/user/home - Dashboard completo en un solo endpoint
router.get('/home', userController.getUserHome);

// Rutas de favoritos
router.post('/favorites/:projectId', favoriteController.toggleFavorite);
router.get('/favorites', favoriteController.getUserFavorites);

// Rutas de proyectos del usuario
router.get('/my-projects', projectController.getMyProjects);

module.exports = router;
