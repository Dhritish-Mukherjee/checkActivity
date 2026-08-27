const express = require('express');
const router = express.Router();
const {
  getRecentStreams,
  triggerSync,
  triggerRefreshViews,
  getSyncStatus,
  getTeachers,
  getSeries,
} = require('../controllers/youtubeController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

// ── Read endpoints ───────────────────────────────────────────────────────────
router.get('/streams',      getRecentStreams);   // Recent live streams
router.get('/sync-status',  getSyncStatus);      // DB stats + sync state
router.get('/teachers',     getTeachers);        // Faculty + YouTube stats
router.get('/series',       getSeries);          // Series list with counts

// ── Action endpoints ─────────────────────────────────────────────────────────
router.post('/sync',          triggerSync);        // Full sync (admin button)
router.post('/refresh-views', triggerRefreshViews); // Refresh view counts only

module.exports = router;
