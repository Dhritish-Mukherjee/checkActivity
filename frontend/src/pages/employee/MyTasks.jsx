import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, authAPI } from '../../services';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGES = {
  todo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  in_progress: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 animate-pulse',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

const STATUS_LABELS = {
  todo: 'To Do',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const PRIORITY_BADGES = {
  low: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
  medium: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold',
};

const inputCls = 'px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all';

const MyTasks = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => { fetchTasks(); fetchUsers(); }, [filter]);

  const fetchUsers = async () => {
    try {
      const res = await authAPI.getAllUsers();
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await taskAPI.getMyTasks(params);
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.assignedTo.length === 0) { alert('Please select at least one assignee'); return; }
    try {
      await taskAPI.createTask(form);
      setShowModal(false);
      setForm({ title: '', description: '', assignedTo: [], priority: 'medium', dueDate: '' });
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleAssigneeToggle = (id) => {
    setForm((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(id)
        ? prev.assignedTo.filter((u) => u !== id)
        : [...prev.assignedTo, id],
    }));
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-base)',
    color: 'var(--text-base)',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading" style={{ color: 'var(--text-heading)' }}>My Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage, track, and complete your assigned work items</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <span className="font-mono text-indigo-200">▤</span>
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="card !p-2 flex flex-wrap gap-1.5 backdrop-blur-xl">
        {[
          { value: '', label: '[ All Tasks ]' },
          { value: 'todo', label: '[] To Do' },
          { value: 'accepted', label: '[x] Accepted' },
          { value: 'in_progress', label: '/// In Progress' },
          { value: 'completed', label: '=== Completed' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
              filter === tab.value
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border border-white/10'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={filter !== tab.value ? { color: 'var(--text-muted)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16 border-dashed relative overflow-hidden" style={{ borderColor: 'var(--border-base)' }}>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-sweep" />
          <div className="text-4xl mb-3 font-mono font-bold" style={{ color: 'var(--text-faint)' }}>/0</div>
          <h3 className="text-lg font-bold font-heading relative z-10" style={{ color: 'var(--text-heading)' }}>No tasks found</h3>
          <p className="text-sm mt-1 max-w-sm mx-auto relative z-10" style={{ color: 'var(--text-muted)' }}>
            You don't have any tasks matching this status filter right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tasks.map((task) => (
            <Link
              key={task._id}
              to={isAdmin ? `/my-tasks/${task._id}` : `/tasks/${task._id}`}
              className="card card-hover flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-lg group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors line-clamp-1 font-heading" style={{ color: 'var(--text-heading)' }}>
                    {task.title}
                  </h3>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${STATUS_BADGES[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-3" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${PRIORITY_BADGES[task.priority]}`}>
                  {task.priority} Priority
                </span>
                {task.dueDate ? (
                  <span className="font-medium font-mono text-[11px]">
                    {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-faint)' }}>No deadline</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--bg-overlay)' }}>
          <div className="rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-7 shadow-2xl relative" style={{ backgroundColor: 'var(--bg-modal)', border: '1px solid var(--border-base)' }}>
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-base)' }}>
              <h2 className="text-xl font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                <span className="text-indigo-500 dark:text-indigo-400">///</span> Assign a New Task
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Task Title *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`w-full ${inputCls}`} style={inputStyle} placeholder="e.g. Implement user activity analytics chart" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`w-full ${inputCls}`} style={inputStyle} placeholder="Detail requirements and scope..." />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Assign To Team Members *</label>
                <div className="rounded-xl p-3 max-h-44 overflow-y-auto space-y-1" style={{ border: '1px solid var(--border-base)', backgroundColor: 'var(--bg-input)' }}>
                  {users.map((u) => (
                    <label key={u._id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${form.assignedTo.includes(u._id) ? 'bg-indigo-600/20 border border-indigo-500/40' : ''}`}
                      style={{ color: form.assignedTo.includes(u._id) ? 'var(--text-heading)' : 'var(--text-base)' }}
                    >
                      <input type="checkbox" checked={form.assignedTo.includes(u._id)} onChange={() => handleAssigneeToggle(u._id)} className="w-4 h-4 rounded text-indigo-600" />
                      <div className="text-sm font-medium">
                        {u.name} <span className="text-xs" style={{ color: 'var(--text-faint)' }}>({u.email})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={`w-full ${inputCls}`} style={inputStyle}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={`w-full ${inputCls}`} style={inputStyle} />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4" style={{ borderTop: '1px solid var(--border-base)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
