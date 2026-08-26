import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, timeLogAPI } from '../../services';

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  todo: 'bg-slate-100 text-slate-600',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
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

  // activeTimer = the DB record of the running timer (must belong to current user on this task)
  const [activeTimer, setActiveTimer] = useState(null);
  // elapsed is always computed from startTime so it survives page reloads
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

  // ─── helpers ────────────────────────────────────────────────────────────────
  const startTick = useCallback((timer) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000));
    }, 1000);
    // set immediately so there's no 1-second blank
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
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ─── data fetching ───────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      // Fetch task data, task's completed time logs, AND user's global active timer in parallel
      const [taskRes, logsRes, activeRes] = await Promise.all([
        taskAPI.getTaskById(id),
        timeLogAPI.getTaskTimeLogs(id),
        timeLogAPI.getActiveTimer(),   // <-- checks DB for THIS user's running timer
      ]);

      setTask(taskRes.data.task);

      // Only show completed logs (durationMinutes > 0)
      const logs = logsRes.data.timeLogs || [];
      setTimeLogs(logs.filter(l => l.durationMinutes > 0));

      // Is the user's active timer for THIS task?
      const active = activeRes.data.activeTimer;
      if (active && active.task && active.task._id === id) {
        setActiveTimer(active);
        startTick(active);
      } else {
        setActiveTimer(null);
        stopTick();
      }
    } catch (err) {
      setError('Failed to load task. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [id, startTick, stopTick]);

  useEffect(() => {
    fetchAll();
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  // ─── actions ─────────────────────────────────────────────────────────────────
  const setStatus = async (status) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await taskAPI.updateTaskStatus(id, status);
      setTask(res.data.task);
      showSuccess(`Status updated to "${STATUS_LABELS[status]}"`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTimer = async () => {
    setActionLoading(true);
    setError('');
    try {
      // Auto-advance status to in_progress
      if (task.status === 'accepted' || task.status === 'todo') {
        await taskAPI.updateTaskStatus(id, 'in_progress');
        setTask(t => ({ ...t, status: 'in_progress' }));
      }
      const res = await timeLogAPI.startTimer(id);
      const timer = res.data.timeLog;
      setActiveTimer(timer);
      startTick(timer);
      showSuccess('Timer started!');
    } catch (err) {
      // Backend sends a clear message if another timer is already running
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
      showSuccess('Timer stopped and time saved!');
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
      showSuccess('Time logged successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log time.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalLogged = timeLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  // ─── render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
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
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        ← Back to My Tasks
      </button>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{successMsg}</div>
      )}

      {/* ── Task Header ── */}
      <div className="card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">{task.title}</h1>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${STATUS_COLORS[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        {task.description && (
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className={`px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority} priority
          </span>
          {task.dueDate && (
            <span>📅 Due: <strong className="text-slate-700">
              {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </strong></span>
          )}
          {task.assignedBy && (
            <span>👤 Assigned by: <strong className="text-slate-700">{task.assignedBy.name}</strong></span>
          )}
        </div>
      </div>

      {/* ── STEP 1: Accept ── */}
      {isNew && (
        <div className="card border-2 border-blue-100 bg-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📥</span>
            <div>
              <h2 className="font-semibold text-slate-800">Step 1 — Accept this task</h2>
              <p className="text-sm text-slate-500">Let the team know you've picked this up.</p>
            </div>
          </div>
          <button
            onClick={() => setStatus('accepted')}
            disabled={actionLoading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            ✅ Accept Task
          </button>
        </div>
      )}

      {/* ── STEP 2: Stopwatch + Manual ── */}
      {canWork && !isCompleted && (
        <div className={`card border-2 ${isInProgress ? 'border-violet-200 bg-violet-50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⏱️</span>
            <div>
              <h2 className="font-semibold text-slate-800">Step 2 — Track your time</h2>
              <p className="text-sm text-slate-500">
                {activeTimer
                  ? 'Timer is running. It will keep running even if you close the page.'
                  : 'Use the stopwatch or enter time manually.'}
              </p>
            </div>
          </div>

          {/* Stopwatch */}
          <div className="text-center py-4">
            <p className={`text-6xl font-mono font-bold tabular-nums mb-6 ${activeTimer ? 'text-violet-700' : 'text-slate-200'}`}>
              {formatElapsed(elapsed)}
            </p>

            {activeTimer ? (
              <button
                onClick={handleStopTimer}
                disabled={actionLoading}
                className="px-10 py-3 bg-red-500 text-white font-bold rounded-full text-lg hover:bg-red-600 transition-all shadow-lg disabled:opacity-50 mx-auto flex items-center gap-3"
              >
                <span className="w-4 h-4 bg-white rounded-sm shrink-0"></span>
                Stop &amp; Save
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                disabled={actionLoading}
                className="px-10 py-3 bg-green-500 text-white font-bold rounded-full text-lg hover:bg-green-600 transition-all shadow-lg disabled:opacity-50 mx-auto flex items-center gap-3"
              >
                ▶ Start Timer
              </button>
            )}
          </div>

          {/* Manual divider */}
          {!activeTimer && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="text-xs text-slate-400 font-medium">OR LOG MANUALLY</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>

              {!showManual ? (
                <button
                  onClick={() => setShowManual(true)}
                  className="w-full py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  ✏️ Enter time manually
                </button>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-3 border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hours</label>
                      <input
                        type="number" min="0" placeholder="0"
                        value={manualForm.hours}
                        onChange={e => setManualForm({ ...manualForm, hours: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Minutes</label>
                      <input
                        type="number" min="0" max="59" placeholder="0"
                        value={manualForm.minutes}
                        onChange={e => setManualForm({ ...manualForm, minutes: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={manualForm.date}
                      onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Note (optional)</label>
                    <input
                      type="text" placeholder="What did you work on?"
                      value={manualForm.note}
                      onChange={e => setManualForm({ ...manualForm, note: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={actionLoading}
                      className="flex-1 py-2 bg-primary text-white font-semibold rounded-lg text-sm disabled:opacity-50">
                      Log Time
                    </button>
                    <button type="button" onClick={() => setShowManual(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* ── STEP 3: Complete ── */}
      {canWork && !isCompleted && !activeTimer && (
        <div className="card border-2 border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏁</span>
            <div>
              <h2 className="font-semibold text-slate-800">Step 3 — Mark as complete</h2>
              <p className="text-sm text-slate-500">Done? Close it out.</p>
            </div>
          </div>
          <button
            onClick={() => setStatus('completed')}
            disabled={actionLoading}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
          >
            🎉 Complete Task
          </button>
        </div>
      )}

      {/* ── Completed state ── */}
      {isCompleted && (
        <div className="card border-2 border-green-200 bg-green-50 text-center py-8">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="font-bold text-green-800 text-xl">Task Completed!</h2>
          <p className="text-green-600 text-sm mt-2">
            Total time logged: <strong>{formatDuration(totalLogged)}</strong>
          </p>
        </div>
      )}

      {/* ── Time Logs History ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Time Log History</h2>
          {totalLogged > 0 && (
            <span className="text-sm font-medium text-primary">Total: {formatDuration(totalLogged)}</span>
          )}
        </div>

        {timeLogs.length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-sm">No time logged yet.</p>
        ) : (
          <div className="space-y-2">
            {timeLogs.map(log => (
              <div key={log._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                <div>
                  <p className="text-slate-700 font-medium">{log.note || 'No note'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' · '}
                    <span className="uppercase tracking-wide">{log.type}</span>
                    {log.user?.name && ` · ${log.user.name}`}
                  </p>
                </div>
                <span className="font-bold text-slate-800 tabular-nums ml-4 shrink-0">
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