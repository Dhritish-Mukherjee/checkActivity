# Database Models

## Overview

The application uses MongoDB with Mongoose ODM. The database name is `strivers-task` (configurable via `MONGODB_URI`).

## Collections

1. **users** - User accounts (admins and employees)
2. **tasks** - Task records
3. **timelogs** - Time tracking entries
4. **videos** - YouTube video records
5. **series** - Educational series
6. **quizlogs** - Quiz generation history

---

## 1. User Model (`models/User.js`)

### Schema
```javascript
{
  name: String (required, max 100),
  profilePicture: String (URL),
  email: String (required, unique, validated),
  password: String (required, min 6, hidden by default),
  role: String (enum: 'admin' | 'employee', default: 'employee'),
  isTeamMember: Boolean (default: false),
  department: [String] (enum: 'faculty' | 'tech' | 'promotional' | 'owners_club'),
  youtubeAlias: String (default: null),
  teacherStats: {
    totalViews: Number (default: 0),
    totalHours: Number (default: 0),
    totalClasses: Number (default: 0),
    currentSeries: String (default: null),
    lastSyncedAt: Date (default: null)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Key Methods
- `pre('save')`: Hashes password and updates timestamp
- `comparePassword(candidate)`: Compares plain text with hashed password

### Important Notes
- `select: false` on password field - never returned by default
- Email is automatically lowercased and trimmed
- Email validation regex: `^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$`
- Department is an array (user can belong to multiple departments)
- `teacherStats` is computed from Video collection on YouTube sync

### Indexes
- Email is unique (automatically indexed)
- No additional indexes defined

---

## 2. Task Model (`models/Task.js`)

### Schema
```javascript
{
  title: String (required, max 200),
  description: String (max 2000),
  assignedTo: [ObjectId<User>] (required, at least 1),
  assignedBy: ObjectId<User> (required),
  status: String (enum: 'todo' | 'accepted' | 'in_progress' | 'completed', default: 'todo'),
  priority: String (enum: 'low' | 'medium' | 'high', default: 'medium'),
  dueDate: Date (default: null)
}
```

### Status Flow
```
todo → accepted → in_progress → completed
```

### Key Features
- Multiple assignees support (`assignedTo` is an array)
- Automatic population of user data in API responses
- Indexed for efficient queries

### Indexes
- `assignedTo: 1` - Fast lookup of user's tasks
- `status: 1` - Filter by status
- `priority: 1` - Filter by priority
- `dueDate: 1` - Sort by due date
- `assignedBy: 1` - Admin's created tasks

---

## 3. TimeLog Model (`models/TimeLog.js`)

### Schema
```javascript
{
  task: ObjectId<Task> (required),
  user: ObjectId<User> (required),
  type: String (enum: 'manual' | 'timer', required),
  startTime: Date (default: null),
  endTime: Date (default: null),
  durationMinutes: Number (default: 0, min 0, max 1440),
  note: String (max 500),
  date: Date (required, default: now)
}
```

### Types
1. **manual**: User entered hours manually
   - `durationMinutes` is set directly
   - `startTime` and `endTime` are null
2. **timer**: Live timer
   - `startTime` is set on creation
   - `endTime` is set on stop
   - `durationMinutes` is calculated from the difference

### Virtual Properties
- `formattedDuration`: Returns "2h 30m" or "45m" format

### Key Constraints
- Maximum duration: 24 hours (1440 minutes)
- Active timer identified by `endTime: null` and `type: 'timer'`

### Indexes
- `task: 1` - Task's time logs
- `user: 1` - User's time logs
- `date: 1` - Time-based queries
- `type: 1` - Filter by manual/timer

---

## 4. Video Model (`models/Video.js`)

### Schema
```javascript
{
  videoId: String (required, unique), // YouTube video ID
  title: String (required),
  teacher: ObjectId<User> (default: null), // Linked teacher
  teacherAlias: String (default: null), // Raw alias from title
  series: ObjectId<Series> (default: null),
  seriesRaw: String (default: null), // Raw series name from title
  videoType: String (enum: 'live' | 'upload', default: 'upload'),
  durationSeconds: Number (default: 0),
  views: Number (default: 0),
  likes: Number (default: 0),
  thumbnail: String (default: ''),
  youtubeUrl: String (default: ''),
  publishedAt: Date,
  lastViewsRefresh: Date (default: null)
}
```

### Population
- `teacher`: Populated with `name youtubeAlias profilePicture teacherStats`
- `series`: Populated with `name type slug`

### Key Features
- Unique `videoId` prevents duplicates
- `videoType` distinguishes live streams from regular uploads
- View counts refreshed daily via cron job
- `lastViewsRefresh` tracks when stats were last updated

### Indexes
- `teacher: 1, publishedAt: -1` - Fast teacher queries sorted by date
- `series: 1` - Series filtering

---

## 5. Series Model (`models/Series.js`)

### Schema
```javascript
{
  name: String (required),
  slug: String (required, unique, lowercase),
  type: String (enum: 'free' | 'partial_free', default: 'free'),
  description: String (default: ''),
  isActive: Boolean (default: true),
  keywords: [String] // For matching video titles
}
```

### Series Types
- `free`: Fully free content (e.g., Udyam)
- `partial_free`: Partially free content (e.g., Lali)

### Key Features
- `keywords` array used to match videos by title
- Case-insensitive matching during sync
- `slug` for SEO-friendly URLs
- `isActive` flag to enable/disable series

---

## 6. QuizLog Model (`models/QuizLog.js`)

### Schema
```javascript
{
  user: ObjectId<User> (required),
  outputFileName: String (required), // Generated PPTX filename
  templateUsed: String (required), // Template identifier
  questionCount: Number (required),
  rawQuestions: String (required), // Original user input
  structuredQuestions: Array (required), // AI-formatted JSON
  createdAt: Date (default: now)
}
```

### Key Features
- Records every quiz generation
- Stores both raw input and AI-formatted output
- Used for dashboard analytics ("Quizzes Generated" stat)
- Limited to 50 most recent in dashboard query

---

## Relationships

```
User (1) ─────< (N) Task (assignedTo array)
Task (1) ─────< (N) TimeLog
User (1) ─────< (N) TimeLog
User (1) ─────< (N) Video (teacher)
Series (1) ───< (N) Video
User (1) ─────< (N) QuizLog
```

### Relationship Details

**User → Task (assignedTo)**
- One user can have many tasks
- One task can have multiple users (array)
- Use `populate('assignedTo', 'name email')` in queries

**User → Task (assignedBy)**
- Admin who created the task
- Single reference (not array)

**Task → TimeLog**
- One task can have many time logs
- `populate('task', 'title status')` in queries

**User → TimeLog**
- One user can have many time logs
- `populate('user', 'name email')` in queries

**User → Video (teacher)**
- One teacher can have many videos
- `populate('teacher', 'name youtubeAlias profilePicture teacherStats')`

**Series → Video**
- One series can have many videos
- `populate('series', 'name type slug')`

**User → QuizLog**
- One user can generate many quizzes
- `populate('user', 'name email profilePicture')`

---

## Database Connection

### Configuration (`config/db.js`)
```javascript
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/strivers-task')
```

### Connection Options
- `MONGODB_URI` environment variable
- Default: `mongodb://localhost:27017/strivers-task`
- Recommended: MongoDB Atlas for production

---

## Sample Data Structure

### User Example
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Admin User",
  "email": "admin@strivers.co.in",
  "role": "admin",
  "isTeamMember": true,
  "department": ["tech"],
  "teacherStats": {
    "totalViews": 0,
    "totalHours": 0,
    "totalClasses": 0
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Task Example
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Create Quiz for Physics Chapter 3",
  "description": "Generate 20 multiple choice questions",
  "assignedTo": ["507f1f77bcf86cd799439011"],
  "assignedBy": "507f1f77bcf86cd799439010",
  "status": "in_progress",
  "priority": "high",
  "dueDate": "2024-02-01T00:00:00.000Z",
  "createdAt": "2024-01-20T10:00:00.000Z"
}
```

### TimeLog Example
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "task": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439011",
  "type": "timer",
  "startTime": "2024-01-20T09:00:00.000Z",
  "endTime": "2024-01-20T11:30:00.000Z",
  "durationMinutes": 150,
  "date": "2024-01-20T09:00:00.000Z",
  "formattedDuration": "2h 30m"
}
```

### Video Example
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "videoId": "dQw4w9WgXcQ",
  "title": "Physics Lecture 1 | Mechanics | Somnath Sir",
  "teacher": "507f1f77bcf86cd799439011",
  "teacherAlias": "Somnath Sir",
  "series": "507f1f77bcf86cd799439015",
  "seriesRaw": "Mechanics",
  "videoType": "live",
  "durationSeconds": 3600,
  "views": 15000,
  "likes": 450,
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "publishedAt": "2024-01-15T14:00:00.000Z"
}
```
