const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');
const QuizLog = require('../models/QuizLog');

// Get dashboard statistics
const getStatistics = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const activeEmployees = await User.countDocuments({
      role: 'employee',
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Tasks completed this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const tasksCompletedThisWeek = await Task.countDocuments({
      status: 'completed',
      updatedAt: { $gte: weekStart }
    });

    // Total hours logged
    const timeLogsTotal = await TimeLog.aggregate([
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } }
    ]);

    const totalHours = timeLogsTotal.length > 0
      ? (timeLogsTotal[0].totalMinutes / 60).toFixed(1)
      : 0;

    // Total quizzes generated
    const totalQuizzesGenerated = await QuizLog.countDocuments();

    res.json({
      totalTasks,
      tasksCompletedThisWeek,
      totalEmployees,
      activeEmployees,
      totalHours,
      totalQuizzesGenerated
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Failed to get statistics.' });
  }
};

// Get hours logged per employee
const getHoursPerEmployee = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const timeLogs = await TimeLog.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$user',
          totalMinutes: { $sum: '$durationMinutes' },
          logCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          name: '$user.name',
          email: '$user.email',
          totalMinutes: 1,
          totalHours: { $divide: ['$totalMinutes', 60] },
          logCount: 1
        }
      },
      {
        $sort: { totalMinutes: -1 }
      }
    ]);

    res.json({ employees: timeLogs });
  } catch (error) {
    console.error('Get hours per employee error:', error);
    res.status(500).json({ message: 'Failed to get hours per employee.' });
  }
};

// Get task status breakdown
const getTaskStatusBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const tasks = await Task.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {
      todo: 0,
      in_progress: 0,
      completed: 0
    };

    tasks.forEach(item => {
      statusMap[item._id] = item.count;
    });

    res.json({
      status: statusMap,
      total: Object.values(statusMap).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('Get task status breakdown error:', error);
    res.status(500).json({ message: 'Failed to get task status breakdown.' });
  }
};

// Get time logged trend (last 7/30 days)
const getTimeTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dailyLogs = await TimeLog.aggregate([
        {
          $match: {
            date: {
              $gte: date,
              $lt: nextDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$durationMinutes' }
          }
        }
      ]);

      trend.push({
        date: date.toISOString().split('T')[0],
        hours: (dailyLogs.length > 0 ? dailyLogs[0].totalMinutes / 60 : 0).toFixed(2)
      });
    }

    res.json({ trend, days });
  } catch (error) {
    console.error('Get time trend error:', error);
    res.status(500).json({ message: 'Failed to get time trend.' });
  }
};

// Get employee time trend (last 7/30 days per user)
const getEmployeeTimeTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get all users who logged time in this period
    const activeUsersLogs = await TimeLog.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    const activeUsers = activeUsersLogs.map(log => ({ id: log._id, name: log.user.name }));
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dailyLogs = await TimeLog.aggregate([
        {
          $match: {
            date: {
              $gte: date,
              $lt: nextDate
            }
          }
        },
        {
          $group: {
            _id: '$user',
            totalMinutes: { $sum: '$durationMinutes' }
          }
        }
      ]);

      // Create map of userId -> hours for this day
      const userHours = {};
      dailyLogs.forEach(log => {
        userHours[log._id.toString()] = (log.totalMinutes / 60).toFixed(2);
      });

      const dayData = {
        date: date.toISOString().split('T')[0]
      };

      // Add 0 for users who didn't log time that day
      activeUsers.forEach(u => {
        dayData[u.name] = parseFloat(userHours[u.id.toString()] || 0);
      });

      trend.push(dayData);
    }

    res.json({ trend, days, users: activeUsers.map(u => u.name) });
  } catch (error) {
    console.error('Get employee time trend error:', error);
    res.status(500).json({ message: 'Failed to get employee time trend.' });
  }
};

// Get tasks completed per employee
const getTasksCompletedPerEmployee = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const tasks = await Task.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          name: '$user.name',
          email: '$user.email',
          completedTasks: '$count'
        }
      },
      {
        $sort: { completedTasks: -1 }
      }
    ]);

    res.json({ employees: tasks });
  } catch (error) {
    console.error('Get tasks completed error:', error);
    res.status(500).json({ message: 'Failed to get tasks completed.' });
  }
};

// Get employees summary with stats
const getEmployeesSummary = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('name email profilePicture department teacherStats youtubeAlias createdAt');

    const employeeStats = [];

    for (const employee of employees) {
      const tasksCount = await Task.countDocuments({
        assignedTo: employee._id
      });

      const completedTasks = await Task.countDocuments({
        assignedTo: employee._id,
        status: 'completed'
      });

      const timeLogs = await TimeLog.aggregate([
        { $match: { user: employee._id } },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$durationMinutes' },
            manualCount: {
              $sum: { $cond: [{ $eq: ['$type', 'manual'] }, 1, 0] }
            },
            timerCount: {
              $sum: { $cond: [{ $eq: ['$type', 'timer'] }, 1, 0] }
            }
          }
        }
      ]);

      employeeStats.push({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        profilePicture: employee.profilePicture,
        department: employee.department || null,
        teacherStats: employee.teacherStats || null,
        youtubeAlias: employee.youtubeAlias || null,
        createdAt: employee.createdAt,
        totalTasks: tasksCount,
        completedTasks,
        totalHours: (timeLogs.length > 0 ? timeLogs[0].totalMinutes / 60 : 0).toFixed(1),
        manualEntries: timeLogs.length > 0 ? timeLogs[0].manualCount : 0,
        timerEntries: timeLogs.length > 0 ? timeLogs[0].timerCount : 0
      });
    }

    res.json({ employees: employeeStats });
  } catch (error) {
    console.error('Get employees summary error:', error);
    res.status(500).json({ message: 'Failed to get employees summary.' });
  }
};

// Get quiz generation logs
const getQuizLogs = async (req, res) => {
  try {
    const logs = await QuizLog.find()
      .populate('user', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(50); // Get the 50 most recent

    res.json({ logs });
  } catch (error) {
    console.error('Get quiz logs error:', error);
    res.status(500).json({ message: 'Failed to get quiz logs.' });
  }
};

module.exports = {
  getStatistics,
  getHoursPerEmployee,
  getTaskStatusBreakdown,
  getTimeTrend,
  getEmployeeTimeTrend,
  getTasksCompletedPerEmployee,
  getEmployeesSummary,
  getQuizLogs
};