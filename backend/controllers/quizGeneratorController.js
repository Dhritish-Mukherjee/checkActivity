const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const QuizLog = require('../models/QuizLog');

// ── Multer config: store thumbnail in /outputs with a temp name ───────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'outputs');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `thumb_${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed for thumbnail'));
  },
});

// ── Gemini setup ──────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── AI Engine: format raw questions into structured JSON ──────────────────
async function formatQuestionsWithAI(rawQuestions, onProgress) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  onProgress({ step: 'formatting', message: '🧠 AI Engine is structuring & translating questions...' });

  const prompt = `
You are a bilingual quiz formatter for Bengali and English. 
Convert the following raw quiz questions into a valid JSON array.

RULES:
1. Each question MUST have both English and Bengali versions.
2. Each option MUST have an English ("en") version.
3. Each option MUST also have a Bengali ("bn") translation. On the final slide, options are rendered as: "A. English text (বাংলা টেক্সট)" — the Bengali text appears inside brackets right next to the English text. So the "bn" field is critical for every option.
4. ONLY leave the Bengali ("bn") field EMPTY ("") if the option is a universal symbol, chemical formula (like H2O), number (like 100°C), or a word that is completely identical in both languages and needs no translation.
5. If Bengali is missing for any other text, translate it accurately from English.
6. If English is missing for any field, translate it accurately from Bengali.
7. If Bengali is already present but seems incorrect, improve it.
8. Remove any option prefixes like "A.", "B.", "1." from the text.
9. Output ONLY the raw JSON array — no markdown.

OUTPUT FORMAT (strict):
[
  {
    "question_en": "English question text here",
    "question_bn": "বাংলা প্রশ্ন এখানে",
    "options": [
      { "en": "Option 1 English", "bn": "অপশন ১ বাংলা" },
      { "en": "H2O", "bn": "" }
    ]
  }
]

RAW QUESTIONS INPUT:
${rawQuestions}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown fences if AI adds them
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array');
    onProgress({ step: 'formatting_complete', message: `✅ AI Engine successfully formatted ${parsed.length} questions.` });
    return parsed;
  } catch (err) {
    throw new Error(`AI Engine returned invalid JSON: ${err.message}`);
  }
}

// ── Run Python script with streaming output ───────────────────────────────
function runPythonScriptStreaming({ templatePath, questionsPath, outputPath, imagePath }, onProgress) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'generate_quiz.py');
    const venvPythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python');
    const pythonBin = fs.existsSync(venvPythonPath) 
      ? venvPythonPath 
      : (process.platform === 'win32' ? 'python' : 'python3');

    const args = [
      scriptPath,
      '--template', templatePath,
      '--questions', questionsPath,
      '--output', outputPath,
    ];

    if (imagePath) {
      args.push('--image', imagePath);
    }

    onProgress({ step: 'python_start', message: 'Starting PowerPoint engine...' });

    const pyProcess = spawn(pythonBin, args);

    pyProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Sanitize Python logs
        let cleaned = trimmed
          .replace(/\/app\/outputs\/[^\s]+/g, '')
          .replace(/\/[^\s]*outputs\/[^\s]+/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (!cleaned || cleaned === '✓' || cleaned === '✅') return;

        cleaned = cleaned
          .replace(/^✅ Saved successfully\.$/, '✅ PowerPoint saved successfully.')
          .replace(/^✓ Cover image replaced successfully\.$/, '🖼️ Cover image applied to slide 1.')
          .replace(/^✓ Cover image replaced with:.*$/, '🖼️ Cover image applied to slide 1.')
          .replace(/^Loaded (\d+) question/, '📋 Loaded $1 question')
          .replace(/^Filling slides with question content/, '⚡ Populating slides with content')
          .replace(/^Slide plan:/, '📐 Slide plan:')
          .replace(/^Batch size:/, '📦 Batch size:');

        onProgress({ step: 'python_log', message: cleaned });
      });
    });

    pyProcess.stderr.on('data', (data) => {
      console.error(`Python Stderr: ${data}`);
    });

    pyProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

function cleanup(paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch (_) {}
    }
  }
}

const generateQuiz = async (req, res) => {
  const sessionId = uuidv4();
  let thumbnailPath = null;
  let questionsFilePath = null;
  let outputFilePath = null;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { templateNumber, questions: rawQuestions } = req.body;

    if (!templateNumber) {
      return sendEvent({ error: 'templateNumber is required' });
    }
    if (!rawQuestions || rawQuestions.trim().length === 0) {
      return sendEvent({ error: 'questions field is required' });
    }

    const templateFileName = 'slide_master.pptx';
    const templatePath = path.join(__dirname, '..', 'templates', templateFileName);

    if (!fs.existsSync(templatePath)) {
      return sendEvent({ error: 'Template slide_master.pptx not found in templates directory.' });
    }

    if (req.file) {
      thumbnailPath = req.file.path;
    }

    const formattedQuestions = await formatQuestionsWithAI(rawQuestions, sendEvent);

    questionsFilePath = path.join(__dirname, '..', 'outputs', `questions_${sessionId}.json`);
    fs.writeFileSync(questionsFilePath, JSON.stringify(formattedQuestions, null, 2), 'utf-8');

    const outputName = (req.body.outputName || '').trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_') || `quiz_${sessionId}`;
    const outputFileName = `${outputName}_${sessionId}.pptx`;
    outputFilePath = path.join(__dirname, '..', 'outputs', outputFileName);
    
    await runPythonScriptStreaming({
      templatePath,
      questionsPath: questionsFilePath,
      outputPath: outputFilePath,
      imagePath: thumbnailPath || null,
    }, sendEvent);

    if (!fs.existsSync(outputFilePath)) {
      throw new Error('Output file was not generated.');
    }

    // LOG IT TO DB
    try {
      await QuizLog.create({
        user: req.user._id,
        outputFileName,
        templateUsed: templateNumber,
        questionCount: formattedQuestions.length,
        rawQuestions,
        structuredQuestions: formattedQuestions
      });
    } catch (dbErr) {
      console.error('Failed to log quiz to DB:', dbErr);
      // We don't fail the generation if logging fails, but we note it in logs
    }

    const downloadUrl = `/outputs/${outputFileName}`;
    sendEvent({ step: 'complete', message: 'Generation successful!', downloadUrl });

    cleanup([thumbnailPath, questionsFilePath]);
    res.end();

  } catch (err) {
    console.error('Generation Error:', err);
    sendEvent({ error: err.message || 'Internal server error' });
    cleanup([thumbnailPath, questionsFilePath, outputFilePath]);
    res.end();
  }
};

const getTemplates = (req, res) => {
  const templatesDir = path.join(__dirname, '..', 'templates');
  if (!fs.existsSync(templatesDir)) return res.json({ templates: [] });

  const files = [
    { number: 'master', filename: 'slide_master.pptx', label: 'Slide Master' }
  ];

  res.json({ templates: files });
};

module.exports = {
  upload,
  generateQuiz,
  getTemplates
};
