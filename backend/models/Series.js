const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // 'free' = fully free (Udyam), 'partial_free' = partially free (Lali)
  type: {
    type: String,
    enum: ['free', 'partial_free'],
    default: 'free',
  },
  description: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Keywords used to match this series from video titles (case-insensitive)
  keywords: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Series', seriesSchema);
