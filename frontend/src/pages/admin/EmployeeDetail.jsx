import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskAPI, timeLogAPI, authAPI } from '../../services';

const STATUS_BADGES = {
  todo: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
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
      setTasks(tasksRes.data.tasks);
      setTimeLogs(logsRes.data.timeLogs);
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center py-8 text-slate-500">Loading...</p>;
  }

  if (!employee) {
    return <p className="text-center py-8 text-slate-500">Employee not found</p>;
  }

  const totalHours = timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <Link to="/employees" className="text-blue-600 hover:underline text-sm">
        ← Back to Employees
      </Link>

      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
          {employee.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{employee.name}</h1>
          <p className="text-slate-500">{employee.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-slate-800">{tasks.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">Hours Logged</p>
          <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No tasks assigned</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-800">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    STATUS_BADGES[task.status]
                  }`}
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Time Logs</h2>
        {timeLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No time logs</p>
        ) : (
          <div className="space-y-2">
            {timeLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-800">{log.task?.title}</p>
                  <p className="text-xs text-slate-500">
                    {log.note || 'No note'} · {new Date(log.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">
                    {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                  </p>
                  <p className="text-xs text-slate-500 uppercase">{log.type}</p>
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