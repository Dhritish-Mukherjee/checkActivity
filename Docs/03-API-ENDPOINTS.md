# API Endpoints Reference

## Base URL
- Development: `http://localhost:5000/api`
- Production: `/api` (same origin)

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints (`/api/auth`)

### POST /api/auth/login
Login and receive JWT token.

**Access**: Public

**Request Body**:
```json
{
  "email": "admin@strivers.co.in",
  "password": "admin123"
}
```

**Response (200)**:
```json
{
  "message": "Login successful",
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@strivers.co.in",
    "role": "admin",
    "isTeamMember": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- 400: Email and password required
- 401: Invalid email or password

---

### POST /api/auth/register
Create a new user account.

**Access**: Admin only

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@strivers.co.in",
  "password": "password123",
  "role": "employee",
  "department": ["faculty"],
  "isTeamMember": true
}
```

**Response (201)**:
```json
{
  "message": "User created successfully",
  "user": { ... }
}
```

**Errors**:
- 400: Missing required fields or user already exists
- 403: Admin access required

---

### GET /api/auth/me
Get current authenticated user profile.

**Access**: Authenticated users

**Response (200)**:
```json
{
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@strivers.co.in",
    "role": "admin",
    "isTeamMember": true,
    "department": ["tech"],
    "teacherStats": { ... }
  }
}
```

---

### PUT /api/auth/profile
Update current user profile.

**Access**: Authenticated users

**Request Body**:
```json
{
  "profilePicture": "https://example.com/avatar.jpg"
}
```

**Response (200)**:
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### GET /api/auth/employees
Get all team members.

**Access**: Admin only

**Response (200)**:
```json
{
  "employees": [
    {
      "_id": "...",
      "name": "Rahul Kumar",
      "email": "rahul@strivers.co.in",
      "role": "employee",
      "isTeamMember": true,
      "department": ["faculty"]
    }
  ]
}
```

---

### GET /api/auth/users
Get all team members for task assignment.

**Access**: Authenticated users

**Response (200)**:
```json
{
  "users": [
    {
      "_id": "...",
      "name": "Rahul Kumar",
      "email": "rahul@strivers.co.in"
    }
  ]
}
```

---

### GET /api/auth/users/:id
Get user by ID.

**Access**: Admin only

**Response (200)**:
```json
{
  "user": { ... }
}
```

---

### DELETE /api/auth/users/:id
Delete a user (cannot delete admins).

**Access**: Admin only

**Response (200)**:
```json
{
  "message": "Employee deleted successfully."
}
```

**Errors**:
- 403: Cannot delete an admin
- 404: User not found

---

## Task Endpoints (`/api/tasks`)

### POST /api/tasks
Create a new task.

**Access**: Authenticated users (typically admin)

**Request Body**:
```json
{
  "title": "Create Physics Quiz Chapter 5",
  "description": "Generate 25 MCQs for the chapter",
  "assignedTo": ["userId1", "userId2"],
  "priority": "high",
  "dueDate": "2024-02-15T00:00:00.000Z"
}
```

**Response (201)**:
```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "...",
    "title": "Create Physics Quiz Chapter 5",
    "description": "Generate 25 MCQs for the chapter",
    "assignedTo": [
      { "_id": "...", "name": "Rahul Kumar", "email": "rahul@strivers.co.in" }
    ],
    "assignedBy": { "_id": "...", "name": "Admin", "email": "admin@strivers.co.in" },
    "status": "todo",
    "priority": "high",
    "dueDate": "2024-02-15T00:00:00.000Z"
  }
}
```

---

### GET /api/tasks/all
Get all tasks (admin view).

**Access**: Admin only

**Query Parameters**:
- `status`: Filter by status (todo, accepted, in_progress, completed)
- `priority`: Filter by priority (low, medium, high)
- `assignedTo`: Filter by assigned user ID
- `search`: Search in title and description
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: asc or desc (default: desc)

**Response (200)**:
```json
{
  "tasks": [ ... ],
  "count": 15
}
```

---

### GET /api/tasks/my
Get tasks assigned to current user.

**Access**: Authenticated users

**Query Parameters**:
- `status`: Filter by status
- `priority`: Filter by priority

**Response (200)**:
```json
{
  "tasks": [ ... ],
  "count": 5
}
```

---

### GET /api/tasks/:id
Get a specific task by ID.

**Access**: Authenticated users (admin or assigned employee)

**Response (200)**:
```json
{
  "task": {
    "_id": "...",
    "title": "...",
    "description": "...",
    "assignedTo": [ ... ],
    "assignedBy": { ... },
    "status": "in_progress",
    "priority": "high",
    "dueDate": "..."
  }
}
```

**Errors**:
- 403: Access denied (not assigned)
- 404: Task not found

---

### PUT /api/tasks/:id
Update a task (full update).

**Access**: Admin only

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "assignedTo": ["userId1"],
  "priority": "medium",
  "dueDate": "2024-02-20T00:00:00.000Z"
}
```

**Response (200)**:
```json
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

---

### PATCH /api/tasks/:id/status
Update task status only.

**Access**: Admin or assigned employee

**Request Body**:
```json
{
  "status": "completed"
}
```

**Valid Statuses**: `todo`, `accepted`, `in_progress`, `completed`

**Response (200)**:
```json
{
  "message": "Task status updated successfully",
  "task": { ... }
}
```

---

### DELETE /api/tasks/:id
Delete a task.

**Access**: Admin only

**Response (200)**:
```json
{
  "message": "Task deleted successfully"
}
```

---

## Time Log Endpoints (`/api/timelogs`)

### POST /api/timelogs/manual
Create a manual time entry.

**Access**: Authenticated users

**Request Body**:
```json
{
  "taskId": "taskObjectId",
  "hours": 2,
  "minutes": 30,
  "date": "2024-01-25",
  "note": "Completed initial draft"
}
```

**Response (201)**:
```json
{
  "message": "Time entry logged successfully",
  "timeLog": {
    "_id": "...",
    "task": { "_id": "...", "title": "Task Title" },
    "user": { "_id": "...", "name": "User", "email": "..." },
    "type": "manual",
    "durationMinutes": 150,
    "note": "Completed initial draft",
    "date": "2024-01-25T00:00:00.000Z"
  }
}
```

---

### POST /api/timelogs/timer/start
Start a timer for a task.

**Access**: Authenticated users

**Request Body**:
```json
{
  "taskId": "taskObjectId"
}
```

**Response (201)**:
```json
{
  "message": "Timer started",
  "timeLog": {
    "_id": "...",
    "task": { "_id": "...", "title": "Task Title" },
    "user": { ... },
    "type": "timer",
    "startTime": "2024-01-25T09:00:00.000Z",
    "endTime": null,
    "durationMinutes": 0
  }
}
```

**Errors**:
- 400: Already have an active timer for this task

---

### PATCH /api/timelogs/timer/:id/stop
Stop an active timer.

**Access**: Timer owner only

**Request Body** (optional):
```json
{
  "note": "Finished the task"
}
```

**Response (200)**:
```json
{
  "message": "Timer stopped",
  "timeLog": {
    "_id": "...",
    "startTime": "2024-01-25T09:00:00.000Z",
    "endTime": "2024-01-25T11:30:00.000Z",
    "durationMinutes": 150
  }
}
```

---

### GET /api/timelogs/active
Get current user's active timer (if any).

**Access**: Authenticated users

**Response (200)**:
```json
{
  "activeTimer": {
    "_id": "...",
    "task": { "_id": "...", "title": "Task Title" },
    "startTime": "2024-01-25T09:00:00.000Z"
  }
}
```

---

### GET /api/timelogs/my
Get current user's time logs.

**Access**: Authenticated users

**Query Parameters**:
- `startDate`: Filter from date
- `endDate`: Filter to date
- `taskId`: Filter by task

**Response (200)**:
```json
{
  "timeLogs": [ ... ],
  "count": 10,
  "totalMinutes": 450,
  "totalHours": "7.5"
}
```

---

### GET /api/timelogs/task/:taskId
Get all time logs for a specific task.

**Access**: Admin or assigned employee

**Response (200)**:
```json
{
  "timeLogs": [ ... ],
  "count": 3,
  "totalMinutes": 180,
  "totalHours": "3.0"
}
```

---

### GET /api/timelogs/all
Get all time logs (admin view).

**Access**: All authenticated (typically admin)

**Query Parameters**:
- `startDate`: Filter from date
- `endDate`: Filter to date
- `userId`: Filter by user
- `taskId`: Filter by task

**Response (200)**:
```json
{
  "timeLogs": [ ... ],
  "count": 50,
  "totalMinutes": 2500,
  "totalHours": "41.7"
}
```

---

## Dashboard Endpoints (`/api/dashboard`)

All dashboard endpoints require **Admin** access.

### GET /api/dashboard/statistics
Get summary statistics.

**Response (200)**:
```json
{
  "totalTasks": 45,
  "tasksCompletedThisWeek": 12,
  "totalEmployees": 8,
  "activeEmployees": 6,
  "totalHours": "125.5",
  "totalQuizzesGenerated": 32
}
```

---

### GET /api/dashboard/hours-per-employee
Get hours logged per employee.

**Query Parameters**:
- `startDate`: Filter from date
- `endDate`: Filter to date

**Response (200)**:
```json
{
  "employees": [
    {
      "name": "Rahul Kumar",
      "email": "rahul@strivers.co.in",
      "totalMinutes": 450,
      "totalHours": 7.5,
      "logCount": 12
    }
  ]
}
```

---

### GET /api/dashboard/task-status
Get task status breakdown.

**Response (200)**:
```json
{
  "status": {
    "todo": 10,
    "accepted": 5,
    "in_progress": 8,
    "completed": 22
  },
  "total": 45
}
```

---

### GET /api/dashboard/time-trend
Get time logged trend (last N days).

**Query Parameters**:
- `days`: Number of days (default: 7)

**Response (200)**:
```json
{
  "trend": [
    { "date": "2024-01-19", "hours": "5.50" },
    { "date": "2024-01-20", "hours": "8.25" }
  ],
  "days": 7
}
```

---

### GET /api/dashboard/employee-time-trend
Get time logged per employee per day.

**Query Parameters**:
- `days`: Number of days (default: 7)

**Response (200)**:
```json
{
  "trend": [
    { "date": "2024-01-19", "Rahul Kumar": 3.5, "Priya Singh": 2.0 }
  ],
  "days": 7,
  "users": ["Rahul Kumar", "Priya Singh"]
}
```

---

### GET /api/dashboard/tasks-completed
Get tasks completed per employee.

**Response (200)**:
```json
{
  "employees": [
    {
      "name": "Rahul Kumar",
      "email": "rahul@strivers.co.in",
      "completedTasks": 15
    }
  ]
}
```

---

### GET /api/dashboard/employees-summary
Get detailed employee statistics.

**Response (200)**:
```json
{
  "employees": [
    {
      "_id": "...",
      "name": "Rahul Kumar",
      "email": "rahul@strivers.co.in",
      "department": ["faculty"],
      "totalTasks": 12,
      "completedTasks": 8,
      "totalHours": "25.5",
      "manualEntries": 5,
      "timerEntries": 8,
      "teacherStats": { ... }
    }
  ]
}
```

---

### GET /api/dashboard/quiz-logs
Get recent quiz generation logs.

**Response (200)**:
```json
{
  "logs": [
    {
      "_id": "...",
      "user": { "name": "Rahul Kumar", "email": "..." },
      "outputFileName": "Physics_Quiz_abc123.pptx",
      "templateUsed": "master",
      "questionCount": 25,
      "createdAt": "2024-01-25T10:00:00.000Z"
    }
  ]
}
```

---

## YouTube Endpoints (`/api/youtube`)

All YouTube endpoints require **Admin** access.

### GET /api/youtube/streams
Get recent videos/streams from database.

**Query Parameters**:
- `limit`: Number of results (default: 12, 0 for all)
- `type`: Filter by type ('live', 'upload', or 'all')

**Response (200)**:
```json
{
  "streams": [
    {
      "_id": "...",
      "videoId": "dQw4w9WgXcQ",
      "title": "Physics Lecture | Somnath Sir",
      "videoType": "live",
      "teacher": "Somnath Sir",
      "teacherId": "...",
      "series": "Mechanics",
      "seriesType": "free",
      "duration": "1:30:45",
      "durationSeconds": 5445,
      "views": 15000,
      "likes": 450,
      "thumbnail": "https://...",
      "url": "https://youtube.com/watch?v=...",
      "publishedAt": "2024-01-20T14:00:00.000Z"
    }
  ],
  "total": 150,
  "source": "database",
  "lastSync": "2024-01-25T08:00:00.000Z"
}
```

---

### GET /api/youtube/sync-status
Get YouTube sync status.

**Response (200)**:
```json
{
  "syncInProgress": false,
  "totalVideos": 150,
  "totalTeachers": 5,
  "lastSynced": "2024-01-25T08:00:00.000Z",
  "lastViewsRefresh": "2024-01-25T20:00:00.000Z",
  "latestVideoDate": "2024-01-24T14:00:00.000Z"
}
```

---

### GET /api/youtube/teachers
Get all faculty with their YouTube stats.

**Response (200)**:
```json
{
  "teachers": [
    {
      "_id": "...",
      "name": "Somnath Sir",
      "email": "somnath@strivers.co.in",
      "youtubeAlias": "Somnath Sir",
      "teacherStats": {
        "totalViews": 150000,
        "totalHours": 250,
        "totalClasses": 45
      },
      "recentVideos": [ ... ]
    }
  ],
  "total": 5
}
```

---

### GET /api/youtube/series
Get all series with video counts.

**Response (200)**:
```json
{
  "series": [
    {
      "_id": "...",
      "name": "Mechanics",
      "slug": "mechanics",
      "type": "free",
      "videoCount": 25,
      "totalViews": 50000
    }
  ]
}
```

---

### POST /api/youtube/sync
Trigger full YouTube sync.

**Response (200)**:
```json
{
  "message": "Sync completed successfully.",
  "synced": 150,
  "created": 5,
  "updated": 145,
  "teachersAffected": 5,
  "elapsedSeconds": 12.5
}
```

**Errors**:
- 409: A sync is already in progress

---

### POST /api/youtube/refresh-views
Refresh view counts for all videos.

**Response (200)**:
```json
{
  "message": "View counts refreshed.",
  "refreshed": 150,
  "teachersUpdated": 5
}
```

---

### PATCH /api/youtube/videos/:id/teacher
Manually assign a teacher to a video.

**Request Body**:
```json
{
  "teacherId": "userObjectId"
}
```

**Response (200)**:
```json
{
  "message": "Teacher assigned successfully",
  "video": { ... }
}
```

---

## Quiz Generator Endpoints (`/api/quiz-generator`)

### GET /api/quiz-generator/templates
Get available templates.

**Access**: Authenticated users

**Response (200)**:
```json
{
  "templates": [
    {
      "number": "master",
      "filename": "slide_master.pptx",
      "label": "Slide Master"
    }
  ]
}
```

---

### POST /api/quiz-generator/generate
Generate a quiz PowerPoint.

**Access**: Authenticated users

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `questions` (string, required): Raw question text
- `templateNumber` (string, required): Template identifier
- `outputName` (string, optional): Output filename
- `thumbnail` (file, optional): Cover image

**Response**: Server-Sent Events stream

**SSE Event Format**:
```
data: {"step": "formatting", "message": "🧠 AI Engine is structuring questions..."}

data: {"step": "python_log", "message": "📋 Loaded 25 questions"}

data: {"step": "complete", "message": "Generation successful!", "downloadUrl": "/outputs/quiz_xxx.pptx"}
```

**Errors** (via SSE):
```
data: {"error": "Template not found"}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource state conflict |
| 500 | Internal Server Error |
