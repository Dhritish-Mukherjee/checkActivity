const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const TimeLog = require('./models/TimeLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/strivers-task');
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Task.deleteMany({});
    await TimeLog.deleteMany({});
    console.log('Cleared existing data');

    const admin = new User({ name: 'Strivers Admin', email: 'admin@strivers.co.in', password: 'admin123', role: 'admin', isTeamMember: true });
    await admin.save();
    console.log('Admin created: admin@strivers.co.in / admin123');

    console.log('Creating initial employees...');
    const rahul = new User({ name: 'Rahul Sharma', email: 'rahul@strivers.co.in', password: 'employee123', role: 'employee', isTeamMember: true });
    const priya = new User({ name: 'Priya Patel', email: 'priya@strivers.co.in', password: 'employee123', role: 'employee', isTeamMember: true });
    const amit = new User({ name: 'Amit Kumar', email: 'amit@strivers.co.in', password: 'employee123', role: 'employee', isTeamMember: true });
    await rahul.save();
    await priya.save();
    await amit.save();
    console.log('Created 3 employee accounts (password: employee123)');

    const day = 24 * 60 * 60 * 1000;
    const tasks = await Task.insertMany([
      {
        title: 'Design New Course Curriculum',
        description: 'Draft the modules for the upcoming React & Node.js bootcamp.',
        assignedTo: [rahul._id, priya._id],
        assignedBy: admin._id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 5 * day)
      },
      {
        title: 'Fix Authentication Bugs',
        description: 'Resolve issues with JWT expiration and refresh tokens.',
        assignedTo: [amit._id],
        assignedBy: admin._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * day)
      },
      {
        title: 'Create Marketing Banners',
        description: 'Design social media banners for the new course launch.',
        assignedTo: [priya._id],
        assignedBy: admin._id,
        status: 'completed',
        priority: 'medium',
        dueDate: new Date(Date.now() - 2 * day)
      },
      {
        title: 'Write API Documentation',
        description: 'Document all REST endpoints for internal developer reference.',
        assignedTo: [rahul._id],
        assignedBy: admin._id,
        status: 'todo',
        priority: 'low',
        dueDate: new Date(Date.now() + 10 * day)
      }
    ]);
    console.log('Created 4 sample tasks');

    await TimeLog.insertMany([
      {
        task: tasks[0]._id,
        user: rahul._id,
        type: 'manual',
        durationMinutes: 120,
        note: 'Researched module structure and topics',
        date: new Date(Date.now() - 3 * day)
      },
      {
        task: tasks[0]._id,
        user: priya._id,
        type: 'timer',
        startTime: new Date(Date.now() - 2 * day - 90 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * day),
        durationMinutes: 90,
        note: 'Worked on React section outline',
        date: new Date(Date.now() - 2 * day)
      },
      {
        task: tasks[2]._id,
        user: priya._id,
        type: 'manual',
        durationMinutes: 180,
        note: 'Finalized banner designs for Instagram and LinkedIn',
        date: new Date(Date.now() - 1 * day)
      }
    ]);
    console.log('Created sample time logs');

    console.log('\nSeeding complete!');
    console.log('Admin:    admin@strivers.co.in    / admin123');
    console.log('Employee: rahul@strivers.co.in    / employee123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
