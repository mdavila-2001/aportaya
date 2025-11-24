const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/projects', projectController.getProjects);
router.post('/projects', authMiddleware, projectController.createProject);

module.exports = router;
