import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, authAPI } from '../../services';

const STATUS_BADGES = {
  todo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  in_progress: 'bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const STATUS_LABELS = {
  todo: 'To Do',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const PRIORITY_BADGES = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold',
};

const MyTasks = () => {
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

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [filter]);

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
    if (form.assignedTo.length === 0) {
      alert('Please select at least one assignee');
      return;
    }
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-heading">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage, track, and complete your assigned work items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <span className="font-mono text-indigo-200">▤</span>
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="card !p-2 flex flex-wrap gap-1.5 bg-slate-900/60 backdrop-blur-xl border border-white/10">
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
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
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
        <div className="card text-center py-16 border-dashed border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-sweep" />
          <div className="text-4xl mb-3 text-slate-600 font-mono">/0</div>
          <h3 className="text-lg font-bold text-white font-heading relative z-10">No tasks found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto relative z-10">
            You don't have any tasks matching this status filter right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tasks.map((task) => (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className="card card-hover flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors line-clamp-1 font-heading">
                    {task.title}
                  </h3>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      STATUS_BADGES[task.status]
                    }`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>

                {task.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                    PRIORITY_BADGES[task.priority]
                  }`}
                >
                  {task.priority} Priority
                </span>

                {task.dueDate ? (
                  <span className="flex items-center gap-1 text-slate-400 font-medium font-mono text-[11px]">
                    {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-slate-600">No deadline</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-7 shadow-2xl shadow-indigo-950/80 relative">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <span className="text-indigo-400">///</span> Assign a New Task
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  placeholder="e.g. Implement user activity analytics chart"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  placeholder="Detail requirements and scope..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Assign To Team Members *
                </label>
                <div className="border border-white/10 rounded-xl p-3 max-h-44 overflow-y-auto space-y-1 bg-slate-950/50">
                  {users.map((u) => (
                    <label
                      key={u._id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        form.assignedTo.includes(u._id)
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedTo.includes(u._id)}
                        onChange={() => handleAssigneeToggle(u._id)}
                        className="w-4 h-4 rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                      />
                      <div className="text-sm font-medium">
                        {u.name} <span className="text-xs text-slate-500">({u.email})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="low" className="bg-slate-900 text-white">Low Priority</option>
                    <option value="medium" className="bg-slate-900 text-white">Medium Priority</option>
                    <option value="high" className="bg-slate-900 text-white">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;