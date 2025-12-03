const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/projects', projectController.getProjects);
router.get('/projects/categories', projectController.getProjectCategories);
router.post('/projects', authMiddleware.authenticate, projectController.createProject);
router.get('/projects/:slug', projectController.getProjectDetail);
router.post('/projects/:slug/comments', authMiddleware.authenticate, projectController.createComment);

module.exports = router;
