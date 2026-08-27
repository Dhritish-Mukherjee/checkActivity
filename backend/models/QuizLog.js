const mongoose = require('mongoose');

const quizLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  outputFileName: {
    type: String,
    required: true
  },
  templateUsed: {
    type: String,
    required: true
  },
  questionCount: {
    type: Number,
    required: true
  },
  rawQuestions: {
    type: String,
    required: true
  },
  structuredQuestions: {
    type: Array,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizLog', quizLogSchema);
