const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);

// Admin only routes
router.post('/register', auth, isAdmin, authController.register);
router.get('/employees', auth, isAdmin, authController.getEmployees);
router.get('/users/:id', auth, isAdmin, authController.getUserById);

module.exports = router;