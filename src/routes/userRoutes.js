const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const favoriteController = require('../controllers/favoriteController');
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/home', userController.getUserHome);

router.post('/favorites/:projectId', favoriteController.toggleFavorite);
router.get('/favorites', favoriteController.getUserFavorites);

router.get('/my-projects', projectController.getMyProjects);
router.get('/projects/:id', projectController.getProjectForEdit);
router.put('/projects/:id', projectController.updateProject);

module.exports = router;
