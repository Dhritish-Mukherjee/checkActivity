# YouTube Integration

## Overview

The YouTube integration automatically syncs videos from the Strivers YouTube channel, extracts metadata, and aggregates statistics per teacher.

### Channel Information
- **Channel ID**: `UCEOMA6LSxTcObT4--Ruqg1Q`
- **Channel Name**: @Striverseducation
- **Uploads Playlist**: `UUEOMA6LSxTcObT4--Ruqg1Q`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YOUTUBE SYNC ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  YouTube Data    │
                    │  API v3          │
                    └────────┬─────────┘
                             │
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        youtubeSync.js Service                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ fetchAllVideos()│  │ enrichDetails() │  │ extractMeta()   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MongoDB Collections                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   Video     │  │   Series    │  │   User      │                         │
│  │  (synced)   │  │  (matched)  │  │(teacherStats)│                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### GET /api/youtube/streams
Fetch recent videos from database or YouTube API fallback.

**Query Parameters**:
- `limit` (number): Number of results (default: 12, 0 for all)
- `type` (string): Filter by 'live', 'upload', or 'all'

**Response**:
```json
{
  "streams": [
    {
      "videoId": "abc123",
      "title": "Physics Lecture | Somnath Sir",
      "videoType": "live",
      "teacher": "Somnath Sir",
      "series": "Mechanics",
      "duration": "1:30:45",
      "views": 15000,
      "thumbnail": "https://...",
      "url": "https://youtube.com/watch?v=abc123",
      "publishedAt": "2024-01-20T14:00:00.000Z"
    }
  ],
  "total": 150,
  "source": "database"
}
```

### GET /api/youtube/sync-status
Check sync status and statistics.

**Response**:
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

### POST /api/youtube/sync
Trigger full YouTube sync.

**Response**:
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

### POST /api/youtube/refresh-views
Refresh view counts only (lighter operation).

### GET /api/youtube/teachers
Get all faculty with aggregated YouTube stats.

### GET /api/youtube/series
Get all series with video counts.

### PATCH /api/youtube/videos/:id/teacher
Manually assign a teacher to a video.

---

## Sync Service (`services/youtubeSync.js`)

### Main Functions

#### syncAllStreams(apiKey)
Full sync - fetches all videos and updates database.

```javascript
const result = await syncAllStreams(apiKey);
// Returns: { synced, created, updated, teachersAffected, elapsedSeconds }
```

**Process**:
1. Fetch all videos from uploads playlist (paginated, 50/page)
2. Enrich with details (duration, views, likes, type)
3. Extract teacher alias from title
4. Match series from title keywords
5. Upsert Video documents
6. Recompute teacher statistics

#### refreshViewCounts(apiKey)
Light refresh - updates view counts for existing videos.

```javascript
const result = await refreshViewCounts(apiKey);
// Returns: { refreshed, teachersUpdated }
```

#### computeTeacherStats(teacherId)
Aggregate stats for a teacher and update User document.

```javascript
await computeTeacherStats(teacherId);
// Updates User.teacherStats
```

---

## Data Extraction

### Teacher Alias Extraction

Extracts teacher name from video title using pattern matching.

**Pattern**: Look for "Sir", "Ma'am", or "স্যাার" in pipe-separated segments.

```javascript
const extractTeacherAlias = (title) => {
  const parts = title.split('|').map(p => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/sir|ma'?am|স্যার/i.test(parts[i])) {
      return parts[i].replace(/[🔥🚨📚✨⚡🎯]/gu, '').trim();
    }
  }
  return null;
};
```

**Examples**:
| Title | Extracted Alias |
|-------|----------------|
| `Physics Lecture \| Somnath Sir` | `Somnath Sir` |
| `Math Chapter 5 \| Priya Ma'am \| Live` | `Priya Ma'am` |
| `Chemistry Basics \| স্যার` | `স্যার` |

### Series Matching

Matches videos to series using keywords.

**Series Document**:
```javascript
{
  name: "Mechanics",
  slug: "mechanics",
  type: "free",
  keywords: ["mechanics", "mechanical", "motion"]
}
```

**Matching Process**:
```javascript
const extractSeriesFromTitle = (title, allSeries) => {
  const lower = title.toLowerCase();
  for (const series of allSeries) {
    for (const keyword of series.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return series;
      }
    }
  }
  return null;
};
```

---

## Teacher Statistics

### Aggregation

Computed from all videos linked to a teacher:

```javascript
const agg = await Video.aggregate([
  { $match: { teacher: teacherId } },
  {
    $group: {
      _id: '$teacher',
      totalViews: { $sum: '$views' },
      totalDurationSeconds: { $sum: '$durationSeconds' },
      totalClasses: { $sum: 1 }
    }
  }
]);
```

### Stored Fields

```javascript
User.teacherStats = {
  totalViews: 150000,      // Sum of all video views
  totalHours: 250.5,       // Total teaching hours
  totalClasses: 45,        // Number of videos
  currentSeries: "Mechanics", // Latest video's series
  lastSyncedAt: Date       // Last sync timestamp
}
```

---

## Automated Cron Job

### Schedule
Runs daily at **2:00 AM IST** (20:30 UTC).

```javascript
cron.schedule('30 20 * * *', async () => {
  console.log('⏰ [Cron] Daily view count refresh triggered');
  await refreshViewCounts(process.env.YOUTUBE_API_KEY);
}, { timezone: 'UTC' });
```

### Purpose
- Refresh view counts for all videos
- Update teacher statistics
- Keep analytics current

---

## Video Types

### Live Streams (`videoType: 'live'`)
Identified by presence of `liveStreamingDetails` in API response.

```javascript
videoType: v.liveStreamingDetails ? 'live' : 'upload'
```

### Regular Uploads (`videoType: 'upload'`)
Standard YouTube videos.

---

## Preventing Duplicates

Videos are upserted by `videoId` (unique):

```javascript
const existing = await Video.findOne({ videoId });

if (!existing) {
  await Video.create({ videoId, title, ... });
} else {
  await Video.findByIdAndUpdate(existing._id, {
    views: details.views,
    likes: details.likes,
    lastViewsRefresh: new Date()
  });
}
```

**Important**: Manually assigned teachers/series are NOT overwritten on update.

---

## API Quota Management

### YouTube API Costs
| Endpoint | Cost |
|----------|------|
| playlistItems.list | 1 unit |
| videos.list | 1 unit |

### Daily Quota
- Default: 10,000 units/day
- One full sync: ~300 units (depends on video count)
- Daily refresh: ~300 units

### Optimization
- Pagination limited to 50 items per request
- Batch video details (up to 50 IDs per request)
- Sync runs once per day

---

## Manual Teacher Assignment

When a video's teacher cannot be auto-detected, admins can manually assign:

```javascript
PATCH /api/youtube/videos/:id/teacher
{ "teacherId": "userObjectId" }
```

**Process**:
1. Update video's teacher field
2. Recompute stats for old teacher (if any)
3. Recompute stats for new teacher

---

## Frontend Integration

### YoutubeStreams.jsx

**Features**:
- Display recent videos in grid
- Show sync status
- Trigger manual sync
- Assign teachers to videos

**Key API Calls**:
```javascript
// Load videos
const { data } = await youtubeAPI.getRecentStreams(12, 'all');

// Check sync status
const { data } = await youtubeAPI.getSyncStatus();

// Trigger sync
await youtubeAPI.triggerSync();

// Assign teacher
await youtubeAPI.updateVideoTeacher(videoId, teacherId);
```

---

## Error Handling

### No API Key
```javascript
if (!process.env.YOUTUBE_API_KEY) {
  console.log('ℹ️  YouTube API key not configured, skipping sync');
  return;
}
```

### Concurrent Sync Prevention
```javascript
let syncInProgress = false;

if (syncInProgress) {
  return res.status(409).json({
    message: 'A sync is already in progress. Please wait.'
  });
}

syncInProgress = true;
try {
  await syncAllStreams(apiKey);
} finally {
  syncInProgress = false;
}
```

### API Errors
```javascript
try {
  await axios.get(youtubeApiUrl);
} catch (error) {
  console.error('YouTube API error:', error.response?.data || error.message);
  // Graceful degradation - use cached data
}
```

---

## Series Management

### Creating Series

Admin creates series with matching keywords:

```javascript
{
  name: "Thermodynamics",
  slug: "thermodynamics",
  type: "free",
  keywords: ["thermo", "heat", "temperature", "entropy"]
}
```

### Best Practices
- Use lowercase keywords
- Include variations (singular/plural)
- Consider Bengali terms if applicable
- Test with actual video titles

---

## Monitoring

### Sync Status Check
```bash
curl https://task.strivers.co.in/api/youtube/sync-status
```

### Logs
Server logs sync progress:
```
🔄 YouTube sync started…
  📺 150 videos found on YouTube
✅ Sync done: 5 new, 145 updated, 5 teachers — 12.5s
```

### Dashboard
Admin dashboard shows:
- Total videos synced
- Number of teachers
- Last sync time
- Latest video date
