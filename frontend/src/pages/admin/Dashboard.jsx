import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services';
import YoutubeStreams from './YoutubeStreams';
import CatLoader from '../../components/CatLoader';
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
  const [employeeTrendData, setEmployeeTrendData] = useState({ trend: [], users: [] });
  const [quizLogs, setQuizLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, hoursRes, statusRes, trendRes, empTrendRes, quizLogsRes] = await Promise.all([
        dashboardAPI.getStatistics(),
        dashboardAPI.getHoursPerEmployee(),
        dashboardAPI.getTaskStatusBreakdown(),
        dashboardAPI.getTimeTrend({ days: 7 }),
        dashboardAPI.getEmployeeTimeTrend({ days: 7 }),
        dashboardAPI.getQuizLogs(),
      ]);

      setStats(statsRes.data);
      setHoursData(hoursRes.data.employees || []);
      setStatusData(statusRes.data.status || { todo: 0, accepted: 0, in_progress: 0, completed: 0 });
      setTrendData(trendRes.data.trend || []);
      setEmployeeTrendData({
        trend: empTrendRes.data.trend || [],
        users: empTrendRes.data.users || [],
      });
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
        <CatLoader text="Loading Dashboard..." />
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
        label: 'Total Hours Logged',
        data: trendData.map((d) => parseFloat(d.hours) || 0),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#c084fc',
      },
    ],
  };

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];
  const employeeTrendChartData = {
    labels: employeeTrendData.trend.map((d) => d.date?.slice(5) || ''),
    datasets: employeeTrendData.users.map((user, idx) => ({
      label: user,
      data: employeeTrendData.trend.map((d) => d[user] || 0),
      backgroundColor: colors[idx % colors.length],
      borderRadius: 4,
    })),
  };

  const stackedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: 'var(--text-muted)', font: { family: 'Plus Jakarta Sans', size: 12 } }
      },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: 'var(--text-faint)' },
        grid: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: 'var(--text-faint)' },
        grid: { color: 'var(--border-subtle)' },
      },
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: 'var(--text-faint)' },
        grid: { color: 'var(--border-subtle)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'var(--text-faint)' },
        grid: { color: 'var(--border-subtle)' },
      },
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-heading" style={{ color: 'var(--text-heading)' }}>Analytics Command Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time team productivity, time logs, and task distribution</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="card border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-500/0 dark:from-indigo-950/30 dark:to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Total System Tasks</p>
          <p className="text-4xl font-extrabold tracking-tight font-mono" style={{ color: 'var(--text-heading)' }}>{stats?.totalTasks || 0}</p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>Active &amp; completed work items</p>
        </div>

        <div className="card border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 dark:from-emerald-950/30 dark:to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Completed (7 Days)</p>
          <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-300 tracking-tight font-mono">{stats?.tasksCompletedThisWeek || 0}</p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>Closed out successfully</p>
        </div>

        <div className="card border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-500/0 dark:from-cyan-950/30 dark:to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">Total Hours Logged</p>
          <p className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-300 tracking-tight font-mono">{stats?.totalHours || 0}<span className="text-xl">h</span></p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>Across all team logs</p>
        </div>

        <div className="card border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-500/0 dark:from-purple-950/30 dark:to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Active Team Members</p>
          <p className="text-4xl font-extrabold text-purple-600 dark:text-purple-300 tracking-tight font-mono">{stats?.activeEmployees || 0}</p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>Registered employees</p>
        </div>

        <div className="card border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/0 dark:from-fuchsia-950/30 dark:to-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 mb-1">Quizzes Generated</p>
          <p className="text-4xl font-extrabold text-fuchsia-600 dark:text-fuchsia-300 tracking-tight font-mono">{stats?.totalQuizzesGenerated || 0}</p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>By Quiz Engine</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>Hours Logged per Employee</h2>
          <div className="h-64">
            {hoursData.length > 0 ? (
              <Bar data={hoursChartData} options={chartOptions} />
            ) : (
              <p className="text-center py-16" style={{ color: 'var(--text-faint)' }}>No employee activity recorded</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>Task Status Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: 'var(--text-muted)', font: { family: 'Plus Jakarta Sans', size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Trend Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>7-Day Time Activity Trend (Total)</h2>
          <div className="h-64">
            {trendData.length > 0 ? (
              <Line data={trendChartData} options={chartOptions} />
            ) : (
              <p className="text-center py-16" style={{ color: 'var(--text-faint)' }}>No trend data found</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>7-Day Activity by Employee</h2>
          <div className="h-64">
            {employeeTrendData.trend.length > 0 ? (
              <Bar data={employeeTrendChartData} options={stackedChartOptions} />
            ) : (
              <p className="text-center py-16" style={{ color: 'var(--text-faint)' }}>No employee trend data found</p>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Generation Logs */}
      <div className="card">
        <h2 className="text-base font-bold font-heading mb-4 pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>Recent Quiz Engine Activity</h2>
        {quizLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ color: 'var(--text-base)' }}>
              <thead className="text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th className="p-3 pl-4 rounded-tl-lg">Generated By</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Questions</th>
                  <th className="p-3">Template</th>
                  <th className="p-3 rounded-tr-lg text-right pr-4">Time</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {quizLogs.map((log) => (
                  <tr key={log._id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-row-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        {log.user?.profilePicture ? (
                          <img src={log.user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover border" style={{ borderColor: 'var(--border-base)' }} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                            {log.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>{log.user?.name || 'Unknown'}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{log.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-300">{log.outputFileName}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-base)' }}>
                        {log.questionCount} slides
                      </span>
                    </td>
                    <td className="p-3 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{log.templateUsed}</td>
                    <td className="p-3 pr-4 text-right text-xs whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-faint)' }}>No quizzes generated yet.</p>
        )}
      </div>

      {/* YouTube Live Streams Section */}
      <div className="pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <YoutubeStreams />
      </div>
    </div>
  );
};

export default AdminDashboard;
