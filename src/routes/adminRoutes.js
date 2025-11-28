const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware.authenticate);
router.use(adminMiddleware.isAdmin);

router.get('/stats', adminController.getDashboardStats);

router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/users/:id/history', adminController.getUserHistory);

router.get('/administrators', adminController.getAdministrators);
router.post('/administrators', adminController.createAdministrator);
router.put('/administrators/:id', adminController.updateAdministrator);
router.delete('/administrators/:id', adminController.deleteAdministrator);

router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

module.exports = router;
