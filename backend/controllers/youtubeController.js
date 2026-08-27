const axios = require('axios');
const User = require('../models/User');
const Video = require('../models/Video');
const Series = require('../models/Series');
const { syncAllStreams, refreshViewCounts } = require('../services/youtubeSync');

const CHANNEL_ID = 'UCEOMA6LSxTcObT4--Ruqg1Q';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Prevent concurrent syncs
let syncInProgress = false;

/** Convert ISO 8601 duration to human-readable string */
const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// ─── GET /api/youtube/streams ─────────────────────────────────────────────────
/**
 * Returns recent videos/streams — first tries the DB (fast), falls back to live YouTube API.
 * Prefers DB data since it's enriched with teacher and series refs.
 */
const getRecentStreams = async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ message: 'YouTube API key not configured.' });

  const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 12;
  const type = req.query.type; // 'live', 'upload', or undefined/all

  try {
    // Try DB first
    const dbCount = await Video.countDocuments();

    if (dbCount > 0) {
      const filter = {};
      if (type && type !== 'all') {
        filter.videoType = type;
      }

      const query = Video.find(filter)
        .sort({ publishedAt: -1 })
        .populate('teacher', 'name youtubeAlias profilePicture teacherStats')
        .populate('series', 'name type slug');
      
      if (limit > 0) {
        query.limit(limit);
      }

      const videos = await query.exec();

      const streams = videos.map((v) => ({
        _id: v._id,
        videoId: v.videoId,
        title: v.title,
        videoType: v.videoType,
        teacher: v.teacher?.name || v.teacherAlias || null,
        teacherId: v.teacher?._id || null,
        teacherAlias: v.teacherAlias,
        series: v.series?.name || v.seriesRaw || null,
        seriesType: v.series?.type || null,
        duration: formatDuration(v.durationSeconds),
        durationSeconds: v.durationSeconds,
        views: v.views,
        likes: v.likes,
        thumbnail: v.thumbnail,
        url: v.youtubeUrl,
        publishedAt: v.publishedAt,
        lastViewsRefresh: v.lastViewsRefresh,
      }));

      return res.json({
        streams,
        total: await Video.countDocuments(filter),
        source: 'database',
        lastSync: videos[0]?.updatedAt || null,
      });
    }

    // Fallback: live YouTube API (before first sync)
    const searchRes = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        channelId: CHANNEL_ID,
        eventType: 'completed',
        type: 'video',
        order: 'date',
        maxResults: limit,
        key: apiKey,
      },
    });

    const items = searchRes.data.items || [];
    const videoIds = items.map((i) => i.id.videoId).join(',');
    const detailsRes = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: { part: 'contentDetails,statistics', id: videoIds, key: apiKey },
    });

    const detailsMap = {};
    for (const v of detailsRes.data.items || []) {
      const match = v.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const secs = match ? (parseInt(match[1] || 0) * 3600) + (parseInt(match[2] || 0) * 60) + parseInt(match[3] || 0) : 0;
      detailsMap[v.id] = { durationSeconds: secs, views: parseInt(v.statistics?.viewCount || 0) };
    }

    const streams = items.map((item) => {
      const d = detailsMap[item.id.videoId] || {};
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        teacher: null,
        series: null,
        duration: formatDuration(d.durationSeconds),
        durationSeconds: d.durationSeconds || 0,
        views: d.views || 0,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt,
      };
    });

    res.json({ streams, total: searchRes.data.pageInfo?.totalResults || streams.length, source: 'youtube-api' });
  } catch (error) {
    console.error('YouTube streams error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.error?.message || 'Failed to fetch streams.',
    });
  }
};

// ─── POST /api/youtube/sync ───────────────────────────────────────────────────
/** Trigger a full sync. Prevents concurrent runs. */
const triggerSync = async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ message: 'YouTube API key not configured.' });

  if (syncInProgress) {
    return res.status(409).json({ message: 'A sync is already in progress. Please wait.' });
  }

  syncInProgress = true;
  try {
    const result = await syncAllStreams(apiKey);
    res.json({ message: 'Sync completed successfully.', ...result });
  } catch (error) {
    console.error('Sync error:', error.response?.data || error.message);
    res.status(500).json({ message: error.response?.data?.error?.message || 'Sync failed.' });
  } finally {
    syncInProgress = false;
  }
};

// ─── POST /api/youtube/refresh-views ─────────────────────────────────────────
/** Refresh view counts for all existing videos. */
const triggerRefreshViews = async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ message: 'YouTube API key not configured.' });

  try {
    const result = await refreshViewCounts(apiKey);
    res.json({ message: 'View counts refreshed.', ...result });
  } catch (error) {
    console.error('Refresh views error:', error.message);
    res.status(500).json({ message: 'Failed to refresh view counts.' });
  }
};

// ─── GET /api/youtube/sync-status ────────────────────────────────────────────
/** Quick status check: how many videos in DB, last sync time, teachers. */
const getSyncStatus = async (req, res) => {
  try {
    const totalVideos = await Video.countDocuments();
    const latestVideo = await Video.findOne().sort({ publishedAt: -1 }).select('publishedAt lastViewsRefresh updatedAt');
    const totalTeachers = await User.countDocuments({ department: 'faculty', youtubeAlias: { $ne: null } });

    res.json({
      syncInProgress,
      totalVideos,
      totalTeachers,
      lastSynced: latestVideo?.updatedAt || null,
      lastViewsRefresh: latestVideo?.lastViewsRefresh || null,
      latestVideoDate: latestVideo?.publishedAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get sync status.' });
  }
};

// ─── GET /api/youtube/teachers ────────────────────────────────────────────────
/** Returns all faculty users with their teacher stats + recent 3 videos. */
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ department: 'faculty' })
      .select('name email profilePicture youtubeAlias teacherStats createdAt')
      .sort({ 'teacherStats.totalClasses': -1 });

    // Attach recent videos for each teacher
    const result = await Promise.all(
      teachers.map(async (t) => {
        const recentVideos = await Video.find({ teacher: t._id })
          .sort({ publishedAt: -1 })
          .limit(3)
          .select('title thumbnail youtubeUrl publishedAt durationSeconds views seriesRaw')
          .populate('series', 'name');

        return {
          _id: t._id,
          name: t.name,
          email: t.email,
          profilePicture: t.profilePicture,
          youtubeAlias: t.youtubeAlias,
          isPlaceholder: t.email?.endsWith('@placeholder.strivers.com'),
          teacherStats: t.teacherStats,
          recentVideos: recentVideos.map((v) => ({
            videoId: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            url: v.youtubeUrl,
            publishedAt: v.publishedAt,
            duration: formatDuration(v.durationSeconds),
            views: v.views,
            series: v.series?.name || v.seriesRaw || null,
          })),
        };
      })
    );

    res.json({ teachers: result, total: result.length });
  } catch (error) {
    console.error('Get teachers error:', error.message);
    res.status(500).json({ message: 'Failed to fetch teachers.' });
  }
};

// ─── GET /api/youtube/series ──────────────────────────────────────────────────
/** Returns all series with video counts. */
const getSeries = async (req, res) => {
  try {
    const series = await Series.find().sort({ createdAt: 1 });
    const result = await Promise.all(
      series.map(async (s) => {
        const count = await Video.countDocuments({ series: s._id });
        const totalViews = await Video.aggregate([
          { $match: { series: s._id } },
          { $group: { _id: null, total: { $sum: '$views' } } },
        ]);
        return {
          ...s.toObject(),
          videoCount: count,
          totalViews: totalViews[0]?.total || 0,
        };
      })
    );
    res.json({ series: result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch series.' });
  }
};

// ─── PATCH /api/youtube/videos/:id/teacher ─────────────────────────────────
/** Manually assign a teacher to a video */
const updateVideoTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    const oldTeacherId = video.teacher;
    video.teacher = teacherId || null;
    
    if (teacherId) {
      const t = await User.findById(teacherId);
      video.teacherAlias = t ? t.name : null;
    } else {
      video.teacherAlias = null;
    }

    await video.save();

    // Recompute stats for both old and new teachers
    const { computeTeacherStats } = require('../services/youtubeSync');
    if (oldTeacherId) await computeTeacherStats(oldTeacherId);
    if (teacherId) await computeTeacherStats(teacherId);

    res.json({ message: 'Teacher assigned successfully', video });
  } catch (error) {
    console.error('Update video teacher error:', error.message);
    res.status(500).json({ message: 'Failed to assign teacher.' });
  }
};

module.exports = {
  getRecentStreams,
  triggerSync,
  triggerRefreshViews,
  getSyncStatus,
  getTeachers,
  getSeries,
  updateVideoTeacher,
};
