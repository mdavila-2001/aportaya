const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const favoriteController = require('../controllers/favoriteController');
const projectController = require('../controllers/projectController');
const campaignController = require('../controllers/campaignController');
const { authenticate } = require('../middleware/authMiddleware');
const { isUser } = require('../middleware/userMiddleware');

router.use(authenticate);
router.use(isUser);

router.get('/home', userController.getUserHome);

router.post('/favorites/:projectId', favoriteController.toggleFavorite);
router.get('/favorites', favoriteController.getUserFavorites);

router.get('/my-projects', projectController.getMyProjects);
router.get('/projects/:id', projectController.getProjectForEdit);
router.get('/projects/:id/observations', projectController.getProjectObservations);
router.put('/projects/:id', projectController.updateProject);
router.put('/projects/:id/resubmit', projectController.resubmitProject);
router.put('/projects/:id/submit-for-approval', projectController.submitProjectForApproval);
router.put('/projects/:id/campaign-status', campaignController.updateCampaignStatus);

module.exports = router;
