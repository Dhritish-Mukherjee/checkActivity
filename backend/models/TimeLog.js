const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  type: {
    type: String,
    enum: ['manual', 'timer'],
    required: true
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  durationMinutes: {
    type: Number,
    required: false,
    default: 0,
    min: [0, 'Duration cannot be negative'],
    max: [1440, 'Duration cannot exceed 24 hours (1440 minutes)']
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes for efficient queries
timeLogSchema.index({ task: 1 });
timeLogSchema.index({ user: 1 });
timeLogSchema.index({ date: 1 });
timeLogSchema.index({ type: 1 });

// Virtual for formatted duration
timeLogSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.durationMinutes / 60);
  const minutes = this.durationMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Ensure virtuals are included in JSON output
timeLogSchema.set('toJSON', { virtuals: true });
timeLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TimeLog', timeLogSchema);