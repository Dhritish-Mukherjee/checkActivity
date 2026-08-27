const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },
  isTeamMember: {
    type: Boolean,
    default: false
  },
  department: [{
    type: String,
    enum: ['faculty', 'tech', 'promotional', 'owners_club']
  }],
  // For faculty: the name alias that appears in YouTube video titles (e.g. "Somnath Sir")
  youtubeAlias: {
    type: String,
    default: null,
    trim: true,
  },
  // Aggregated YouTube stats — computed from the Video collection on each sync
  teacherStats: {
    totalViews:   { type: Number, default: 0 },
    totalHours:   { type: Number, default: 0 },
    totalClasses: { type: Number, default: 0 },
    currentSeries:{ type: String, default: null },
    lastSyncedAt: { type: Date,   default: null },
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Hash password and update timestamp before saving
userSchema.pre('save', async function() {
  // Always update timestamp
  this.updatedAt = Date.now();

  // Only hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);