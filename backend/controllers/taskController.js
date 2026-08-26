const Task = require('../models/Task');
const User = require('../models/User');

// Create a new task (admin only)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;

    // Validation
    if (!title || !assignedTo || assignedTo.length === 0) {
      return res.status(400).json({
        message: 'Title and at least one assignee are required.'
      });
    }

    // Verify all assigned users exist and are employees
    const employees = await User.find({
      _id: { $in: assignedTo },
      role: 'employee'
    });

    if (employees.length !== assignedTo.length) {
      return res.status(400).json({
        message: 'One or more assigned users are invalid or not employees.'
      });
    }

    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      assignedTo,
      assignedBy: req.user._id,
      priority: priority || 'medium',
      dueDate: dueDate || null
    });

    await task.save();

    // Populate references for response
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task.' });
  }
};

// Get all tasks (admin only)
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, search, sortBy, sortOrder } = req.query;

    let query = {};

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = { $in: [assignedTo] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort(sort);

    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks.' });
  }
};

// Get my tasks (employee)
const getMyTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;

    let query = { assignedTo: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks.' });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check access: admin can view any, employee can only view their assigned tasks
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(
        assignee => assignee._id.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }
    res.status(500).json({ message: 'Failed to get task.' });
  }
};

// Update task (admin only)
const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Update fields
    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (assignedTo && assignedTo.length > 0) {
      // Verify all assigned users exist and are employees
      const employees = await User.find({
        _id: { $in: assignedTo },
        role: 'employee'
      });
      if (employees.length !== assignedTo.length) {
        return res.status(400).json({
          message: 'One or more assigned users are invalid or not employees.'
        });
      }
      task.assignedTo = assignedTo;
    }
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task.' });
  }
};

// Update task status (employee can update their own tasks)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['todo', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        message: 'Valid status is required (todo, in_progress, completed).'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check access: admin can update any, employee can only update their assigned tasks
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(
        assigneeId => assigneeId.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    task.status = status;
    await task.save();

    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Failed to update task status.' });
  }
};

// Delete task (admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await task.deleteOne();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask
};