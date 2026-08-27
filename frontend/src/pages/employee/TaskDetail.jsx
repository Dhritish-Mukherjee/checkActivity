import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, timeLogAPI } from '../../services';

const PRIORITY_BADGES = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold',
};

const STATUS_BADGES = {
  todo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  in_progress: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const STATUS_LABELS = {
  todo: 'To Do',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  // Manual entry
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    hours: '',
    minutes: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const startTick = useCallback((timer) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000));
    }, 1000);
    setElapsed(Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000));
  }, []);

  const stopTick = useCallback(() => {
    clearInterval(intervalRef.current);
    setElapsed(0);
  }, []);

  const formatElapsed = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const formatDuration = (mins) => {
    if (!mins && mins !== 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [taskRes, logsRes, activeRes] = await Promise.all([
        taskAPI.getTaskById(id),
        timeLogAPI.getTaskTimeLogs(id),
        timeLogAPI.getActiveTimer(),
      ]);

      setTask(taskRes.data.task);

      const logs = logsRes.data.timeLogs || [];
      setTimeLogs(logs.filter(l => l.durationMinutes > 0));

      const active = activeRes.data.activeTimer;
      if (active && active.task && active.task._id === id) {
        setActiveTimer(active);
        startTick(active);
      } else {
        setActiveTimer(null);
        stopTick();
      }
    } catch (err) {
      setError('Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [id, startTick, stopTick]);

  useEffect(() => {
    fetchAll();
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  const setStatus = async (status) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await taskAPI.updateTaskStatus(id, status);
      setTask(res.data.task);
      showSuccess(`Task status updated to "${STATUS_LABELS[status]}"`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTimer = async () => {
    setActionLoading(true);
    setError('');
    try {
      if (task.status === 'accepted' || task.status === 'todo') {
        await taskAPI.updateTaskStatus(id, 'in_progress');
        setTask(t => ({ ...t, status: 'in_progress' }));
      }
      const res = await timeLogAPI.startTimer(id);
      const timer = res.data.timeLog;
      setActiveTimer(timer);
      startTick(timer);
      showSuccess('Stopwatch started! You can navigate away anytime.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start timer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopTimer = async () => {
    setActionLoading(true);
    setError('');
    try {
      await timeLogAPI.stopTimer(activeTimer._id, {});
      setActiveTimer(null);
      stopTick();
      await fetchAll();
      showSuccess('Timer saved to your time log!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop timer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const h = parseInt(manualForm.hours) || 0;
    const m = parseInt(manualForm.minutes) || 0;
    if (h === 0 && m === 0) {
      setError('Please enter a valid duration (at least 1 minute).');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await timeLogAPI.createManualEntry({
        taskId: id,
        hours: h,
        minutes: m,
        date: manualForm.date,
        note: manualForm.note,
      });
      setManualForm({ hours: '', minutes: '', date: new Date().toISOString().slice(0, 10), note: '' });
      setShowManual(false);
      await fetchAll();
      showSuccess('Manual time logged successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log time.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalLogged = timeLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!task) return (
    <div className="text-center py-24 text-slate-500">Task not found.</div>
  );

  const isNew        = task.status === 'todo';
  const isAccepted   = task.status === 'accepted';
  const isInProgress = task.status === 'in_progress';
  const isCompleted  = task.status === 'completed';
  const canWork      = isAccepted || isInProgress;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
      >
        ← Back to My Tasks
      </button>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-2xl flex items-center gap-3">
          <span className="font-mono font-bold">[!:]</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-2xl flex items-center gap-3">
          <span className="font-mono font-bold">[OK]</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Task Header Banner */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-heading leading-tight mb-1">
              {task.title}
            </h1>
            <p className="text-xs text-slate-400">Task ID: #{task._id}</p>
          </div>
          <span className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${STATUS_BADGES[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        {task.description && (
          <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-white/5">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${PRIORITY_BADGES[task.priority]}`}>
            {task.priority} priority
          </span>

          {task.dueDate && (
            <span className="flex items-center gap-1 font-mono">
              [DATE] <strong className="text-slate-200">{new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</strong>
            </span>
          )}

          {task.assignedBy && (
            <span className="flex items-center gap-1 font-mono">
              [BY] <strong className="text-slate-200">{task.assignedBy.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* STEP 1: Accept Task */}
      {isNew && (
        <div className="card border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0 font-mono text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-sweep" />
              [&gt;&gt;]
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">Step 1 — Accept Task</h2>
              <p className="text-xs text-slate-400">Accept this task to begin tracking time and progress.</p>
            </div>
          </div>
          <button
            onClick={() => setStatus('accepted')}
            disabled={actionLoading}
            className="btn-primary shrink-0 w-full sm:w-auto"
          >
            <span className="font-mono mr-2">[OK]</span> Accept Task
          </button>
        </div>
      )}

      {/* STEP 2: Digital Stopwatch Dashboard */}
      {canWork && !isCompleted && (
        <div className={`card relative overflow-hidden transition-all duration-300 ${
          activeTimer
            ? 'border-violet-500/50 shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-slate-900/90'
            : 'border-white/10'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-mono font-bold ${
                activeTimer ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse-glow' : 'bg-white/5 text-slate-400'
              }`}>
                (O)
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-heading">Step 2 — Track Time</h2>
                <p className="text-xs text-slate-400">
                  {activeTimer ? 'Timer is active in background' : 'Start stopwatch or log time manually'}
                </p>
              </div>
            </div>

            {activeTimer && (
              <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                Live Running
              </span>
            )}
          </div>

          {/* Digital Timer Display */}
          <div className="text-center py-6 bg-slate-950/60 rounded-2xl border border-white/5 my-4">
            <p className={`font-mono text-6xl sm:text-7xl font-black tracking-widest tabular-nums mb-6 transition-colors ${
              activeTimer
                ? 'bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : 'text-slate-600'
            }`}>
              {formatElapsed(elapsed)}
            </p>

            {activeTimer ? (
              <button
                onClick={handleStopTimer}
                disabled={actionLoading}
                className="btn-danger text-base px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 mx-auto"
              >
                <span className="w-3.5 h-3.5 bg-white rounded-sm shrink-0" />
                <span>Stop &amp; Save Time Log</span>
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                disabled={actionLoading}
                className="btn-primary text-base px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 mx-auto"
              >
                <span className="font-mono">[&gt;]</span> <span>Start Stopwatch</span>
              </button>
            )}
          </div>

          {/* Manual Entry Accordion */}
          {!activeTimer && (
            <div className="pt-2">
              {!showManual ? (
                <button
                  onClick={() => setShowManual(true)}
                  className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2"
                >
                  <span className="font-mono text-indigo-400 mr-2">[+]</span> <span>Or enter time manually</span>
                </button>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4 p-5 bg-slate-950/80 border border-white/10 rounded-2xl mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Manual Time Entry</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Hours</label>
                      <input
                        type="number" min="0" placeholder="0"
                        value={manualForm.hours}
                        onChange={e => setManualForm({ ...manualForm, hours: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Minutes</label>
                      <input
                        type="number" min="0" max="59" placeholder="0"
                        value={manualForm.minutes}
                        onChange={e => setManualForm({ ...manualForm, minutes: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={manualForm.date}
                      onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Note (optional)</label>
                    <input
                      type="text" placeholder="What did you work on?"
                      value={manualForm.note}
                      onChange={e => setManualForm({ ...manualForm, note: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={actionLoading} className="btn-primary flex-1 text-sm py-2">
                      Log Time
                    </button>
                    <button type="button" onClick={() => setShowManual(false)} className="btn-secondary text-sm py-2 px-4">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Complete Task */}
      {canWork && !isCompleted && !activeTimer && (
        <div className="card border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 font-mono text-emerald-400">
              [V]
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">Step 3 — Mark Task Completed</h2>
              <p className="text-xs text-slate-400">Finish work and submit for final review.</p>
            </div>
          </div>
          <button
            onClick={() => setStatus('completed')}
            disabled={actionLoading}
            className="btn-success shrink-0 w-full sm:w-auto"
          >
            <span className="font-mono mr-2">[DONE]</span> Complete Task
          </button>
        </div>
      )}

      {/* Completed Banner */}
      {isCompleted && (
        <div className="card border-emerald-500/40 bg-emerald-950/30 text-center py-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(16,185,129,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-sweep" />
          <div className="text-4xl mb-3 font-mono text-emerald-500 font-bold tracking-widest relative z-10">[DONE]</div>
          <h2 className="text-2xl font-extrabold text-white font-heading relative z-10">Task Completed!</h2>
          <p className="text-sm text-emerald-400 mt-2 font-medium">
            Total logged time: <strong className="text-white text-base">{formatDuration(totalLogged)}</strong>
          </p>
        </div>
      )}

      {/* Time Log History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <h2 className="text-base font-bold text-white font-heading">Time Log History</h2>
          {totalLogged > 0 && (
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Total: {formatDuration(totalLogged)}
            </span>
          )}
        </div>

        {timeLogs.length === 0 ? (
          <p className="text-center py-8 text-slate-500 text-sm">No time logged for this task yet.</p>
        ) : (
          <div className="space-y-2.5">
            {timeLogs.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-white/5 text-sm">
                <div>
                  <p className="text-slate-200 font-medium">{log.note || 'Work session'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' · '}
                    <span className="uppercase text-indigo-400 font-semibold">{log.type}</span>
                    {log.user?.name && ` · ${log.user.name}`}
                  </p>
                </div>
                <span className="font-mono font-bold text-white text-base bg-slate-900 px-3 py-1 rounded-lg border border-white/10">
                  {formatDuration(log.durationMinutes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;