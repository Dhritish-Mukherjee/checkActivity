import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../../services';

const STATUS_BADGES = {
  todo: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const PRIORITY_BADGES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
};

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>

      <div className="card flex gap-3">
        {[
          { value: '', label: 'All' },
          { value: 'todo', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
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
                  {task.status.replace('_', ' ')}
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
    </div>
  );
};

export default MyTasks;