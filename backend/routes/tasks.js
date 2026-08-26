const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Admin only routes
router.put('/:id', isAdmin, taskController.updateTask);
router.delete('/:id', isAdmin, taskController.deleteTask);
router.get('/all', isAdmin, taskController.getAllTasks);

// Routes accessible by both admin and employees
router.post('/', taskController.createTask);

// Routes accessible by both admin and employees
router.get('/my', taskController.getMyTasks);
router.get('/:id', taskController.getTaskById);

// Employee can update status of their own tasks
router.patch('/:id/status', taskController.updateTaskStatus);

module.exports = router;