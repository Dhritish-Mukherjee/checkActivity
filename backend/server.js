const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// Disable express identification for security & SEO audits
app.disable('x-powered-by');

// Security & SEO Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/strivers-task')
.then(async () => {
  console.log('✅ MongoDB connected');

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
const healthRoutes = require('./routes/health');
const path = require('path');

// Explicit SEO endpoints (robots.txt, sitemap.xml)
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.resolve(__dirname, 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.resolve(__dirname, 'public', 'sitemap.xml'));
});

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
app.use('/api/health', healthRoutes);

// Direct health endpoint
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Basic route for API testing
app.get('/api', (req, res) => {
  res.json({ message: 'Strivers Task API' });
});

// Serve static files from the React frontend app with optimal cache headers
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.includes('/assets/')) {
      // Vite hashed build assets are cached long-term
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('.html')) {
      // HTML entry points are validated
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Catch-all route to serve the frontend's index.html for any other GET requests (for React Router)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
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