# Quiz Engine

## Overview

The Quiz Engine converts raw educational text into professionally formatted bilingual (English/Bengali) PowerPoint presentations using AI-powered formatting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        QUIZ GENERATION PIPELINE                              │
└─────────────────────────────────────────────────────────────────────────────┘

User Input (Raw Text)
        │
        ▼
┌───────────────────┐
│   Frontend        │  QuizGenerator.jsx
│   Form Submit     │
└─────────┬─────────┘
          │
          │ POST /api/quiz-generator/generate
          │ Content-Type: multipart/form-data
          ▼
┌───────────────────┐
│   Express API     │  quizGeneratorController.js
│   - Validate      │
│   - Multer upload │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Google Gemini   │  formatQuestionsWithAI()
│   AI Formatting   │  - Structure questions
│                   │  - Translate to bilingual
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Structured JSON │  questions.json
│   [{              │
│     question_en,  │
│     question_bn,  │
│     options: [...]│
│   }]              │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Python Script   │  generate_quiz.py
│   - Load template │
│   - Create slides │
│   - Add content   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Output PPTX     │  /outputs/quiz_xxx.pptx
│   - 25+ slides    │
│   - Formatted     │
│   - Downloadable  │
└───────────────────┘
```

---

## API Endpoint

### POST /api/quiz-generator/generate

**Content-Type**: `multipart/form-data`

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| questions | string | Yes | Raw question text |
| templateNumber | string | Yes | Template identifier (e.g., "master") |
| outputName | string | No | Output filename (default: quiz_timestamp) |
| thumbnail | file | No | Cover image (jpg, png, gif, webp) |

**Response**: Server-Sent Events (SSE) stream

---

## Server-Sent Events

The generation process streams real-time updates to the frontend.

### Event Format
```
data: {"step": "formatting", "message": "🧠 AI Engine is structuring questions..."}

data: {"step": "python_log", "message": "📋 Loaded 25 questions"}

data: {"step": "complete", "message": "Generation successful!", "downloadUrl": "/outputs/quiz_xxx.pptx"}
```

### Event Types
| Step | Description |
|------|-------------|
| `formatting` | AI is processing questions |
| `formatting_complete` | AI finished formatting |
| `python_start` | Python script starting |
| `python_log` | Progress message from Python |
| `complete` | Generation successful |
| `error` | Error occurred |

### Frontend Handling
```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  chunk.split('\n').forEach(line => {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      if (data.error) {
        setError(data.error);
      } else if (data.step === 'complete') {
        setDownloadUrl(data.downloadUrl);
      } else {
        addLog(data.message, data.step);
      }
    }
  });
}
```

---

## AI Formatting

### Google Gemini Integration

**Model**: `gemini-2.5-flash-lite`

**Purpose**: 
1. Parse raw question text into structured JSON
2. Translate to bilingual (English/Bengali)
3. Improve formatting

### AI Prompt Structure
```
You are a bilingual quiz formatter for Bengali and English.
Convert the following raw quiz questions into a valid JSON array.

RULES:
1. Each question MUST have both English and Bengali versions.
2. Each option MUST have an English ("en") version.
3. Each option MUST also have a Bengali ("bn") translation.
4. ONLY leave the Bengali ("bn") field EMPTY ("") if the option is:
   - Universal symbol
   - Chemical formula (like H2O)
   - Number (like 100°C)
   - Identical in both languages
5. If Bengali is missing, translate accurately from English.
6. If English is missing, translate accurately from Bengali.
7. Remove option prefixes like "A.", "B.", "1." from the text.
8. Output ONLY the raw JSON array — no markdown.

OUTPUT FORMAT:
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
```

### Output Structure
```json
[
  {
    "question_en": "What is the capital of France?",
    "question_bn": "ফ্রান্সের রাজধানী কী?",
    "options": [
      { "en": "London", "bn": "লন্ডন" },
      { "en": "Paris", "bn": "প্যারিস" },
      { "en": "Berlin", "bn": "বার্লিন" },
      { "en": "Madrid", "bn": "মাদ্রিদ" }
    ]
  }
]
```

---

## Python Script

### File: `scripts/generate_quiz.py`

### Dependencies
```python
from pptx import Presentation
from pptx.util import Inches, Pt
from PIL import Image
import argparse
import json
```

Install with:
```bash
pip install python-pptx pillow
```

### Command Line Arguments
```bash
python generate_quiz.py \
  --template templates/slide_master.pptx \
  --questions outputs/questions_xxx.json \
  --output outputs/quiz_xxx.pptx \
  --image outputs/thumb_xxx.jpg  # Optional
```

### Process Flow
1. **Load Template**: Opens the PPTX template
2. **Parse Questions**: Reads structured JSON
3. **Create Slides**: Generates question slides
4. **Add Content**: Inserts text and formatting
5. **Replace Cover**: Updates slide 1 image (if provided)
6. **Save Output**: Writes final PPTX

### Slide Structure
```
Slide 1: Cover (title + optional image)
Slide 2: Question 1 (EN + BN)
Slide 3: Options for Q1 (A, B, C, D)
Slide 4: Question 2
Slide 5: Options for Q2
... and so on
```

---

## Templates

### Template Location
`backend/templates/slide_master.pptx`

### Template Requirements
- Must be a valid PPTX file
- Should have master slide layouts
- Placeholders for content injection

### Template API
```javascript
GET /api/quiz-generator/templates

Response:
{
  "templates": [
    {
      "number": "master",
      "filename": "slide_master.pptx",
      "label": "Slide Master"
    }
  ]
}
```

### Adding New Templates
1. Create PPTX file in `templates/` folder
2. Update `getTemplates()` in controller
3. Add to templates array:
```javascript
{
  number: "template_2",
  filename: "style_2.pptx",
  label: "Modern Style"
}
```

---

## Cover Image

### Upload Process
1. User selects image file
2. Uploaded via Multer to `/outputs` folder
3. Passed to Python script as `--image` argument
4. Python replaces slide 1 background

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Size Limit
- Maximum: 10MB

### Python Implementation
```python
def replace_cover_image(prs, image_path):
    slide = prs.slides[0]
    # Replace background or add image
    # Implementation depends on template structure
```

---

## File Management

### Temporary Files
```javascript
// Created during generation
let thumbnailPath = null;    // Uploaded image
let questionsFilePath = null; // JSON file
let outputFilePath = null;   // Generated PPTX

// Cleanup after completion
function cleanup(paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }
}
```

### Output Storage
- Generated files stored in `/outputs`
- Served statically at `/outputs/filename.pptx`
- Download URL: `/outputs/quiz_xxx.pptx`

---

## Quiz Logging

### Database Record
Every generation is logged to MongoDB:

```javascript
QuizLog.create({
  user: req.user._id,
  outputFileName: "quiz_xxx.pptx",
  templateUsed: "master",
  questionCount: 25,
  rawQuestions: "Original input text...",
  structuredQuestions: [{ ... }]  // AI formatted
});
```

### Purpose
- Track usage
- Analytics for dashboard
- Audit trail
- Potential for regeneration

---

## Frontend Component

### QuizGenerator.jsx

**Key Features**:
- Template selection with preview
- Raw text input (textarea)
- File upload for cover image
- Real-time console output
- Download button on completion
- Confetti celebration on success

### State Management
```javascript
const [questions, setQuestions] = useState('');
const [thumbnail, setThumbnail] = useState(null);
const [outputName, setOutputName] = useState('Strivers_Quiz');
const [template, setTemplate] = useState('master');
const [isGenerating, setIsGenerating] = useState(false);
const [logs, setLogs] = useState([]);
const [downloadUrl, setDownloadUrl] = useState(null);
const [error, setError] = useState(null);
```

### Console Box
Auto-scrolling log display:
```javascript
useEffect(() => {
  const box = consoleBoxRef.current;
  const isNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (isNearBottom) {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [logs]);
```

---

## Error Handling

### Backend Errors
```javascript
// Template not found
if (!fs.existsSync(templatePath)) {
  return sendEvent({ error: 'Template not found' });
}

// AI formatting error
try {
  const formatted = await formatQuestionsWithAI(rawQuestions, sendEvent);
} catch (err) {
  return sendEvent({ error: `AI Engine error: ${err.message}` });
}

// Python script error
pyProcess.on('close', (code) => {
  if (code !== 0) {
    reject(new Error(`Python script failed with code ${code}`));
  }
});
```

### Frontend Errors
```javascript
// SSE error handling
if (data.error) {
  setError(data.error);
  setIsGenerating(false);
}

// Network error
} catch (err) {
  setError(err.message);
  addLog(`Failure: ${err.message}`, 'error');
}
```

---

## Performance

### Typical Generation Time
- 10 questions: ~5 seconds
- 25 questions: ~10 seconds
- 50 questions: ~18 seconds

### Optimization Tips
- Use Gemini Flash Lite (fast model)
- Batch process in Python
- Minimal file I/O
- SSE for perceived performance

---

## Best Practices

### Question Input Format
```
1. What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid

2. Which planet is known as the Red Planet?
A. Venus
B. Mars
C. Jupiter
D. Saturn
```

### Output Naming
- Use descriptive names: `Physics_Chapter5_Quiz`
- Avoid special characters
- System adds unique suffix automatically

### Template Selection
- "Slide Master" is the default
- Preview templates before selecting
- Custom templates require backend update

---

## Troubleshooting

### Python Not Found
```bash
# Check Python installation
which python3

# Check venv
ls backend/venv/bin/python

# If missing, create venv
cd backend
python3 -m venv venv
source venv/bin/activate
pip install python-pptx pillow
```

### AI Formatting Errors
- Check GEMINI_API_KEY is set
- Verify API quota
- Check input text format
- Review error message in console

### File Not Generated
- Check `/outputs` folder permissions
- Check Python script execution
- Review server logs
- Verify template exists

### Download Not Working
- Check file exists in `/outputs`
- Verify static file serving
- Check CORS settings
- Try direct URL: `http://localhost:5000/outputs/filename.pptx`
