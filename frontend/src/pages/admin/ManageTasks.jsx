import { useEffect, useState } from 'react';
import { taskAPI, authAPI } from '../../services';

const STATUS_BADGES = {
  todo: 'bg-slate-100 text-slate-600',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
};

const PRIORITY_BADGES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
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
      setTasks(tasksRes.data.tasks);
      setEmployees(empRes.data.employees);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    if (!confirm('Delete this task?')) return;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Manage Tasks</h1>
        <button
          onClick={() => {
            setEditingTask(null);
            setForm({ title: '', description: '', assignedTo: [], priority: 'medium', dueDate: '' });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-md"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={filters.assignedTo}
          onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-md"
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center py-8 text-slate-500">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center py-8 text-slate-500">No tasks found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-2">Title</th>
                <th className="py-3 px-2">Assignees</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">Due Date</th>
                <th className="py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-slate-800">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-slate-500 truncate max-w-md">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {task.assignedTo.map((u) => u.name).join(', ')}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_BADGES[task.status]
                      }`}
                    >
                      {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        PRIORITY_BADGES[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-600">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(task)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingTask ? 'Edit Task' : 'Create Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assignees *
                </label>
                <div className="border border-slate-300 rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                  {employees.map((emp) => (
                    <label key={emp._id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={form.assignedTo.includes(emp._id)}
                        onChange={() => handleAssigneeToggle(emp._id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {emp.name} ({emp.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Update' : 'Create'}
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