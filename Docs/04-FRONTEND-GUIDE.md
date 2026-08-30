# Frontend Guide

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| Vite | Latest | Build tool and dev server |
| React Router | v6 | Client-side routing |
| Tailwind CSS | 3.x | Utility-first styling |
| Chart.js | 4.x | Data visualization |
| Axios | Latest | HTTP client |
| Framer Motion | Latest | Animations |
| Lucide React | Latest | Icon library |

---

## Project Structure

```
frontend/
├── public/                    # Static assets
│   └── logo.png              # Strivers logo
│
├── src/
│   ├── components/           # Reusable components
│   │   ├── CatLoader.jsx     # Loading animation
│   │   ├── GlobalTimerBanner.jsx  # Active timer display
│   │   ├── Layout.jsx        # Main layout wrapper
│   │   └── Sidebar.jsx       # Navigation sidebar
│   │
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state
│   │
│   ├── pages/
│   │   ├── admin/            # Admin-only pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── EmployeeDetail.jsx
│   │   │   ├── ManageTasks.jsx
│   │   │   ├── QuizGenerator.jsx
│   │   │   └── YoutubeStreams.jsx
│   │   │
│   │   ├── employee/         # Employee pages
│   │   │   ├── MyTasks.jsx
│   │   │   ├── MyTimeLogs.jsx
│   │   │   └── TaskDetail.jsx
│   │   │
│   │   ├── LoginPage.jsx     # Public login page
│   │   └── Settings.jsx      # User settings
│   │
│   ├── services/
│   │   └── index.js          # API client and endpoints
│   │
│   ├── App.jsx               # Main app with routing
│   ├── App.css               # Custom styles
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
│
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
└── package.json
```

---

## Core Components

### 1. App.jsx
Main application component that sets up routing and authentication.

```jsx
// Key responsibilities:
// - Wraps app in AuthProvider
// - Sets up BrowserRouter
// - Routes to Login or Layout based on auth state
```

**Routes**:
- `/login` → LoginPage (public)
- `/*` → Layout (protected)

---

### 2. AuthContext.jsx
Global authentication state management using React Context.

**Provided Values**:
```javascript
{
  user: Object | null,          // Current user data
  loading: boolean,             // Initial auth check in progress
  login: (email, password),     // Login function
  logout: (),                   // Logout function
  register: (userData),         // Register function
  updateUser: (newData),        // Update user state
  isAuthenticated: boolean,     // Is user logged in?
  isAdmin: boolean,             // Is user role === 'admin'?
  isEmployee: boolean,          // Is user role === 'employee'?
  isTeamMember: boolean         // Does user have team access?
}
```

**Usage**:
```jsx
import { useAuth } from './context/AuthContext';

const MyComponent = () => {
  const { user, isAdmin, logout } = useAuth();
  
  return (
    <div>
      <p>Hello, {user?.name}</p>
      {isAdmin && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

### 3. Layout.jsx
Main layout wrapper with responsive sidebar and content area.

**Features**:
- Responsive sidebar (collapsible on mobile)
- Ambient background glow effects
- Active timer banner for team members
- Role-based routing

**Routing Structure**:
```jsx
// Admin routes
isAdmin ? (
  <>
    <Route path="/" element={<AdminDashboard />} />
    <Route path="/tasks" element={<ManageTasks />} />
    {isTeamMember && (
      <>
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/time-logs" element={<MyTimeLogs />} />
      </>
    )}
    <Route path="/employees" element={<EmployeesPage />} />
    <Route path="/quiz-generator" element={<QuizGenerator />} />
  </>
) : (
  // Employee routes
  <>
    <Route path="/" element={<MyTasks />} />
    <Route path="/tasks/:id" element={<TaskDetail />} />
    <Route path="/time-logs" element={<MyTimeLogs />} />
    <Route path="/quiz-generator" element={<QuizGenerator />} />
  </>
)
```

---

### 4. Sidebar.jsx
Navigation sidebar with role-based links.

**Admin Links**:
- Dashboard (`/`)
- All Tasks (`/tasks`)
- My Tasks (`/my-tasks`) - if isTeamMember
- Time Logs (`/time-logs`) - if isTeamMember
- Team Members (`/employees`)
- Quiz Engine (`/quiz-generator`)
- Settings (`/settings`)

**Employee Links**:
- My Tasks (`/`)
- Time Logs (`/time-logs`)
- Quiz Engine (`/quiz-generator`)
- Settings (`/settings`)

---

### 5. GlobalTimerBanner.jsx
Displays active timer at the top of the page for team members.

**Features**:
- Shows current running timer
- Displays elapsed time
- Quick stop button
- Auto-refreshes every second

---

### 6. CatLoader.jsx
Animated loading component.

**Usage**:
```jsx
<CatLoader text="Loading Dashboard..." />
```

---

## Pages Overview

### Admin Pages

#### Dashboard.jsx (`pages/admin/Dashboard.jsx`)
Main analytics dashboard with charts and statistics.

**Features**:
- 5 stat cards (tasks, completed, hours, employees, quizzes)
- Hours logged per employee (bar chart)
- Task status distribution (doughnut chart)
- 7-day time trend (line chart)
- 7-day activity by employee (stacked bar chart)
- Quiz generation history table
- YouTube streams section

**API Calls**:
```javascript
Promise.all([
  dashboardAPI.getStatistics(),
  dashboardAPI.getHoursPerEmployee(),
  dashboardAPI.getTaskStatusBreakdown(),
  dashboardAPI.getTimeTrend({ days: 7 }),
  dashboardAPI.getEmployeeTimeTrend({ days: 7 }),
  dashboardAPI.getQuizLogs()
])
```

---

#### ManageTasks.jsx (`pages/admin/ManageTasks.jsx`)
Task management interface for admins.

**Features**:
- Create new tasks
- Edit existing tasks
- Delete tasks
- Filter by status, priority, assignee
- Search tasks
- Bulk operations

---

#### Employees.jsx (`pages/admin/Employees.jsx`)
Team member management.

**Features**:
- List all team members
- Add new employee
- View employee details
- Delete employee
- Filter by department

---

#### EmployeeDetail.jsx (`pages/admin/EmployeeDetail.jsx`)
Individual employee profile and stats.

**Features**:
- Employee info card
- Task statistics
- Time log summary
- YouTube teacher stats (if faculty)

---

#### QuizGenerator.jsx (`pages/admin/QuizGenerator.jsx`)
Quiz/PowerPoint generation interface.

**Features**:
- Template selection
- Raw question input
- Optional cover image upload
- Real-time generation console (SSE)
- Download generated PPTX

---

#### YoutubeStreams.jsx (`pages/admin/YoutubeStreams.jsx`)
YouTube channel integration.

**Features**:
- Recent videos grid
- Sync status display
- Manual sync trigger
- Teacher assignments
- Series management

---

### Employee Pages

#### MyTasks.jsx (`pages/employee/MyTasks.jsx`)
Personal task list for employees.

**Features**:
- List assigned tasks
- Filter by status
- View task details
- Update task status

---

#### TaskDetail.jsx (`pages/employee/TaskDetail.jsx`)
Individual task view with time logging.

**Features**:
- Task information
- Status update
- Start/stop timer
- Manual time entry
- Time log history

---

#### MyTimeLogs.jsx (`pages/employee/MyTimeLogs.jsx`)
Personal time log history.

**Features**:
- List all time entries
- Filter by date range
- Filter by task
- Total hours summary

---

### Shared Pages

#### LoginPage.jsx (`pages/LoginPage.jsx`)
Public login form.

**Features**:
- Email/password inputs
- Form validation
- Error display
- Redirect after login

---

#### Settings.jsx (`pages/Settings.jsx`)
User settings page.

**Features**:
- Profile picture update
- Account information display

---

## API Service Layer (`services/index.js`)

### Axios Instance Configuration
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
});
```

### Request Interceptor
Automatically adds JWT token to all requests:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor
Handles 401 errors globally:
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);
```

### Caching Layer
2-minute TTL cache for GET requests:
```javascript
// Bypass cache with bypassCache option
api.get('/endpoint', { bypassCache: true });
```

### API Methods

```javascript
// Authentication
authAPI.login(email, password)
authAPI.register(userData)
authAPI.updateProfile(data)
authAPI.getCurrentUser()
authAPI.getEmployees()
authAPI.getAllUsers()
authAPI.deleteEmployee(id)

// Tasks
taskAPI.getAllTasks(params)
taskAPI.getMyTasks(params)
taskAPI.getTaskById(id)
taskAPI.createTask(taskData)
taskAPI.updateTask(id, taskData)
taskAPI.updateTaskStatus(id, status)
taskAPI.deleteTask(id)

// Time Logs
timeLogAPI.getMyTimeLogs(params)
timeLogAPI.getActiveTimer()
timeLogAPI.getTaskTimeLogs(taskId)
timeLogAPI.getAllTimeLogs(params)
timeLogAPI.createManualEntry(data)
timeLogAPI.startTimer(taskId)
timeLogAPI.stopTimer(id, data)

// Dashboard
dashboardAPI.getStatistics()
dashboardAPI.getHoursPerEmployee(params)
dashboardAPI.getTaskStatusBreakdown(params)
dashboardAPI.getTimeTrend(params)
dashboardAPI.getEmployeeTimeTrend(params)
dashboardAPI.getTasksCompletedPerEmployee(params)
dashboardAPI.getEmployeesSummary()
dashboardAPI.getQuizLogs()

// YouTube
youtubeAPI.getRecentStreams(limit, type)
youtubeAPI.getSyncStatus()
youtubeAPI.getTeachers()
youtubeAPI.getSeries()
youtubeAPI.triggerSync()
youtubeAPI.refreshViews()
youtubeAPI.updateVideoTeacher(id, teacherId)
```

---

## Styling Guide

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Custom CSS Classes

**Card Style**:
```html
<div class="card">
  <!-- Content -->
</div>
```

Defined in `index.css`:
```css
.card {
  @apply bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm;
}
```

**Button Styles**:
```html
<button class="btn-primary">Primary Action</button>
```

**Text Gradient**:
```html
<span class="text-gradient">Gradient Text</span>
```

### Color Palette
- Primary: `indigo-500` / `indigo-600`
- Success: `emerald-500`
- Warning: `amber-500`
- Danger: `rose-500`
- Background: `slate-950` / `slate-900`
- Text: `slate-100` / `slate-300` / `slate-400`

---

## Animation Effects

### Ambient Glow Orbs
Background decorative elements:
```jsx
<div className="fixed top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none animate-float" />
```

### Framer Motion
Used for page transitions and UI animations:
```jsx
import { motion, AnimatePresence } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95 }}
>
  {content}
</motion.div>
```

---

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Considerations
- Sidebar is hidden by default, toggled via hamburger menu
- Touch-friendly button sizes
- Responsive grid layouts

```jsx
// Example responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items}
</div>
```

---

## Environment Variables

```env
# .env
VITE_API_URL=http://localhost:5000/api
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const isProduction = import.meta.env.PROD;
```

---

## Building for Production

```bash
# Build the frontend
npm run build

# Output in dist/ folder
# Serve with any static file server
```

The built files are configured to be served from the backend's `public/` folder for deployment.
