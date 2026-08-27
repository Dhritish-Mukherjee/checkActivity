const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);
router.put('/profile', auth, authController.updateProfile);
router.get('/users', auth, authController.getAllUsers);

// Admin only routes
router.get('/employees', auth, isAdmin, authController.getEmployees);
router.get('/users/:id', auth, isAdmin, authController.getUserById);

module.exports = router;