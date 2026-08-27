const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');

// Create manual time entry
const createManualEntry = async (req, res) => {
  try {
    const { taskId, hours, minutes, date, note } = req.body;

    // Validation
    if (!taskId || !date) {
      return res.status(400).json({
        message: 'Task ID and date are required.'
      });
    }

    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (totalMinutes <= 0) {
      return res.status(400).json({
        message: 'Time duration must be greater than 0.'
      });
    }

    // Verify task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check if user is assigned to this task (employees) or is admin
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(
        assigneeId => assigneeId.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const timeLog = new TimeLog({
      task: taskId,
      user: req.user._id,
      type: 'manual',
      durationMinutes: totalMinutes,
      note: note?.trim() || '',
      date: new Date(date)
    });

    await timeLog.save();

    await timeLog.populate('task', 'title');
    await timeLog.populate('user', 'name email');

    res.status(201).json({
      message: 'Time entry logged successfully',
      timeLog
    });
  } catch (error) {
    console.error('Create manual entry error:', error);
    res.status(500).json({ message: 'Failed to create time entry.' });
  }
};

// Start timer
const startTimer = async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required.' });
    }

    // Verify task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check if user is assigned to this task (employees) or is admin
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(
        assigneeId => assigneeId.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    // Check if there's already an active timer for this specific task
    const activeTimer = await TimeLog.findOne({
      task: taskId,
      user: req.user._id,
      type: 'timer',
      endTime: null
    });

    if (activeTimer) {
      return res.status(400).json({
        message: 'You already have an active timer running for this specific task.',
        activeTimer
      });
    }

    const timeLog = new TimeLog({
      task: taskId,
      user: req.user._id,
      type: 'timer',
      startTime: new Date(),
      date: new Date()
    });

    await timeLog.save();

    await timeLog.populate('task', 'title');
    await timeLog.populate('user', 'name email');

    res.status(201).json({
      message: 'Timer started',
      timeLog
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ message: 'Failed to start timer.' });
  }
};

// Stop timer
const stopTimer = async (req, res) => {
  try {
    const { note } = req.body;

    const timeLog = await TimeLog.findOne({
      _id: req.params.id,
      user: req.user._id,
      type: 'timer',
      endTime: null
    });

    if (!timeLog) {
      return res.status(404).json({
        message: 'Active timer not found.'
      });
    }

    const endTime = new Date();
    const durationMs = endTime - timeLog.startTime;
    const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Convert ms to minutes, round up

    // Cap at 24 hours (1440 minutes)
    const cappedDuration = Math.min(durationMinutes, 1440);

    timeLog.endTime = endTime;
    timeLog.durationMinutes = cappedDuration;
    if (note) timeLog.note = note.trim();

    await timeLog.save();

    await timeLog.populate('task', 'title');
    await timeLog.populate('user', 'name email');

    res.json({
      message: 'Timer stopped',
      timeLog
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ message: 'Failed to stop timer.' });
  }
};

// Get my time logs
const getMyTimeLogs = async (req, res) => {
  try {
    const { startDate, endDate, taskId } = req.query;

    let query = { user: req.user._id };

    if (taskId) query.task = taskId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const timeLogs = await TimeLog.find(query)
      .populate('task', 'title status')
      .sort({ date: -1, createdAt: -1 });

    // Calculate total time
    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

    res.json({
      timeLogs,
      count: timeLogs.length,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1)
    });
  } catch (error) {
    console.error('Get my time logs error:', error);
    res.status(500).json({ message: 'Failed to get time logs.' });
  }
};

// Get time logs for a specific task
const getTaskTimeLogs = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(
        assigneeId => assigneeId.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const timeLogs = await TimeLog.find({ task: req.params.taskId })
      .populate('user', 'name email')
      .sort({ date: -1, createdAt: -1 });

    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

    res.json({
      timeLogs,
      count: timeLogs.length,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1)
    });
  } catch (error) {
    console.error('Get task time logs error:', error);
    res.status(500).json({ message: 'Failed to get time logs.' });
  }
};

// Get all time logs (admin only - handled by route protection)
const getAllTimeLogs = async (req, res) => {
  try {
    const { startDate, endDate, userId, taskId } = req.query;

    let query = {};

    if (userId) query.user = userId;
    if (taskId) query.task = taskId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const timeLogs = await TimeLog.find(query)
      .populate('task', 'title status')
      .populate('user', 'name email')
      .sort({ date: -1, createdAt: -1 });

    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

    res.json({
      timeLogs,
      count: timeLogs.length,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1)
    });
  } catch (error) {
    console.error('Get all time logs error:', error);
    res.status(500).json({ message: 'Failed to get time logs.' });
  }
};

// Get the current user's active running timer (if any)
const getActiveTimer = async (req, res) => {
  try {
    const activeTimer = await TimeLog.findOne({
      user: req.user._id,
      type: 'timer',
      endTime: null
    })
      .sort({ startTime: -1 })
      .populate('task', 'title _id');

    res.json({ activeTimer: activeTimer || null });
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({ message: 'Failed to get active timer.' });
  }
};

module.exports = {
  createManualEntry,
  startTimer,
  stopTimer,
  getMyTimeLogs,
  getTaskTimeLogs,
  getAllTimeLogs,
  getActiveTimer
};