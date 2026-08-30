# Strivers Platform - Complete Documentation

## Project Overview

**Strivers Platform** is an internal task management, time tracking, and content generation system built for the Strivers edtech organization. It serves as a centralized workspace for managing team activities, tracking work hours, generating educational quiz content, and monitoring YouTube channel performance.

### Purpose
This platform streamlines internal operations by providing:
- Task assignment and progress tracking
- Employee time logging (manual entry and live timer)
- Automated quiz/PowerPoint generation with AI
- YouTube analytics integration for faculty performance tracking
- Admin dashboard with real-time analytics

### Target Users
1. **Administrators**: Full access to all features including employee management, task creation, analytics, and YouTube integration
2. **Team Members (Employees)**: Access to their assigned tasks, time logging, and quiz generation

---

## Tech Stack Summary

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Chart.js + react-chartjs-2 | Data visualization |
| Axios | HTTP client |
| Framer Motion | Animations |
| Canvas Confetti | UI celebrations |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database and ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Google Gemini AI | Quiz question formatting |
| Python 3 | PowerPoint generation |
| node-cron | Scheduled tasks |

### External APIs
- **YouTube Data API v3**: Fetch channel videos, streams, view counts
- **Google Gemini API**: AI-powered question formatting and translation

---

## Project Structure

```
checkActivity/
├── backend/                    # Express.js API server
│   ├── config/                 # Database configuration
│   ├── controllers/            # Request handlers
│   ├── middleware/             # Auth & role validation
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API route definitions
│   ├── scripts/                # Python quiz generator
│   ├── services/               # Business logic (YouTube sync)
│   ├── templates/              # PowerPoint templates
│   ├── outputs/                # Generated files (quiz PPTX)
│   ├── public/                 # Static frontend build
│   └── server.js               # Entry point
│
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React Context (Auth)
│   │   ├── pages/
│   │   │   ├── admin/          # Admin-only pages
│   │   │   └── employee/       # Employee pages
│   │   ├── services/           # API client
│   │   ├── App.jsx             # Main app with routing
│   │   └── main.jsx            # Entry point
│   └── public/                 # Static assets
│
├── Docs/                       # This documentation
├── package.json                # Root scripts
└── README.md                   # Quick start guide
```

---

## Core Features

### 1. Authentication & Authorization
- JWT-based authentication with 7-day token expiry
- Role-based access control (admin/employee)
- Protected routes on both frontend and backend
- Team member flag (`isTeamMember`) for additional access

### 2. Task Management
- Create, assign, update, and delete tasks
- Task statuses: `todo` → `accepted` → `in_progress` → `completed`
- Priority levels: low, medium, high
- Multi-assignee support
- Due dates and filtering

### 3. Time Tracking
- **Manual Entry**: Log hours/minutes for a specific date
- **Live Timer**: Start/stop timer with automatic duration calculation
- Active timer persists across page navigation
- Time logs linked to specific tasks

### 4. Quiz Engine (Content Generation)
- Convert raw text questions to bilingual (English/Bengali) PowerPoint
- AI-powered question formatting via Google Gemini
- Custom cover images
- Multiple template support
- Server-sent events (SSE) for real-time progress

### 5. YouTube Integration
- Sync all videos from Strivers YouTube channel
- Extract teacher names from video titles
- Track views, likes, duration per video
- Aggregate teacher statistics
- Daily automated view count refresh (cron job)

### 6. Analytics Dashboard
- Real-time statistics cards
- Interactive charts (Chart.js)
- Hours logged per employee
- Task status distribution
- 7-day activity trends
- Quiz generation history

---

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Python 3.8+ (for quiz generation)
- YouTube API key (optional, for YouTube features)
- Gemini API key (for AI quiz formatting)

### Installation

```bash
# Clone the repository
git clone https://github.com/Dhritish-Mukherjee/checkActivity.git
cd checkActivity

# Install all dependencies (root, backend, frontend)
npm run install-all

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your configuration

# Frontend setup
cd ../frontend
cp .env.example .env
# Edit .env if needed (default works for local dev)
```

### Running the Application

```bash
# From root directory - runs both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend  # Port 5000
npm run dev:frontend # Port 5173
```

### Default Credentials
- **Admin**: admin@strivers.co.in / admin123
- **Employee**: rahul@strivers.co.in / employee123

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [01-ARCHITECTURE.md](./01-ARCHITECTURE.md) | System architecture and data flow |
| [02-DATABASE-MODELS.md](./02-DATABASE-MODELS.md) | MongoDB schemas and relationships |
| [03-API-ENDPOINTS.md](./03-API-ENDPOINTS.md) | Complete API reference |
| [04-FRONTEND-GUIDE.md](./04-FRONTEND-GUIDE.md) | Frontend structure and components |
| [05-AUTHENTICATION.md](./05-AUTHENTICATION.md) | Auth flow and security |
| [06-FEATURES.md](./06-FEATURES.md) | Feature implementation details |
| [07-ENVIRONMENT-SETUP.md](./07-ENVIRONMENT-SETUP.md) | Environment variables and deployment |
| [08-YOUTUBE-INTEGRATION.md](./08-YOUTUBE-INTEGRATION.md) | YouTube sync functionality |
| [09-QUIZ-ENGINE.md](./09-QUIZ-ENGINE.md) | Quiz generation system |
