import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileDown, Play, Info, Layers, Eye, X, Terminal as ConsoleIcon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../../services';

const QuizGenerator = () => {
  const [questions, setQuestions] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [outputName, setOutputName] = useState('Strivers_Quiz');
  const [template, setTemplate] = useState('master');
  const [templates, setTemplates] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const logEndRef = useRef(null);
  const consoleBoxRef = useRef(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/quiz-generator/templates');
        setTemplates(response.data.templates || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const box = consoleBoxRef.current;
    if (!box) return;
    const isNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    if (isNearBottom) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg, step = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: msg,
      step
    }]);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setLogs([]);
    setDownloadUrl(null);
    setError(null);
    addLog('Establishing link to Strivers Core...', 'info');

    const formData = new FormData();
    formData.append('questions', questions);
    formData.append('templateNumber', template);
    formData.append('outputName', outputName || 'Strivers_Quiz');
    if (thumbnail) formData.append('thumbnail', thumbnail);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'}/quiz-generator/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) { 
                setError(data.error); 
                addLog(data.error, 'error'); 
                setIsGenerating(false); 
              } else if (data.step === 'complete') {
                addLog('Success: Assets generated successfully.', 'complete');
                setDownloadUrl(data.downloadUrl);
                setIsGenerating(false);
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 } });
              } else { 
                addLog(data.message, data.step); 
              }
            } catch (e) {
              console.error("Error parsing SSE JSON:", e);
            }
          }
        });
      }
    } catch (err) {
      setError(err.message);
      addLog(`Failure: ${err.message}`, 'error');
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-heading)] tracking-tight font-heading flex items-center gap-2">
          <Zap size={28} className="text-indigo-500 dark:text-indigo-400" />
          Content Engine
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Convert raw educational text into high-engagement PowerPoint slides.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
            <form onSubmit={handleGenerate} className="space-y-6">
              
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  1. Design Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {templates.length > 0 ? (
                    templates.map(t => (
                      <div
                        key={t.number}
                        className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                          template === t.number 
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                            : 'bg-[var(--bg-subtle)] border-[var(--border-base)] text-[var(--text-muted)] hover:bg-[var(--border-base)]'
                        }`}
                        onClick={() => setTemplate(t.number)}
                      >
                        <Layers size={20} className="mb-2 opacity-80" />
                        <div className="text-xs font-bold">{t.label || `Style ${t.number}`}</div>
                        <button
                          type="button"
                          title="Preview template"
                          onClick={(e) => {
                            e.stopPropagation();
                            const absolute = `${window.location.origin}/templates/${t.filename}`;
                            setPreviewUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolute)}`);
                            setPreviewOpen(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]`}
                      onClick={() => setTemplate('master')}
                    >
                      <Layers size={20} className="mb-2 opacity-80" />
                      <div className="text-xs font-bold">Slide Master</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  2. Quiz Data (Markdown or Text)
                </label>
                <textarea 
                  rows="10" 
                  placeholder="Paste your questions here... (e.g. 1. What is JVM? A. B. C. D.)" 
                  value={questions} 
                  onChange={(e) => setQuestions(e.target.value)} 
                  required
                  className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-[var(--text-base)] text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  3. Cover Image (Optional)
                </label>
                <input type="file" id="thumb" hidden onChange={(e) => setThumbnail(e.target.files[0])} accept="image/*" />
                <label 
                  htmlFor="thumb" 
                  className="block w-full border border-dashed border-[var(--border-base)] rounded-xl p-6 text-center bg-[var(--bg-subtle)] hover:bg-[var(--border-base)] transition-colors cursor-pointer"
                >
                  <Upload size={24} className="mx-auto mb-2 text-[var(--text-faint)]" />
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    {thumbnail ? thumbnail.name : 'Click to upload a cover image (replaces slide 1 background)'}
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  4. Output File Name
                </label>
                <input 
                  type="text" 
                  value={outputName} 
                  onChange={(e) => setOutputName(e.target.value)} 
                  placeholder="e.g. Science_Quiz_01" 
                  className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-[var(--text-base)] text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <button 
                  type="submit" 
                  className="btn-primary w-full py-4 text-base flex justify-center"
                  disabled={isGenerating || !questions}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Assets...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play size={20} />
                      <span>Execute Production</span>
                    </div>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>

        {/* Console Box */}
        <div className="lg:col-span-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card h-full flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
              <ConsoleIcon size={18} />
              Runtime Console
            </h3>
            
            <div 
              ref={consoleBoxRef}
              className="flex-1 bg-black/5 dark:bg-slate-950 rounded-xl p-4 overflow-y-auto font-mono text-xs border border-[var(--border-base)] relative min-h-[300px] max-h-[500px]"
            >
              {logs.length === 0 && <div className="text-[var(--text-faint)]">READY: Waiting for buffer instruction...</div>}
              {logs.map(log => (
                <div key={log.id} className="mb-2">
                  <span className="text-[var(--text-muted)] mr-2">[{log.time}]</span>
                  <span className={`
                    ${log.step === 'error' ? 'text-rose-500 dark:text-rose-400' : ''}
                    ${log.step === 'complete' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                    ${log.step === 'info' ? 'text-cyan-600 dark:text-cyan-400' : ''}
                    ${!['error', 'complete', 'info'].includes(log.step) ? 'text-[var(--text-base)]' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))}
              {isGenerating && <div className="w-2 h-4 bg-indigo-500 animate-pulse mt-2" />}
              <div ref={logEndRef} />
            </div>

            <AnimatePresence>
              {downloadUrl && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
                  <a 
                    href={`${import.meta.env.PROD ? '' : 'http://localhost:5000'}${downloadUrl}`} 
                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    download={outputName ? `${outputName}.pptx` : 'Strivers_Quiz.pptx'}
                  >
                    <FileDown size={18} /> Retrieve PPTX
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {error && !isGenerating && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                <strong>CRITICAL_ERROR:</strong> {error}
              </div>
            )}

            <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-2">Guidelines</div>
              <div className="space-y-2 text-xs text-[var(--text-faint)]">
                <div className="flex gap-2"><Info size={14} className="shrink-0 text-[var(--text-faint)]" /> PPTX will be generated based on Strivers theme.</div>
                <div className="flex gap-2"><Info size={14} className="shrink-0 text-[var(--text-faint)]" /> AI optimizes for readable text density automatically.</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-5xl h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/50">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Eye size={16} />
                  <span className="text-sm font-bold text-white">Template Preview</span>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <iframe
                src={previewUrl}
                title="Template Preview"
                className="flex-1 w-full bg-white border-none"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizGenerator;
