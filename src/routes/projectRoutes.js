const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/projects', projectController.getProjects); // Soporta búsqueda con ?searchBy=nombre y filtros avanzados con ?filterBy={...}
router.post('/projects', authMiddleware, projectController.createProject);

module.exports = router;
