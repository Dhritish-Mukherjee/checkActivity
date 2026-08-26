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
  const [statusData, setStatusData] = useState({ todo: 0, in_progress: 0, completed: 0 });
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, hoursRes, statusRes, trendRes] = await Promise.all([
        dashboardAPI.getStatistics(),
        dashboardAPI.getHoursPerEmployee(),
        dashboardAPI.getTaskStatusBreakdown(),
        dashboardAPI.getTimeTrend({ days: 7 }),
      ]);

      setStats(statsRes.data);
      setHoursData(hoursRes.data.employees || []);
      setStatusData(statusRes.data.status || { todo: 0, in_progress: 0, completed: 0 });
      setTrendData(trendRes.data.trend || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hoursChartData = {
    labels: hoursData.map((e) => e.name),
    datasets: [
      {
        label: 'Hours Logged',
        data: hoursData.map((e) => e.totalHours?.toFixed(1) || 0),
        backgroundColor: '#1a3a5c',
        borderRadius: 8,
      },
    ],
  };

  const statusChartData = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [statusData.todo, statusData.in_progress, statusData.completed],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  const trendChartData = {
    labels: trendData.map((d) => d.date?.slice(5) || ''),
    datasets: [
      {
        label: 'Hours',
        data: trendData.map((d) => parseFloat(d.hours) || 0),
        borderColor: '#1a3a5c',
        backgroundColor: 'rgba(26, 58, 92, 0.1)',
        fill: true,
        tension: 0.4,
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
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-primary">{stats?.totalTasks || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">Completed This Week</p>
          <p className="text-3xl font-bold text-green-600">{stats?.tasksCompletedThisWeek || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">Total Hours Logged</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalHours || 0}h</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">Active Employees</p>
          <p className="text-3xl font-bold text-purple-600">{stats?.activeEmployees || 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours per Employee */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Hours per Employee</h2>
          <div className="h-64">
            {hoursData.length > 0 ? (
              <Bar data={hoursChartData} options={chartOptions} />
            ) : (
              <p className="text-slate-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Task Status</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Time Trend */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Time Logged (Last 7 Days)</h2>
        <div className="h-64">
          {trendData.length > 0 ? (
            <Line data={trendChartData} options={chartOptions} />
          ) : (
            <p className="text-slate-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;