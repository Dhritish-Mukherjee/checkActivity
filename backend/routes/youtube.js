const express = require('express');
const router = express.Router();
const { getRecentStreams } = require('../controllers/youtubeController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// All routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

// GET /api/youtube/streams — returns recent live streams from the channel
router.get('/streams', getRecentStreams);

module.exports = router;
