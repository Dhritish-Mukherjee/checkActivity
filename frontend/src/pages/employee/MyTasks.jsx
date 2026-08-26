import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, authAPI } from '../../services';

const STATUS_BADGES = {
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

const PRIORITY_BADGES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
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
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await taskAPI.getMyTasks(params);
      setTasks(res.data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Assign Task
        </button>
      </div>

      <div className="card flex flex-wrap gap-2">
        {[
          { value: '', label: 'All' },
          { value: 'todo', label: '📥 To Do' },
          { value: 'accepted', label: '✅ Accepted' },
          { value: 'in_progress', label: '▶ In Progress' },
          { value: 'completed', label: '🏁 Completed' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-8 text-slate-500">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No tasks assigned to you yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-800 flex-1">{task.title}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                    STATUS_BADGES[task.status]
                  }`}
                >
                  {STATUS_LABELS[task.status]}
                </span>
              </div>

              {task.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    PRIORITY_BADGES[task.priority]
                  }`}
                >
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Assign a Task</h2>
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
                  {users.map((user) => (
                    <label key={user._id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={form.assignedTo.includes(user._id)}
                        onChange={() => handleAssigneeToggle(user._id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {user.name} ({user.email})
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