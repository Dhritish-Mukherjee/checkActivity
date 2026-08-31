import { useEffect, useState } from 'react';
import { taskAPI, authAPI } from '../../services';

const STATUS_BADGES = {
  todo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  in_progress: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

const PRIORITY_BADGES = {
  low: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
  medium: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold',
};

const inputCls = 'px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all';

const ManageTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', assignedTo: '' });

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    try {
      const [tasksRes, empRes] = await Promise.all([
        taskAPI.getAllTasks(filters),
        authAPI.getEmployees(),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setEmployees(empRes.data.employees || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.assignedTo.length === 0) { alert('Please select at least one assignee'); return; }
    try {
      if (editingTask) {
        await taskAPI.updateTask(editingTask._id, form);
      } else {
        await taskAPI.createTask(form);
      }
      setShowModal(false);
      setEditingTask(null);
      setForm({ title: '', description: '', assignedTo: [], priority: 'medium', dueDate: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert(error.response?.data?.message || 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo.map((u) => u._id),
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskAPI.deleteTask(id);
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
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

  const selectStyle = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-base)',
    color: 'var(--text-base)',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading" style={{ color: 'var(--text-heading)' }}>Manage System Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Admin control panel for task assignment and status oversight</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setForm({ title: '', description: '', assignedTo: [], priority: 'medium', dueDate: '' });
            setShowModal(true);
          }}
          className="btn-primary shrink-0"
        >
          <span className="font-mono text-indigo-200">[+]</span>
          <span>Create Task</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card !p-3 flex flex-wrap items-center gap-3">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={`${inputCls} w-auto`} style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className={`${inputCls} w-auto`} style={selectStyle}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select value={filters.assignedTo} onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })} className={`${inputCls} w-auto`} style={selectStyle}>
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>{emp.name}</option>
          ))}
        </select>

        {(filters.status || filters.priority || filters.assignedTo) && (
          <button onClick={() => setFilters({ status: '', priority: '', assignedTo: '' })} className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-400 ml-auto px-3 py-1.5 rounded-lg bg-rose-500/10">
            Clear Filters
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-faint)' }}>No tasks matched your filter criteria.</p>
        ) : (
          <div className="flex flex-col" style={{ divide: 'var(--border-subtle)' }}>
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs uppercase tracking-wider font-bold" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-base)' }}>
              <div className="col-span-4">Title &amp; Description</div>
              <div className="col-span-3">Assignees</div>
              <div className="col-span-2">Status &amp; Priority</div>
              <div className="col-span-1">Due Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {tasks.map((task) => (
              <div
                key={task._id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-y-3 lg:gap-4 px-5 py-5 lg:px-6 lg:py-4 transition-colors lg:items-center"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-row-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="col-span-4">
                  <div className="font-bold text-base lg:text-sm leading-tight" style={{ color: 'var(--text-heading)' }}>{task.title}</div>
                  {task.description && (
                    <div className="text-xs mt-1 line-clamp-2 lg:line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      {task.description}
                    </div>
                  )}
                  <div className="lg:hidden mt-3 flex flex-wrap gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGES[task.status]}`}>{task.status.replace('_', ' ')}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_BADGES[task.priority]}`}>{task.priority}</span>
                  </div>
                </div>

                <div className="col-span-3 text-xs flex flex-col justify-center" style={{ color: 'var(--text-base)' }}>
                  <span className="lg:hidden text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text-faint)' }}>Assignees</span>
                  <div className="truncate">{task.assignedTo?.map((u) => u.name).join(', ') || 'None'}</div>
                </div>

                <div className="col-span-2 hidden lg:flex flex-col items-start gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGES[task.status]}`}>{task.status.replace('_', ' ')}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_BADGES[task.priority]}`}>{task.priority}</span>
                </div>

                <div className="col-span-1 text-xs font-mono flex flex-col justify-center" style={{ color: 'var(--text-muted)' }}>
                  <span className="lg:hidden text-[10px] uppercase font-bold mb-1 font-sans" style={{ color: 'var(--text-faint)' }}>Due Date</span>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </div>

                <div className="col-span-2 flex items-center justify-start lg:justify-end gap-2 mt-2 lg:mt-0 pt-4 lg:pt-0" style={{ borderTop: '1px solid var(--border-subtle)' }} onMouseEnter={e => e.currentTarget.style.borderTopColor = 'transparent'}>
                  <button onClick={() => handleEdit(task)} className="px-4 py-2 lg:px-3 lg:py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors flex-1 lg:flex-none text-center border border-indigo-500/20">Edit</button>
                  <button onClick={() => handleDelete(task._id)} className="px-4 py-2 lg:px-3 lg:py-1.5 text-xs font-semibold text-rose-500 dark:text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors flex-1 lg:flex-none text-center border border-rose-500/20">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--bg-overlay)' }}>
          <div className="rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-7 shadow-2xl relative" style={{ backgroundColor: 'var(--bg-modal)', border: '1px solid var(--border-base)' }}>
            <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--border-base)' }}>
              <h2 className="text-xl font-bold font-heading" style={{ color: 'var(--text-heading)' }}>
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Title *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`w-full ${inputCls}`} style={selectStyle} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`w-full ${inputCls}`} style={selectStyle} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Assignees *</label>
                <div className="rounded-xl p-3 max-h-40 overflow-y-auto space-y-1" style={{ border: '1px solid var(--border-base)', backgroundColor: 'var(--bg-input)' }}>
                  {employees.map((emp) => (
                    <label key={emp._id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-sm" style={{ color: 'var(--text-base)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <input type="checkbox" checked={form.assignedTo.includes(emp._id)} onChange={() => handleAssigneeToggle(emp._id)} className="w-4 h-4 rounded text-indigo-600" />
                      <span>{emp.name} ({emp.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={`w-full ${inputCls}`} style={selectStyle}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={`w-full ${inputCls}`} style={selectStyle} />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4" style={{ borderTop: '1px solid var(--border-base)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-primary text-sm py-2 px-5">{editingTask ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTasks;
