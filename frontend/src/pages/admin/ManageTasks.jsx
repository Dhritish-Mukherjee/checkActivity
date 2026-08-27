import { useEffect, useState } from 'react';
import { taskAPI, authAPI } from '../../services';

const STATUS_BADGES = {
  todo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  in_progress: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const PRIORITY_BADGES = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold',
};

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

  useEffect(() => {
    fetchData();
  }, [filters]);

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
    if (form.assignedTo.length === 0) {
      alert('Please select at least one assignee');
      return;
    }
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-heading">Manage System Tasks</h1>
          <p className="text-slate-400 text-sm mt-0.5">Admin control panel for task assignment and status oversight</p>
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
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="" className="bg-slate-900">All Statuses</option>
          <option value="todo" className="bg-slate-900">To Do</option>
          <option value="accepted" className="bg-slate-900">Accepted</option>
          <option value="in_progress" className="bg-slate-900">In Progress</option>
          <option value="completed" className="bg-slate-900">Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="" className="bg-slate-900">All Priorities</option>
          <option value="low" className="bg-slate-900">Low</option>
          <option value="medium" className="bg-slate-900">Medium</option>
          <option value="high" className="bg-slate-900">High</option>
        </select>

        <select
          value={filters.assignedTo}
          onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          className="px-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="" className="bg-slate-900">All Employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id} className="bg-slate-900">
              {emp.name}
            </option>
          ))}
        </select>

        {(filters.status || filters.priority || filters.assignedTo) && (
          <button
            onClick={() => setFilters({ status: '', priority: '', assignedTo: '' })}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 ml-auto px-3 py-1.5 rounded-lg bg-rose-500/10"
          >
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
          <p className="text-center py-12 text-slate-500 text-sm">No tasks matched your filter criteria.</p>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-white/10">
              <div className="col-span-4">Title &amp; Description</div>
              <div className="col-span-3">Assignees</div>
              <div className="col-span-2">Status &amp; Priority</div>
              <div className="col-span-1">Due Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Task Rows */}
            {tasks.map((task) => (
              <div key={task._id} className="grid grid-cols-1 lg:grid-cols-12 gap-y-3 lg:gap-4 px-5 py-5 lg:px-6 lg:py-4 hover:bg-slate-900/40 transition-colors lg:items-center">
                <div className="col-span-4">
                  <div className="font-bold text-white text-base lg:text-sm leading-tight">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2 lg:line-clamp-1">
                      {task.description}
                    </div>
                  )}
                  <div className="lg:hidden mt-3 flex flex-wrap gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGES[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_BADGES[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="col-span-3 text-slate-300 text-xs flex flex-col justify-center">
                  <span className="lg:hidden text-[10px] uppercase text-slate-500 font-bold mb-1">Assignees</span>
                  <div className="truncate">{task.assignedTo?.map((u) => u.name).join(', ') || 'None'}</div>
                </div>

                <div className="col-span-2 hidden lg:flex flex-col items-start gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGES[task.status]}`}>
                     {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_BADGES[task.priority]}`}>
                     {task.priority}
                  </span>
                </div>

                <div className="col-span-1 text-xs text-slate-400 font-mono flex flex-col justify-center">
                  <span className="lg:hidden text-[10px] uppercase text-slate-500 font-bold mb-1 font-sans">Due Date</span>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </div>

                <div className="col-span-2 flex items-center justify-start lg:justify-end gap-2 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-none border-white/5">
                  <button
                    onClick={() => handleEdit(task)}
                    className="px-4 py-2 lg:px-3 lg:py-1.5 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors flex-1 lg:flex-none text-center border border-indigo-500/20"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="px-4 py-2 lg:px-3 lg:py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors flex-1 lg:flex-none text-center border border-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-7 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-heading">
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Assignees *
                </label>
                <div className="border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 bg-slate-950/50">
                  {employees.map((emp) => (
                    <label key={emp._id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 text-slate-300 text-sm">
                      <input
                        type="checkbox"
                        checked={form.assignedTo.includes(emp._id)}
                        onChange={() => handleAssigneeToggle(emp._id)}
                        className="w-4 h-4 rounded border-white/20 bg-slate-900 text-indigo-600"
                      />
                      <span>{emp.name} ({emp.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm"
                  >
                    <option value="low" className="bg-slate-900">Low</option>
                    <option value="medium" className="bg-slate-900">Medium</option>
                    <option value="high" className="bg-slate-900">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm py-2 px-5">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTasks;