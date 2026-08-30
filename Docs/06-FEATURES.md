# Feature Implementation Details

## 1. Task Management

### Overview
Tasks are the core unit of work in the platform. Admins create tasks and assign them to one or more team members. Team members can view their assigned tasks, update status, and log time.

### Task Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TASK STATUS FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────┐
                    │   todo   │  (Created by admin)
                    └────┬─────┘
                         │
                    Employee accepts
                         │
                         ▼
                  ┌──────────┐
                  │ accepted │  (Employee acknowledged)
                  └────┬─────┘
                       │
                  Employee starts work
                       │
                       ▼
                ┌──────────┐
                │in_progress│ (Work in progress)
                └────┬─────┘
                     │
                Work completed
                     │
                     ▼
                ┌──────────┐
                │completed │  (Finished)
                └──────────┘
```

### Task Creation (Admin)
```javascript
// Request body
{
  title: "Create Physics Quiz",
  description: "Generate 25 MCQ questions",
  assignedTo: ["userId1", "userId2"],  // Multiple assignees
  priority: "high",
  dueDate: "2024-02-15"
}
```

### Task Status Update (Employee)
```javascript
// Only assigned employees can update their own tasks
PATCH /api/tasks/:id/status
{ status: "in_progress" }
```

### Frontend Implementation
- **Admin View**: `ManageTasks.jsx` - Full CRUD operations
- **Employee View**: `MyTasks.jsx` - View assigned, update status

---

## 2. Time Tracking

### Two Methods

#### Manual Entry
User enters hours and minutes directly for a past date.

```javascript
POST /api/timelogs/manual
{
  taskId: "taskObjectId",
  hours: 2,
  minutes: 30,
  date: "2024-01-25",
  note: "Completed initial research"
}
```

#### Timer
Live timer that tracks real-time work.

```javascript
// Start timer
POST /api/timelogs/timer/start
{ taskId: "taskObjectId" }

// Returns timeLog with startTime set, endTime null
```

```javascript
// Stop timer
PATCH /api/timelogs/timer/:id/stop
{ note: "Finished the task" }

// Server calculates duration from startTime to now
// Max duration: 24 hours (1440 minutes)
```

### Active Timer Detection
Only ONE active timer per user per task:
```javascript
// Backend check
const activeTimer = await TimeLog.findOne({
  task: taskId,
  user: userId,
  type: 'timer',
  endTime: null
});

if (activeTimer) {
  return res.status(400).json({
    message: 'You already have an active timer for this task.'
  });
}
```

### Global Timer Banner
`GlobalTimerBanner.jsx` shows active timer across all pages:
```javascript
// Fetches active timer on mount
const { data } = await timeLogAPI.getActiveTimer();

// Updates every second
useEffect(() => {
  const interval = setInterval(() => {
    if (activeTimer?.startTime) {
      const elapsed = Date.now() - new Date(activeTimer.startTime);
      setElapsedSeconds(Math.floor(elapsed / 1000));
    }
  }, 1000);
  return () => clearInterval(interval);
}, [activeTimer]);
```

---

## 3. Quiz Engine

### Overview
Converts raw question text into formatted bilingual PowerPoint presentations using AI.

### Architecture
```
User Input (Raw Text)
       │
       ▼
┌──────────────────┐
│  Express Server  │
│  /api/quiz-      │
│  generator/      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Google Gemini   │  Format & translate questions
│  AI Service      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Structured JSON │
│  Questions       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Python Script   │  Generate PPTX
│  generate_quiz.py│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Output PPTX     │  Download link
│  File            │
└──────────────────┘
```

### API Flow (Server-Sent Events)
```javascript
// Frontend
const response = await fetch('/api/quiz-generator/generate', {
  method: 'POST',
  body: formData
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  chunk.split('\n').forEach(line => {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      // Handle progress updates
    }
  });
}
```

### AI Prompt (Gemini)
The AI is instructed to:
1. Format questions as JSON array
2. Provide both English and Bengali versions
3. Translate if missing either language
4. Remove option prefixes (A., B., etc.)
5. Handle universal symbols (don't translate numbers, formulas)

### Python Script
`scripts/generate_quiz.py`:
- Accepts template, questions JSON, and optional image
- Uses `python-pptx` library
- Creates slides with proper formatting
- Replaces cover image if provided
- Outputs to `/outputs` directory

### Logging
Every generation is logged to MongoDB:
```javascript
QuizLog.create({
  user: userId,
  outputFileName: "Quiz_abc123.pptx",
  templateUsed: "master",
  questionCount: 25,
  rawQuestions: "Original input...",
  structuredQuestions: [{ ... }]  // AI formatted
});
```

---

## 4. YouTube Integration

### Overview
Syncs video data from the Strivers YouTube channel and aggregates statistics per teacher.

### Channel Information
- Channel ID: `UCEOMA6LSxTcObT4--Ruqg1Q`
- Channel: @Striverseducation

### Sync Process
```
YouTube API
     │
     ▼
fetchAllVideos()  ← Fetch all from uploads playlist
     │
     ▼
enrichVideoDetails()  ← Get duration, views, type
     │
     ▼
extractTeacherAlias()  ← Parse from title (e.g., "| Somnath Sir")
     │
     ▼
extractSeriesFromTitle()  ← Match against Series keywords
     │
     ▼
Upsert Video documents
     │
     ▼
computeTeacherStats()  ← Aggregate per teacher
```

### Teacher Alias Extraction
```javascript
// Looks for "Sir" or "Ma'am" in pipe-separated title segments
const extractTeacherAlias = (title) => {
  const parts = title.split('|').map(p => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (/sir|ma'?am|স্যার/i.test(part)) {
      return part.replace(/[🔥🚨📚✨⚡🎯]/gu, '').trim();
    }
  }
  return null;
};
```

### Series Matching
```javascript
// Series document has keywords array
const series = {
  name: "Mechanics",
  keywords: ["mechanics", "mechanical", "motion"]
};

// Videos matched case-insensitively
if (title.toLowerCase().includes(keyword.toLowerCase())) {
  video.series = series._id;
}
```

### Automated Cron Job
Runs daily at 2:00 AM IST:
```javascript
cron.schedule('30 20 * * *', async () => {
  await refreshViewCounts(apiKey);
}, { timezone: 'UTC' });
```

### Manual Sync
Admin can trigger via button:
```javascript
POST /api/youtube/sync
// Returns: synced count, created, updated, teachers affected
```

---

## 5. Dashboard Analytics

### Statistics Cards
```javascript
// Total tasks
Task.countDocuments()

// Tasks completed this week
Task.countDocuments({
  status: 'completed',
  updatedAt: { $gte: weekStart }
})

// Total hours logged
TimeLog.aggregate([
  { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } }
])

// Active employees (active in last 7 days)
User.countDocuments({
  isTeamMember: true,
  updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
})

// Quizzes generated
QuizLog.countDocuments()
```

### Hours per Employee (Bar Chart)
```javascript
TimeLog.aggregate([
  { $group: { _id: '$user', totalMinutes: { $sum: '$durationMinutes' } } },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
  { $project: { name: '$user.name', totalHours: { $divide: ['$totalMinutes', 60] } } },
  { $sort: { totalMinutes: -1 } }
]);
```

### Task Status (Doughnut Chart)
```javascript
Task.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);
// Returns: [{ _id: 'todo', count: 10 }, ...]
```

### Time Trend (Line Chart)
7-day trend with daily aggregation:
```javascript
for (let i = 6; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  
  const dailyLogs = await TimeLog.aggregate([
    { $match: { date: { $gte: date, $lt: nextDate } } },
    { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } }
  ]);
  
  trend.push({ date, hours: dailyLogs[0]?.totalMinutes / 60 || 0 });
}
```

### Employee Time Trend (Stacked Bar)
Per-employee breakdown over 7 days:
```javascript
// Returns array of objects with date and hours per user
{ date: '2024-01-25', 'Rahul Kumar': 3.5, 'Priya Singh': 2.0 }
```

---

## 6. Role-Based Navigation

### Admin Navigation
```javascript
const adminLinks = [
  { to: '/', icon: '◈', label: 'Dashboard' },
  { to: '/tasks', icon: '▣', label: 'All Tasks' },
  // Conditionally shown if isTeamMember
  ...(user?.isTeamMember ? [
    { to: '/my-tasks', icon: '▤', label: 'My Tasks' },
    { to: '/time-logs', icon: '◎', label: 'Time Logs' }
  ] : []),
  { to: '/employees', icon: '◩', label: 'Team Members' },
  { to: '/quiz-generator', icon: '⚡', label: 'Quiz Engine' },
  { to: '/settings', icon: '◮', label: 'Settings' }
];
```

### Employee Navigation
```javascript
const employeeLinks = [
  { to: '/', icon: '▣', label: 'My Tasks' },
  { to: '/time-logs', icon: '◎', label: 'Time Logs' },
  { to: '/quiz-generator', icon: '⚡', label: 'Quiz Engine' },
  { to: '/settings', icon: '◮', label: 'Settings' }
];
```

---

## 7. Real-Time Updates

### Frontend Caching
2-minute cache for GET requests:
```javascript
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000;

// Bypass for real-time data
api.get('/timelogs/active', { bypassCache: true });
api.get('/youtube/streams', { bypassCache: true });
```

### Cache Invalidation
```javascript
// Clear cache on mutations
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    cache.clear();
  }
  return config;
});
```

---

## 8. UI Features

### Loading States
```jsx
if (loading) {
  return <CatLoader text="Loading Dashboard..." />;
}
```

### Empty States
```jsx
{tasks.length === 0 ? (
  <p className="text-slate-500 text-center py-8">
    No tasks found. Create your first task!
  </p>
) : (
  <TaskList tasks={tasks} />
)}
```

### Success Feedback
```javascript
import confetti from 'canvas-confetti';

onQuizGenerated: () => {
  confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 } });
}
```

### Responsive Sidebar
```jsx
// Mobile: Hidden by default, toggle with hamburger
// Desktop: Always visible
<aside className={`
  fixed left-0 top-0 h-full w-64
  ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
`}>
```

---

## 9. Error Handling

### Backend Error Responses
```javascript
// Validation error
res.status(400).json({ message: 'Email is required.' });

// Authentication error
res.status(401).json({ message: 'Invalid token.' });

// Authorization error
res.status(403).json({ message: 'Admin only.' });

// Not found
res.status(404).json({ message: 'Task not found.' });

// Server error
res.status(500).json({ message: 'Internal server error.' });
```

### Frontend Error Handling
```javascript
try {
  const response = await taskAPI.createTask(data);
  // Success
} catch (error) {
  const message = error.response?.data?.message || 'An error occurred';
  setError(message);
  // Or use toast notification
}
```
