import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [hoursData, setHoursData] = useState([]);
  const [statusData, setStatusData] = useState({ todo: 0, accepted: 0, in_progress: 0, completed: 0 });
  const [trendData, setTrendData] = useState([]);
  const [quizLogs, setQuizLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, hoursRes, statusRes, trendRes, quizLogsRes] = await Promise.all([
        dashboardAPI.getStatistics(),
        dashboardAPI.getHoursPerEmployee(),
        dashboardAPI.getTaskStatusBreakdown(),
        dashboardAPI.getTimeTrend({ days: 7 }),
        dashboardAPI.getQuizLogs(),
      ]);

      setStats(statsRes.data);
      setHoursData(hoursRes.data.employees || []);
      setStatusData(statusRes.data.status || { todo: 0, accepted: 0, in_progress: 0, completed: 0 });
      setTrendData(trendRes.data.trend || []);
      setQuizLogs(quizLogsRes.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hoursChartData = {
    labels: hoursData.map((e) => e.name),
    datasets: [
      {
        label: 'Hours Logged',
        data: hoursData.map((e) => e.totalHours?.toFixed(1) || 0),
        backgroundColor: '#6366f1',
        borderRadius: 8,
      },
    ],
  };

  const statusChartData = {
    labels: ['To Do', 'Accepted', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [statusData.todo || 0, statusData.accepted || 0, statusData.in_progress || 0, statusData.completed || 0],
        backgroundColor: ['#f59e0b', '#06b6d4', '#8b5cf6', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  const trendChartData = {
    labels: trendData.map((d) => d.date?.slice(5) || ''),
    datasets: [
      {
        label: 'Hours Logged',
        data: trendData.map((d) => parseFloat(d.hours) || 0),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#c084fc',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-heading">Analytics Command Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time team productivity, time logs, and task distribution</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="card border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">Total System Tasks</p>
          <p className="text-4xl font-extrabold text-white tracking-tight font-mono">{stats?.totalTasks || 0}</p>
          <p className="text-[11px] text-slate-500 mt-2">Active &amp; completed work items</p>
        </div>

        <div className="card border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Completed (7 Days)</p>
          <p className="text-4xl font-extrabold text-emerald-300 tracking-tight font-mono">{stats?.tasksCompletedThisWeek || 0}</p>
          <p className="text-[11px] text-slate-500 mt-2">Closed out successfully</p>
        </div>

        <div className="card border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">Total Hours Logged</p>
          <p className="text-4xl font-extrabold text-cyan-300 tracking-tight font-mono">{stats?.totalHours || 0}<span className="text-xl">h</span></p>
          <p className="text-[11px] text-slate-500 mt-2">Across all team logs</p>
        </div>

        <div className="card border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">Active Team Members</p>
          <p className="text-4xl font-extrabold text-purple-300 tracking-tight font-mono">{stats?.activeEmployees || 0}</p>
          <p className="text-[11px] text-slate-500 mt-2">Registered employees</p>
        </div>

        <div className="card border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/30 to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-400 mb-1">Quizzes Generated</p>
          <p className="text-4xl font-extrabold text-fuchsia-300 tracking-tight font-mono">{stats?.totalQuizzesGenerated || 0}</p>
          <p className="text-[11px] text-slate-500 mt-2">By Quiz Engine</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours per Employee Bar */}
        <div className="card">
          <h2 className="text-base font-bold text-white font-heading mb-4 border-b border-white/10 pb-3">Hours Logged per Employee</h2>
          <div className="h-64">
            {hoursData.length > 0 ? (
              <Bar data={hoursChartData} options={chartOptions} />
            ) : (
              <p className="text-slate-500 text-center py-16">No employee activity recorded</p>
            )}
          </div>
        </div>

        {/* Task Status Doughnut */}
        <div className="card">
          <h2 className="text-base font-bold text-white font-heading mb-4 border-b border-white/10 pb-3">Task Status Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="card">
        <h2 className="text-base font-bold text-white font-heading mb-4 border-b border-white/10 pb-3">7-Day Time Activity Trend</h2>
        <div className="h-64">
          {trendData.length > 0 ? (
            <Line data={trendChartData} options={chartOptions} />
          ) : (
            <p className="text-slate-500 text-center py-16">No trend data found</p>
          )}
        </div>
      </div>

      {/* Quiz Generation Logs */}
      <div className="card">
        <h2 className="text-base font-bold text-white font-heading mb-4 border-b border-white/10 pb-3">Recent Quiz Engine Activity</h2>
        {quizLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-3 pl-4 rounded-tl-lg">Generated By</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Questions</th>
                  <th className="p-3">Template</th>
                  <th className="p-3 rounded-tr-lg text-right pr-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {quizLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        {log.user?.profilePicture ? (
                          <img src={log.user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                            {log.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{log.user?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-500">{log.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-indigo-300">{log.outputFileName}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs font-semibold">
                        {log.questionCount} slides
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-400 capitalize">{log.templateUsed}</td>
                    <td className="p-3 pr-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No quizzes generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;