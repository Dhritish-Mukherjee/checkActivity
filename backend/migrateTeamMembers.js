const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Set isTeamMember: true for all users with role 'employee'
    const empResult = await User.updateMany(
      { role: 'employee' },
      { $set: { isTeamMember: true } }
    );
    console.log(`Updated ${empResult.modifiedCount} employee(s) to isTeamMember: true`);

    // 2. Set isTeamMember: true for the specific admin founder
    // Assuming founder is the admin created by seed.js (email: admin@strivers.co.in)
    const adminResult = await User.updateMany(
      { role: 'admin', email: 'admin@strivers.co.in' },
      { $set: { isTeamMember: true } }
    );
    console.log(`Updated ${adminResult.modifiedCount} founder admin(s) to isTeamMember: true`);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
};

migrate();
