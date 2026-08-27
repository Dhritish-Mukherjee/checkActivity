const express = require('express');
const router = express.Router();
const quizGeneratorController = require('../controllers/quizGeneratorController');
const { auth } = require('../middleware/auth');

// GET templates (protected)
router.get('/templates', auth, quizGeneratorController.getTemplates);

// POST generate (protected)
// SSE stream, uses multer upload for thumbnail
router.post('/generate', auth, quizGeneratorController.upload.single('thumbnail'), quizGeneratorController.generateQuiz);

module.exports = router;
