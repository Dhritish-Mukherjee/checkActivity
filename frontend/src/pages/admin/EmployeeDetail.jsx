import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskAPI, timeLogAPI, authAPI, youtubeAPI } from '../../services';
import CatLoader from '../../components/CatLoader';

const STATUS_BADGES = {
  todo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  in_progress: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

const isFaculty = (dept) => Array.isArray(dept) ? dept.includes('faculty') : dept === 'faculty';

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [ytVideos, setYtVideos] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchEmployeeData(); }, [id]);

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
      if (isFaculty(emp?.department)) {
        try {
          const teachersRes = await youtubeAPI.getTeachers();
          const teacher = teachersRes.data.teachers.find((t) => t._id === id);
          if (teacher) {
            setYtVideos(teacher.recentVideos || []);
            setEmployee((prev) => ({ ...prev, teacherStats: teacher.teacherStats, youtubeAlias: teacher.youtubeAlias, isPlaceholder: teacher.isPlaceholder }));
          }
        } catch (_) { /* non-fatal */ }
      }
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20"><CatLoader text="Loading Employee Profile..." /></div>
  );

  if (!employee) return (
    <p className="text-center py-16" style={{ color: 'var(--text-faint)' }}>Employee record not found.</p>
  );

  const totalHours = timeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0) / 60;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/employees" className="inline-flex items-center gap-2 text-xs font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>
        ← Back to Team Directory
      </Link>

      <div className={`card flex items-center gap-4 bg-gradient-to-r ${isFaculty(employee.department) ? 'from-violet-500/10 to-transparent dark:from-violet-950/40 dark:to-slate-900/80 border-violet-500/30' : 'from-indigo-500/10 to-transparent dark:from-indigo-950/40 dark:to-slate-900/80 border-indigo-500/30'}`}>
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${isFaculty(employee.department) ? 'from-violet-600 to-purple-600 shadow-violet-500/20' : 'from-indigo-600 to-purple-600 shadow-indigo-500/20'} text-white font-black flex items-center justify-center text-2xl shadow-xl border border-white/20 shrink-0 overflow-hidden`}>
          {employee.profilePicture ? (
            <img src={employee.profilePicture} alt={employee.name} className="w-full h-full object-cover" />
          ) : employee.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold font-heading" style={{ color: 'var(--text-heading)' }}>{employee.name}</h1>
            {isFaculty(employee.department) && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">Faculty</span>
            )}
            {employee.isPlaceholder && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">Placeholder — edit name/email</span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{employee.email}</p>
          {employee.youtubeAlias && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>YouTube alias: <span style={{ color: 'var(--text-base)' }}>{employee.youtubeAlias}</span></p>
          )}
        </div>
      </div>

      {/* Stats row */}
      {isFaculty(employee.department) ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="card border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent dark:from-violet-950/30 dark:to-slate-900/60">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Total Classes</p>
            <p className="text-3xl font-extrabold font-mono" style={{ color: 'var(--text-heading)' }}>{employee.teacherStats?.totalClasses || 0}</p>
          </div>
          <div className="card border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent dark:from-cyan-950/30 dark:to-slate-900/60">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">Hours Taught</p>
            <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-300 font-mono">{employee.teacherStats?.totalHours || 0}<span className="text-lg">h</span></p>
          </div>
          <div className="card border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-950/30 dark:to-slate-900/60">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Total Views</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-300 font-mono">
              {employee.teacherStats?.totalViews >= 1000
                ? `${(employee.teacherStats.totalViews / 1000).toFixed(1)}K`
                : (employee.teacherStats?.totalViews || 0)}
            </p>
          </div>
          <div className="card border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-transparent dark:from-fuchsia-950/30 dark:to-slate-900/60">
            <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 mb-1">Current Series</p>
            <p className="text-lg font-extrabold text-fuchsia-600 dark:text-fuchsia-300 font-heading leading-tight">{employee.teacherStats?.currentSeries || '—'}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Assigned</p>
            <p className="text-3xl font-extrabold font-mono" style={{ color: 'var(--text-heading)' }}>{tasks.length}</p>
          </div>
          <div className="card border-emerald-500/20">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Completed</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-300 font-mono">{completedTasks}</p>
          </div>
          <div className="card border-cyan-500/20">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">Total Hours Logged</p>
            <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-300 font-mono">{totalHours.toFixed(1)}<span className="text-lg">h</span></p>
          </div>
        </div>
      )}

      {/* Recent YouTube videos — faculty only */}
      {isFaculty(employee.department) && ytVideos.length > 0 && (
        <div className="card">
          <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>Recent Live Streams</h2>
          <div className="space-y-2">
            {ytVideos.map((v) => (
              <a key={v.videoId} href={v.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl transition-all group" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
              >
                <img src={v.thumbnail} alt={v.title} className="w-20 h-12 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold group-hover:text-violet-500 dark:group-hover:text-violet-300 transition-colors line-clamp-1" style={{ color: 'var(--text-heading)' }}>{v.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                    {v.series && <span className="text-violet-600 dark:text-violet-400">{v.series}</span>}
                    {v.duration && <span>{v.duration}</span>}
                    {v.views > 0 && <span>{v.views >= 1000 ? `${(v.views/1000).toFixed(1)}K` : v.views} views</span>}
                    <span>{new Date(v.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>Assigned Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'var(--text-faint)' }}>No tasks assigned to this employee.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{task.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
        <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>Activity &amp; Time Logs</h2>
        {timeLogs.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'var(--text-faint)' }}>No time logs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {timeLogs.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{log.task?.title || 'Task'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {log.note || 'Work session'} · {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm px-3 py-1 rounded-xl inline-block" style={{ color: 'var(--text-heading)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
                    {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                  </span>
                  <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mt-1">{log.type}</p>
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
