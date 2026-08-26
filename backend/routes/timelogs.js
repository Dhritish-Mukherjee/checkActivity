const express = require('express');
const router = express.Router();
const timeLogController = require('../controllers/timeLogController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create manual time entry
router.post('/manual', timeLogController.createManualEntry);

// Timer operations
router.post('/timer/start', timeLogController.startTimer);
router.patch('/timer/:id/stop', timeLogController.stopTimer);

// Get time logs
router.get('/my', timeLogController.getMyTimeLogs);
router.get('/active', timeLogController.getActiveTimer);
router.get('/task/:taskId', timeLogController.getTaskTimeLogs);

// Admin routes for getting all time logs
router.get('/all', timeLogController.getAllTimeLogs);

module.exports = router;