import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, timeLogAPI } from '../../services';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    hours: 0,
    minutes: 0,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  // Timer state
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchTaskData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  // Timer tick
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer]);

  const fetchTaskData = async () => {
    try {
      const [taskRes, logsRes] = await Promise.all([
        taskAPI.getTaskById(id),
        timeLogAPI.getTaskTimeLogs(id),
      ]);
      setTask(taskRes.data.task);
      setTimeLogs(logsRes.data.timeLogs);

      // Check if there's an active timer
      const active = logsRes.data.timeLogs.find((log) => !log.endTime && log.type === 'timer');
      if (active) {
        setActiveTimer(active);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await taskAPI.updateTaskStatus(id, newStatus);
      setTask({ ...task, status: newStatus });
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await timeLogAPI.createManualEntry({
        taskId: id,
        hours: manualForm.hours,
        minutes: manualForm.minutes,
        date: manualForm.date,
        note: manualForm.note,
      });
      setManualForm({
        hours: 0,
        minutes: 0,
        date: new Date().toISOString().slice(0, 10),
        note: '',
      });
      fetchTaskData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to log time');
    }
  };

  const handleStartTimer = async () => {
    try {
      const res = await timeLogAPI.startTimer(id);
      setActiveTimer(res.data.timeLog);
      setElapsed(0);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await timeLogAPI.stopTimer(activeTimer._id, {});
      setActiveTimer(null);
      setElapsed(0);
      fetchTaskData();
    } catch (error) {
      alert('Failed to stop timer');
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return <p className="text-center py-8 text-slate-500">Loading...</p>;
  }

  if (!task) {
    return <p className="text-center py-8 text-slate-500">Task not found</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => navigate('/tasks')}
        className="text-blue-600 hover:underline text-sm"
      >
        ← Back to My Tasks
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{task.title}</h1>
        {task.description && (
          <p className="text-slate-600 mb-4">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span>Priority: <strong className="text-slate-800">{task.priority}</strong></span>
          {task.dueDate && (
            <span>Due: <strong className="text-slate-800">{new Date(task.dueDate).toLocaleDateString()}</strong></span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={task.status}
            onChange={handleStatusChange}
            className="px-3 py-2 border border-slate-300 rounded-md"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timer */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Timer</h2>
        {activeTimer ? (
          <div className="text-center py-6">
            <p className="text-5xl font-mono font-bold text-primary mb-4">
              {formatTime(elapsed)}
            </p>
            <button
              onClick={handleStopTimer}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              ⏸ Stop Timer
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-500 mb-4">No active timer</p>
            <button
              onClick={handleStartTimer}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              ▶ Start Timer
            </button>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Log Time Manually</h2>
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hours</label>
              <input
                type="number"
                min="0"
                value={manualForm.hours}
                onChange={(e) =>
                  setManualForm({ ...manualForm, hours: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={manualForm.minutes}
                onChange={(e) =>
                  setManualForm({ ...manualForm, minutes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note (optional)</label>
            <textarea
              rows={2}
              value={manualForm.note}
              onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Log Time
          </button>
        </form>
      </div>

      {/* Time Logs */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Time Logs</h2>
        {timeLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No time logged yet</p>
        ) : (
          <div className="space-y-2">
            {timeLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="text-sm text-slate-800">{log.note || 'No note'}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(log.date).toLocaleDateString()} ·{' '}
                    <span className="uppercase">{log.type}</span>
                  </p>
                </div>
                <p className="font-semibold text-slate-800">
                  {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;