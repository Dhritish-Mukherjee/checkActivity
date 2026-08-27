const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/strivers-task')
.then(async () => {
  console.log('✅ MongoDB connected');

  // Seed series data (idempotent — skips if already exists)
  const Series = require('./models/Series');
  const SERIES_SEED = [
    {
      name: 'Lali Series',
      slug: 'lali',
      type: 'partial_free',
      description: 'Partially free ongoing series covering exam-focused MCQ practice.',
      isActive: true,
      keywords: ['lali series', 'lali'],
    },
    {
      name: 'Udyam Series',
      slug: 'udyam',
      type: 'free',
      description: 'Fully free series for WBP, KP, SSC GD, Panchayat aspirants.',
      isActive: true,
      keywords: ['udyam series', 'udyam'],
    },
  ];
  for (const s of SERIES_SEED) {
    await Series.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
  }
  console.log('✅ Series seeded (Lali, Udyam)');

  // Daily cron: refresh YouTube view counts at 2:00 AM IST (8:30 PM UTC)
  if (process.env.YOUTUBE_API_KEY) {
    const { refreshViewCounts } = require('./services/youtubeSync');
    cron.schedule('30 20 * * *', async () => {
      console.log('⏰ [Cron] Daily view count refresh triggered');
      try {
        await refreshViewCounts(process.env.YOUTUBE_API_KEY);
      } catch (err) {
        console.error('⏰ [Cron] View refresh failed:', err.message);
      }
    }, { timezone: 'UTC' });
    console.log('⏰ Daily view refresh cron scheduled (2:00 AM IST)');
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const timeLogRoutes = require('./routes/timelogs');
const dashboardRoutes = require('./routes/dashboard');
const quizGeneratorRoutes = require('./routes/quizGenerator');
const youtubeRoutes = require('./routes/youtube');
const path = require('path');

// Serve quiz generator statics
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timelogs', timeLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quiz-generator', quizGeneratorRoutes);
app.use('/api/youtube', youtubeRoutes);

// Basic route for API testing
app.get('/api', (req, res) => {
  res.json({ message: 'Strivers Task API' });
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the frontend's index.html for any other GET requests (for React Router)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});