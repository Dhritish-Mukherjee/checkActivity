# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  React + Vite SPA                                                       │ │
│  │  - Tailwind CSS styling                                                 │ │
│  │  - React Router for navigation                                          │ │
│  │  - AuthContext for global state                                         │ │
│  │  - Axios for API calls                                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS.JS SERVER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │   Routes     │  │  Middleware  │  │ Controllers  │  │   Services    │   │
│  │  /api/auth   │  │  - auth.js   │  │  - auth      │  │ - youtubeSync  │   │
│  │  /api/tasks  │  │  - roleCheck │  │  - task      │  │                │   │
│  │  /api/timelog│  │              │  │  - timelog   │  │                │   │
│  │  /api/dash   │  │              │  │  - dashboard  │  │                │   │
│  │  /api/quiz   │  │              │  │  - youtube   │  │                │   │
│  │  /api/youtube│ │              │  │  - quiz      │  │                │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────┐
│    MongoDB      │  │  Python Process │  │     External APIs               │
│  (Database)     │  │  (Quiz Gen)     │  │  - YouTube Data API v3          │
│                 │  │                 │  │  - Google Gemini AI             │
│  Collections:   │  │  Scripts:       │  │                                 │
│  - users        │  │  generate_quiz.py│ │                                 │
│  - tasks        │  │                 │  │                                 │
│  - timelogs     │  │                 │  │                                 │
│  - videos       │  │                 │  │                                 │
│  - series       │  │                 │  │                                 │
│  - quizlogs     │  │                 │  │                                 │
└─────────────────┘  └─────────────────┘  └─────────────────────────────────┘
```

---

## Request Flow

### Authentication Flow
```
1. User submits email/password to POST /api/auth/login
2. Server validates credentials against MongoDB User collection
3. If valid, server generates JWT token (expires in 7 days)
4. Token returned to client, stored in localStorage
5. All subsequent requests include: Authorization: Bearer <token>
6. Middleware validates token and attaches user to req.user
```

### API Request Pipeline
```
Client Request
     │
     ▼
┌─────────────────┐
│  CORS Check     │ ← Validates origin against CORS_ORIGIN
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JSON Parser     │ ← Parses request body
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth Middleware│ ← Verifies JWT, attaches req.user
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Role Check     │ ← Validates user role (if required)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │ ← Business logic, validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Model/Database │ ← MongoDB queries via Mongoose
└────────┬────────┘
         │
         ▼
     JSON Response
```

---

## Data Flow Diagrams

### Task Creation Flow
```
Admin                     Frontend                  Backend              MongoDB
  │                          │                        │                    │
  │  Fill task form          │                        │                    │
  │─────────────────────────>│                        │                    │
  │                          │  POST /api/tasks       │                    │
  │                          │  {title, assignedTo,   │                    │
  │                          │   priority, dueDate}  │                    │
  │                          │───────────────────────>│                    │
  │                          │                        │  Validate users   │
  │                          │                        │───────────────────>│
  │                          │                        │<───────────────────│
  │                          │                        │  Create Task      │
  │                          │                        │───────────────────>│
  │                          │                        │<───────────────────│
  │                          │<───────────────────────│  201 Created      │
  │<─────────────────────────│  Show success          │                    │
  │                          │                        │                    │
```

### Time Logging Flow (Timer)
```
Employee                Frontend                  Backend              MongoDB
  │                        │                        │                    │
  │  Click "Start Timer"   │                        │                    │
  │───────────────────────>│                        │                    │
  │                        │  POST /api/timelogs/   │                    │
  │                        │  timer/start           │                    │
  │                        │───────────────────────>│                    │
  │                        │                        │  Create TimeLog    │
  │                        │                        │  (startTime set)   │
  │                        │                        │───────────────────>│
  │                        │<───────────────────────│  201 + timeLog     │
  │  Timer display active  │                        │                    │
  │<───────────────────────│                        │                    │
  │                        │                        │                    │
  │  ... time passes ...   │                        │                    │
  │                        │                        │                    │
  │  Click "Stop Timer"    │                        │                    │
  │───────────────────────>│                        │                    │
  │                        │  PATCH /api/timelogs/  │                    │
  │                        │  timer/:id/stop        │                    │
  │                        │───────────────────────>│                    │
  │                        │                        │  Calculate duration│
  │                        │                        │  Set endTime       │
  │                        │                        │───────────────────>│
  │                        │<───────────────────────│  200 + updated     │
  │<───────────────────────│  Show duration         │                    │
```

---

## Component Architecture (Frontend)

```
App.jsx
│
├── AuthProvider (Context)
│   └── useAuth() hook - available everywhere
│
├── BrowserRouter
│   │
│   ├── /login → LoginPage.jsx
│   │
│   └── /* → Layout.jsx (Protected)
│       │
│       ├── Sidebar.jsx
│       │   └── Navigation based on role
│       │
│       ├── GlobalTimerBanner.jsx
│       │   └── Shows active timer (if any)
│       │
│       └── Routes (by role)
│           │
│           ├── Admin Routes:
│           │   ├── / → Dashboard.jsx
│           │   ├── /tasks → ManageTasks.jsx
│           │   ├── /employees → Employees.jsx
│           │   ├── /employees/:id → EmployeeDetail.jsx
│           │   ├── /quiz-generator → QuizGenerator.jsx
│           │   └── /settings → Settings.jsx
│           │
│           └── Employee Routes:
│               ├── / → MyTasks.jsx
│               ├── /tasks/:id → TaskDetail.jsx
│               ├── /time-logs → MyTimeLogs.jsx
│               ├── /quiz-generator → QuizGenerator.jsx
│               └── /settings → Settings.jsx
```

---

## Backend Architecture

### Layered Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         Routes Layer                             │
│  - Define endpoints                                               │
│  - Apply middleware (auth, roleCheck)                            │
│  - Route to appropriate controller                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Controllers Layer                          │
│  - Handle HTTP request/response                                   │
│  - Input validation                                               │
│  - Call appropriate services/models                               │
│  - Format responses                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Models Layer                              │
│  - Mongoose schemas                                               │
│  - Database CRUD operations                                       │
│  - Data validation                                                 │
│  - Business logic hooks (pre-save, virtuals)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Service Layer (Business Logic)
```
┌─────────────────────────────────────────────────────────────────┐
│                       Services Layer                             │
│  - youtubeSync.js: YouTube API integration                      │
│    - syncAllStreams(): Full sync from YouTube                    │
│    - refreshViewCounts(): Daily view count update                │
│    - computeTeacherStats(): Aggregate teacher statistics        │
└─────────────────────────────────────────────────────────────────┘
```

---

## External Integrations

### YouTube Data API Integration
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  YouTube API    │────>│  youtubeSync.js │────>│    MongoDB      │
│                 │     │    Service      │     │                 │
│  Endpoints:     │     │                 │     │  Updates:       │
│  - /playlistItems   │  - Extract teacher    │  - Video docs   │
│  - /videos      │     │    from title        │  - User.teacherStats │
│                 │     │  - Match series      │                 │
│                 │     │  - Compute stats     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Quiz Generation Pipeline
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Input     │────>│  Express API    │────>│  Gemini AI      │
│  (Raw text)     │     │  Controller     │     │  Formatting     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Output PPTX    │<────│  Python Script  │<────│  Structured JSON│
│  (Download)     │     │  generate_quiz.py│    │  Questions      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Caching Strategy

### Frontend Cache (Axios Interceptor)
- 2-minute TTL for GET requests
- Cache bypassed for mutations (POST, PUT, PATCH, DELETE)
- `bypassCache: true` option for real-time data

### Backend Cache
- No server-side cache (stateless)
- YouTube data stored in MongoDB for fast retrieval
- Daily cron refreshes view counts

---

## Security Architecture

### Authentication
- JWT stored in localStorage (consider httpOnly cookies for production)
- Token included in Authorization header
- Token validation on every protected route

### Authorization
- Role-based access control (RBAC)
- Two roles: `admin`, `employee`
- `isTeamMember` flag for additional access
- Middleware checks role before controller execution

### Data Protection
- Passwords hashed with bcrypt (10 rounds)
- Password excluded from queries by default
- Input validation on both frontend and backend
- CORS restricted to known origins
