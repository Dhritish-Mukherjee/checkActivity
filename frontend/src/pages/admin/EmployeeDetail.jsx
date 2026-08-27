import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskAPI, timeLogAPI, authAPI } from '../../services';

const STATUS_BADGES = {
  todo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  in_progress: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const [empRes, tasksRes, logsRes] = await Promise.all([
        authAPI.getEmployees(),
        taskAPI.getAllTasks({ assignedTo: id }),
        timeLogAPI.getAllTimeLogs({ userId: id }),
      ]);

      const emp = empRes.data.employees.find((e) => e._id === id);
      setEmployee(emp);
      setTasks(tasksRes.data.tasks || []);
      setTimeLogs(logsRes.data.timeLogs || []);
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return <p className="text-center py-16 text-slate-500">Employee record not found.</p>;
  }

  const totalHours = timeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0) / 60;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/employees" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        ← Back to Team Directory
      </Link>

      <div className="card flex items-center gap-4 bg-gradient-to-r from-indigo-950/40 to-slate-900/80 border-indigo-500/30">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-2xl shadow-xl shadow-indigo-500/20 border border-white/20 shrink-0 overflow-hidden">
          {employee.profilePicture ? (
            <img src={employee.profilePicture} alt={employee.name} className="w-full h-full object-cover" />
          ) : (
            employee.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white font-heading">{employee.name}</h1>
          <p className="text-sm text-slate-400">{employee.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Assigned</p>
          <p className="text-3xl font-extrabold text-white font-mono">{tasks.length}</p>
        </div>
        <div className="card border-emerald-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Completed</p>
          <p className="text-3xl font-extrabold text-emerald-300 font-mono">{completedTasks}</p>
        </div>
        <div className="card border-cyan-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">Total Hours Logged</p>
          <p className="text-3xl font-extrabold text-cyan-300 font-mono">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-base font-bold text-white font-heading mb-4 border-b border-white/10 pb-3">Assigned Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-slate-500 text-center py-6 text-sm">No tasks assigned to this employee.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-white text-sm">{task.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline'}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGES[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-base font-bold text-white font-heading mb-4 border-b border-white/10 pb-3">Activity &amp; Time Logs</h2>
        {timeLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-6 text-sm">No time logs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {timeLogs.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-white text-sm">{log.task?.title || 'Task'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {log.note || 'Work session'} · {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white text-sm bg-slate-900 px-3 py-1 rounded-xl border border-white/10 inline-block">
                    {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                  </span>
                  <p className="text-[10px] uppercase font-bold text-indigo-400 mt-1">{log.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;