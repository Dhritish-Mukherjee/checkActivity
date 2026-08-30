# Environment Setup & Deployment

## Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/strivers-task

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS - Frontend URL
CORS_ORIGIN=http://localhost:5173

# YouTube API (Optional - for YouTube integration)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Gemini AI (Optional - for Quiz Engine AI formatting)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (.env)

Create a `.env` file in the `frontend/` directory:

```env
# API URL
VITE_API_URL=http://localhost:5000/api
```

For production, this can be set to `/api` if serving from the same origin.

---

## Local Development Setup

### Prerequisites
- Node.js v16 or higher
- MongoDB (local installation or Atlas)
- Python 3.8+ (for Quiz Engine)
- npm or yarn

### Step 1: Clone Repository
```bash
git clone https://github.com/Dhritish-Mukherjee/checkActivity.git
cd checkActivity
```

### Step 2: Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install-all

# Or manually:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Configure Environment

**Backend**:
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

**Frontend**:
```bash
cd frontend
cp .env.example .env
# Default works for local development
```

### Step 4: Set Up Python (Quiz Engine)
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install python-pptx pillow
```

### Step 5: Start MongoDB
```bash
# If using local MongoDB
mongod --dbpath /path/to/data

# Or use MongoDB Atlas connection string in MONGODB_URI
```

### Step 6: Run Development Servers
```bash
# From root directory - runs both frontend and backend
npm run dev

# Or separately:
npm run dev:backend  # Port 5000
npm run dev:frontend # Port 5173
```

### Step 7: Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

---

## Production Deployment

### Backend Deployment

#### Option 1: Traditional Server (VPS/Dedicated)

1. **Set up server**:
```bash
# Install Node.js, MongoDB, Python
sudo apt update
sudo apt install nodejs npm mongodb python3 python3-pip
```

2. **Clone and install**:
```bash
git clone https://github.com/Dhritish-Mukherjee/checkActivity.git
cd checkActivity/backend
npm install --production
```

3. **Set up Python**:
```bash
python3 -m venv venv
source venv/bin/activate
pip install python-pptx pillow
```

4. **Configure environment**:
```bash
# Create .env with production values
MONGODB_URI=mongodb://localhost:27017/strivers-task
JWT_SECRET=your_production_secret
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://task.strivers.co.in
YOUTUBE_API_KEY=your_key
GEMINI_API_KEY=your_key
```

5. **Use PM2 for process management**:
```bash
sudo npm install -g pm2
pm2 start server.js --name strivers-api
pm2 startup
pm2 save
```

#### Option 2: Cloud Platforms

**Heroku**:
```bash
# Create Procfile
echo "web: node server.js" > Procfile

# Deploy
heroku create strivers-api
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
# ... set all env vars
git push heroku master
```

**Railway/Render**:
- Connect GitHub repository
- Set environment variables in dashboard
- Deploy automatically on push

### Frontend Deployment

#### Build for Production
```bash
cd frontend
npm run build
# Output in dist/ folder
```

#### Option 1: Serve from Backend

The backend serves static files from `public/`:

```bash
# Copy built frontend to backend public folder
cp -r frontend/dist/* backend/public/
```

Backend configuration (`server.js`):
```javascript
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  }
});
```

#### Option 2: CDN/Separate Hosting

**Netlify/Vercel**:
```bash
# Set build command: npm run build
# Set output directory: dist
# Set environment variable: VITE_API_URL=https://api.strivers.co.in/api
```

---

## Database Setup

### Local MongoDB
```bash
# Install MongoDB
sudo apt install mongodb

# Start service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database (auto-created on first use)
# Connection string: mongodb://localhost:27017/strivers-task
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/strivers-task?retryWrites=true&w=majority
```
4. Set `MONGODB_URI` environment variable

### Database Initialization
The database is automatically initialized when the server starts. No migration scripts are needed.

---

## API Keys Setup

### YouTube Data API
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Set `YOUTUBE_API_KEY` in `.env`

**Required Quota**:
- `playlistItems.list` - for fetching uploads
- `videos.list` - for video details
- Estimated: ~200 units/day for daily sync

### Google Gemini API
1. Go to Google AI Studio: https://makersuite.google.com/app/apikey
2. Create API key
3. Set `GEMINI_API_KEY` in `.env`

**Model Used**: `gemini-2.5-flash-lite`

---

## SSL/HTTPS Setup

### Using Nginx (Reverse Proxy)
```nginx
server {
    listen 443 ssl;
    server_name task.strivers.co.in;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name task.strivers.co.in;
    return 301 https://$server_name$request_uri;
}
```

### Using Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d task.strivers.co.in
```

---

## Cron Job Setup

### Automated YouTube View Refresh

The server has a built-in cron job that runs daily at 2:00 AM IST (20:30 UTC):

```javascript
// In server.js
cron.schedule('30 20 * * *', async () => {
  await refreshViewCounts(process.env.YOUTUBE_API_KEY);
}, { timezone: 'UTC' });
```

### Manual Cron (Alternative)
If you prefer system-level cron:
```bash
crontab -e

# Add line:
30 20 * * * curl -X POST https://task.strivers.co.in/api/youtube/refresh-views
```

---

## Production Checklist

### Security
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure CORS to specific domain
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Use environment variables (never commit secrets)

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Enable MongoDB connection pooling
- [ ] Configure proper caching headers

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging
- [ ] Monitor PM2 process
- [ ] Set up uptime monitoring

### Backup
- [ ] Configure MongoDB backups
- [ ] Backup `.env` files securely
- [ ] Document deployment process

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**:
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start if not running
sudo systemctl start mongodb

# Check connection string in .env
```

**JWT Secret Not Set**:
```bash
# Error: "secret must be a string"
# Fix: Set JWT_SECRET in .env
JWT_SECRET=your_secret_here
```

**CORS Error**:
```bash
# Frontend can't reach backend
# Fix: Set CORS_ORIGIN in backend/.env
CORS_ORIGIN=https://your-frontend-domain.com
```

**Python Script Fails**:
```bash
# Check Python environment
cd backend
source venv/bin/activate
python scripts/generate_quiz.py --help

# Install missing dependencies
pip install python-pptx pillow
```

**YouTube API Quota Exceeded**:
- Check quota in Google Cloud Console
- Request higher quota if needed
- Reduce sync frequency

---

## Default Credentials

After seeding (if seed script is run):
- **Admin**: admin@strivers.co.in / admin123
- **Employee**: rahul@strivers.co.in / employee123

**Important**: Change these in production!

---

## File Permissions

Ensure proper permissions for:
```bash
# Outputs folder (generated quiz files)
chmod 755 backend/outputs

# Templates folder
chmod 755 backend/templates

# Upload folder
chmod 755 backend/public
```

---

## Health Check

API health endpoint:
```bash
curl http://localhost:5000/api
# Expected: {"message": "Strivers Task API"}
```
