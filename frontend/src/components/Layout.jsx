import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import AdminDashboard from '../pages/admin/Dashboard';
import ManageTasks from '../pages/admin/ManageTasks';
import EmployeesPage from '../pages/admin/Employees';
import EmployeeDetail from '../pages/admin/EmployeeDetail';
import MyTasks from '../pages/employee/MyTasks';
import MyTimeLogs from '../pages/employee/MyTimeLogs';
import TaskDetail from '../pages/employee/TaskDetail';
import GlobalTimerBanner from './GlobalTimerBanner';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar user={user} logout={logout} isAdmin={isAdmin} />

      <main className="flex-1 ml-64">
        {!isAdmin && <GlobalTimerBanner />}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Strivers Task</h1>
              <p className="text-sm text-slate-500">Internal Task Management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/tasks" element={<ManageTasks />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/:id" element={<EmployeeDetail />} />
              </>
            ) : (
              <>
                <Route path="/" element={<MyTasks />} />
                <Route path="/tasks" element={<MyTasks />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/time-logs" element={<MyTimeLogs />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Layout;