const axios = require('axios');

const CHANNEL_ID = 'UCEOMA6LSxTcObT4--Ruqg1Q'; // @Striverseducation channel ID
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Extract teacher name from the video title.
 * Titles follow the pattern: "... | Teacher Name Sir/Ma'am"
 */
const extractTeacher = (title) => {
  // Try matching "| SomeName Sir" or "| SomeName Ma'am" or "| SomeName স্যার"
  const match = title.match(/\|\s*([^|]+(?:Sir|Ma'am|স্যার|স্যার))\s*$/i);
  if (match) return match[1].trim();

  // Fall back: grab last pipe segment if it looks like a name
  const parts = title.split('|');
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].trim();
    // If short (< 30 chars) and not all caps, likely a teacher name
    if (last.length < 35 && last !== last.toUpperCase()) return last;
  }
  return null;
};

/**
 * Convert ISO 8601 duration (PT1H2M15S) to human-readable string (1:02:15)
 */
const parseDuration = (iso) => {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * GET /api/youtube/streams
 * Fetch the most recent live streams from the Strivers channel.
 */
const getRecentStreams = async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'YouTube API key not configured.' });
  }

  try {
    const maxResults = parseInt(req.query.limit) || 12;

    // Step 1: Search for completed live streams
    const searchRes = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        channelId: CHANNEL_ID,
        eventType: 'completed',
        type: 'video',
        order: 'date',
        maxResults,
        key: apiKey,
      },
    });

    const items = searchRes.data.items || [];
    if (items.length === 0) {
      return res.json({ streams: [], total: 0 });
    }

    const videoIds = items.map((i) => i.id.videoId).join(',');

    // Step 2: Fetch video details (duration, view count, etc.)
    const detailsRes = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'contentDetails,statistics,snippet',
        id: videoIds,
        key: apiKey,
      },
    });

    const detailsMap = {};
    for (const video of detailsRes.data.items || []) {
      detailsMap[video.id] = video;
    }

    // Step 3: Build the final stream list
    const streams = items.map((item) => {
      const videoId = item.id.videoId;
      const snippet = item.snippet;
      const detail = detailsMap[videoId];
      const title = snippet.title;

      return {
        videoId,
        title,
        teacher: extractTeacher(title),
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        publishedAt: snippet.publishedAt,
        channelTitle: snippet.channelTitle,
        description: snippet.description,
        duration: parseDuration(detail?.contentDetails?.duration),
        views: parseInt(detail?.statistics?.viewCount || 0),
        likes: parseInt(detail?.statistics?.likeCount || 0),
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });

    res.json({ streams, total: searchRes.data.pageInfo?.totalResults || streams.length });
  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error?.message || 'Failed to fetch YouTube streams.';
    res.status(status).json({ message: msg });
  }
};

module.exports = { getRecentStreams };
