const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

// Dashboard statistics
router.get('/statistics', dashboardController.getStatistics);

// Hours logged per employee
router.get('/hours-per-employee', dashboardController.getHoursPerEmployee);

// Task status breakdown
router.get('/task-status', dashboardController.getTaskStatusBreakdown);

// Time logged trend (last 7/30 days)
router.get('/time-trend', dashboardController.getTimeTrend);
router.get('/employee-time-trend', dashboardController.getEmployeeTimeTrend);

// Tasks completed per employee
router.get('/tasks-completed', dashboardController.getTasksCompletedPerEmployee);

// Employee summary
router.get('/employees-summary', dashboardController.getEmployeesSummary);

// Quiz Logs
router.get('/quiz-logs', dashboardController.getQuizLogs);

module.exports = router;