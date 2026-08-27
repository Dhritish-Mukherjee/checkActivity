/**
 * youtubeSync.js
 *
 * Core service that:
 *  1. Fetches all completed live streams from the Strivers YouTube channel
 *  2. Extracts teacher alias + series name from video titles
 *  3. Finds or creates placeholder teacher Users
 *  4. Upserts Video documents (no duplicates)
 *  5. Recomputes teacher-level aggregated stats (views, hours, classes)
 *
 * Exports:
 *   syncAllStreams(apiKey)    — full sync (new + update existing)
 *   refreshViewCounts(apiKey) — only refresh view counts, no new inserts
 *   computeTeacherStats(teacherId) — recompute stats for one teacher
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const User = require('../models/User');
const Video = require('../models/Video');
const Series = require('../models/Series');

const CHANNEL_ID = 'UCEOMA6LSxTcObT4--Ruqg1Q'; // @Striverseducation
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert ISO 8601 duration (PT1H2M15S) → total seconds */
const parseDurationToSeconds = (iso) => {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
};

/**
 * Extract teacher alias from a video title.
 * Looks for a pipe-separated segment that contains "Sir" or "Ma'am" or "স্যার".
 * Checks from the end first (most common position).
 */
const extractTeacherAlias = (title) => {
  const parts = title.split('|').map((p) => p.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim());
  // Check each segment from the end
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (/sir|ma'?am|স্যার/i.test(part) && part.length > 2 && part.length < 45) {
      return part.replace(/[🔥🚨📚✨⚡🎯]/gu, '').trim();
    }
  }
  return null;
};

/**
 * Extract series from a video title by matching against known series keywords.
 * Returns the matching Series document or null.
 */
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

// ─── Teacher management ────────────────────────────────────────────────────────

/**
 * Find an existing User by youtubeAlias (case-insensitive), or create a
 * placeholder faculty User that the admin can edit later.
 */
const findOrCreateTeacher = async (alias) => {
  if (!alias) return null;

  // Escape regex special chars in alias
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let user = await User.findOne({
    youtubeAlias: { $regex: new RegExp(`^${escaped}$`, 'i') },
  });

  if (!user) {
    // Build a safe placeholder email
    const slugName = alias
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z.]/g, '');
    const placeholderEmail = `${slugName}.placeholder@strivers.local`;

    // Guard against duplicate emails (e.g. two aliases that slugify identically)
    const existing = await User.findOne({ email: placeholderEmail });
    if (existing) {
      // Attach the alias if missing
      if (!existing.youtubeAlias) {
        existing.youtubeAlias = alias;
        await existing.save();
      }
      return existing;
    }

    user = new User({
      name: alias,
      email: placeholderEmail,
      password: uuidv4(), // never used — placeholder
      role: 'employee',
      department: 'faculty',
      youtubeAlias: alias,
    });
    await user.save();
    console.log(`  👤 Created placeholder teacher: "${alias}"`);
  }

  return user;
};

// ─── Stats computation ─────────────────────────────────────────────────────────

/**
 * Aggregate all videos for a teacher and write totals back to User.teacherStats.
 */
const computeTeacherStats = async (teacherId) => {
  const agg = await Video.aggregate([
    { $match: { teacher: new mongoose.Types.ObjectId(teacherId) } },
    {
      $group: {
        _id: '$teacher',
        totalViews: { $sum: '$views' },
        totalDurationSeconds: { $sum: '$durationSeconds' },
        totalClasses: { $sum: 1 },
      },
    },
  ]);

  const stats = agg[0] || { totalViews: 0, totalDurationSeconds: 0, totalClasses: 0 };

  // Most recent video tells us the current series
  const latestVideo = await Video.findOne({ teacher: teacherId })
    .sort({ publishedAt: -1 })
    .populate('series', 'name');

  await User.findByIdAndUpdate(teacherId, {
    'teacherStats.totalViews':    stats.totalViews,
    'teacherStats.totalHours':    parseFloat((stats.totalDurationSeconds / 3600).toFixed(2)),
    'teacherStats.totalClasses':  stats.totalClasses,
    'teacherStats.currentSeries': latestVideo?.series?.name || latestVideo?.seriesRaw || null,
    'teacherStats.lastSyncedAt':  new Date(),
  });
};

// ─── YouTube API helpers ───────────────────────────────────────────────────────

/**
 * Fetch ALL completed live streams from the channel (paginated, max 50/page).
 */
const fetchAllStreams = async (apiKey) => {
  const allItems = [];
  let nextPageToken = null;

  do {
    const res = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        channelId: CHANNEL_ID,
        eventType: 'completed',
        type: 'video',
        order: 'date',
        maxResults: 50,
        pageToken: nextPageToken || undefined,
        key: apiKey,
      },
    });
    allItems.push(...(res.data.items || []));
    nextPageToken = res.data.nextPageToken || null;
  } while (nextPageToken);

  return allItems;
};

/**
 * Batch-fetch video details (duration + stats) from the videos endpoint.
 * YouTube allows up to 50 IDs per request.
 */
const enrichVideoDetails = async (videoIds, apiKey) => {
  const detailsMap = {};
  const BATCH = 50;

  for (let i = 0; i < videoIds.length; i += BATCH) {
    const batch = videoIds.slice(i, i + BATCH);
    const res = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: batch.join(','),
        key: apiKey,
      },
    });
    for (const v of res.data.items || []) {
      detailsMap[v.id] = {
        durationSeconds: parseDurationToSeconds(v.contentDetails?.duration),
        views: parseInt(v.statistics?.viewCount || 0),
        likes: parseInt(v.statistics?.likeCount || 0),
      };
    }
  }

  return detailsMap;
};

// ─── Main sync functions ───────────────────────────────────────────────────────

/**
 * Full sync:
 *  - Fetches all streams from YouTube
 *  - Inserts new ones into the Video collection
 *  - Updates views/likes on existing ones
 *  - Creates placeholder teachers for unmatched aliases
 *  - Recomputes teacher stats for all affected teachers
 */
const syncAllStreams = async (apiKey) => {
  console.log('🔄 YouTube sync started…');
  const t0 = Date.now();

  // Load series for matching
  const allSeries = await Series.find({ isActive: true });

  // Fetch from YouTube
  const items = await fetchAllStreams(apiKey);
  console.log(`  📺 ${items.length} streams found on YouTube`);
  if (items.length === 0) {
    return { synced: 0, created: 0, updated: 0, teachersAffected: 0 };
  }

  // Enrich with details (duration, views)
  const videoIds = items.map((i) => i.id.videoId);
  const detailsMap = await enrichVideoDetails(videoIds, apiKey);

  let created = 0;
  let updated = 0;
  const touchedTeacherIds = new Set();

  for (const item of items) {
    const videoId = item.id.videoId;
    const snippet = item.snippet;
    const title = snippet.title;
    const details = detailsMap[videoId] || { durationSeconds: 0, views: 0, likes: 0 };

    // Extract teacher and series from title
    const teacherAlias = extractTeacherAlias(title);
    const matchedSeries = extractSeriesFromTitle(title, allSeries);

    // Find or create teacher
    const teacher = await findOrCreateTeacher(teacherAlias);
    if (teacher) touchedTeacherIds.add(teacher._id.toString());

    // Upsert the video
    const existing = await Video.findOne({ videoId });

    if (!existing) {
      await Video.create({
        videoId,
        title,
        teacher: teacher?._id || null,
        teacherAlias,
        series: matchedSeries?._id || null,
        seriesRaw: matchedSeries?.name || null,
        durationSeconds: details.durationSeconds,
        views: details.views,
        likes: details.likes,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: new Date(snippet.publishedAt),
        lastViewsRefresh: new Date(),
      });
      created++;
    } else {
      // Don't overwrite manually set teacher/series — only fill if null
      const updateData = {
        views: details.views,
        likes: details.likes,
        lastViewsRefresh: new Date(),
      };
      if (!existing.teacher && teacher) {
        updateData.teacher = teacher._id;
        updateData.teacherAlias = teacherAlias;
      }
      if (!existing.series && matchedSeries) {
        updateData.series = matchedSeries._id;
        updateData.seriesRaw = matchedSeries.name;
      }
      // Track teacher even if video existed
      if (existing.teacher) touchedTeacherIds.add(existing.teacher.toString());

      await Video.findByIdAndUpdate(existing._id, updateData);
      updated++;
    }
  }

  // Recompute stats for all touched teachers
  for (const teacherId of touchedTeacherIds) {
    await computeTeacherStats(new mongoose.Types.ObjectId(teacherId));
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`✅ Sync done: ${created} new, ${updated} updated, ${touchedTeacherIds.size} teachers — ${elapsed}s`);

  return {
    synced: items.length,
    created,
    updated,
    teachersAffected: touchedTeacherIds.size,
    elapsedSeconds: parseFloat(elapsed),
  };
};

/**
 * Daily view-count refresh:
 *  - Fetches updated view/like counts for ALL existing videos
 *  - Recomputes teacher stats for any teacher with changed view counts
 */
const refreshViewCounts = async (apiKey) => {
  console.log('🔄 Refreshing view counts…');

  const allVideos = await Video.find({}).select('videoId teacher');
  if (allVideos.length === 0) {
    console.log('  ℹ️  No videos in DB — run a full sync first');
    return { refreshed: 0 };
  }

  const videoIds = allVideos.map((v) => v.videoId);
  const detailsMap = await enrichVideoDetails(videoIds, apiKey);
  const touchedTeacherIds = new Set();

  for (const video of allVideos) {
    const d = detailsMap[video.videoId];
    if (!d) continue;
    await Video.findByIdAndUpdate(video._id, {
      views: d.views,
      likes: d.likes,
      lastViewsRefresh: new Date(),
    });
    if (video.teacher) touchedTeacherIds.add(video.teacher.toString());
  }

  for (const teacherId of touchedTeacherIds) {
    await computeTeacherStats(new mongoose.Types.ObjectId(teacherId));
  }

  console.log(`✅ Refreshed ${allVideos.length} videos, ${touchedTeacherIds.size} teachers updated`);
  return { refreshed: allVideos.length, teachersUpdated: touchedTeacherIds.size };
};

module.exports = { syncAllStreams, refreshViewCounts, computeTeacherStats };
