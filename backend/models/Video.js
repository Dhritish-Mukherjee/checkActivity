const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  // YouTube video ID — unique key
  videoId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
  },
  // Linked teacher (User with department=faculty). Null if not matched.
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Raw teacher alias extracted from the title (e.g. "Somnath Sir")
  teacherAlias: {
    type: String,
    default: null,
  },
  // Linked series
  series: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    default: null,
  },
  // Raw series name extracted from title (e.g. "Lali Series")
  seriesRaw: {
    type: String,
    default: null,
  },
  // Duration in seconds
  durationSeconds: {
    type: Number,
    default: 0,
  },
  // YouTube view count (refreshed daily)
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  youtubeUrl: {
    type: String,
    default: '',
  },
  publishedAt: {
    type: Date,
  },
  // When views were last refreshed from YouTube
  lastViewsRefresh: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Index for fast teacher queries
videoSchema.index({ teacher: 1, publishedAt: -1 });
videoSchema.index({ series: 1 });

module.exports = mongoose.model('Video', videoSchema);
