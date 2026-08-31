import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import AdminDashboard from '../pages/admin/Dashboard';
import ManageTasks from '../pages/admin/ManageTasks';
import EmployeesPage from '../pages/admin/Employees';
import EmployeeDetail from '../pages/admin/EmployeeDetail';
import MyTasks from '../pages/employee/MyTasks';
import MyTimeLogs from '../pages/employee/MyTimeLogs';
import TaskDetail from '../pages/employee/TaskDetail';
import Settings from '../pages/Settings';
import QuizGenerator from '../pages/admin/QuizGenerator';
import GlobalTimerBanner from './GlobalTimerBanner';

const Layout = () => {
  const { user, logout, isAdmin, isTeamMember } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen [background-color:var(--bg-base)] [color:var(--text-base)] relative overflow-x-hidden flex transition-colors duration-200">
      {/* Background Ambient Glow Orbs — subtler in light mode */}
      <div className="fixed top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none animate-float" />
      <div className="fixed bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="fixed top-[40%] right-[30%] w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      {/* Sidebar */}
      <Sidebar
        user={user}
        logout={logout}
        isAdmin={isAdmin}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-w-0 relative z-10">
        {/* Active Timer Banner for Employees */}
        {isTeamMember && <GlobalTimerBanner />}

        {/* Top Header */}
        <header
          className="sticky top-0 z-20 backdrop-blur-xl border-b px-4 py-3 md:px-8 md:py-4"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderColor: 'var(--border-base)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-base md:text-lg font-bold tracking-tight flex items-center gap-2 font-heading" style={{ color: 'var(--text-heading)' }}>
                  <span className="text-gradient">Strivers</span>{' '}
                  <span className="hidden sm:inline">Platform</span>
                </h1>
                <p className="text-[10px] md:text-xs truncate max-w-[150px] sm:max-w-none" style={{ color: 'var(--text-faint)' }}>
                  {isAdmin ? 'Administrator Operations Command' : 'Personal Activity & Time Hub'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Live Sync pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live Sync Active
              </div>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-rose-500/10 group"
              >
                <span>Logout</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">⇲</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/tasks" element={<ManageTasks />} />
                {isTeamMember && (
                  <>
                    <Route path="/my-tasks" element={<MyTasks />} />
                    <Route path="/my-tasks/:id" element={<TaskDetail />} />
                    <Route path="/time-logs" element={<MyTimeLogs />} />
                  </>
                )}
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/:id" element={<EmployeeDetail />} />
                <Route path="/quiz-generator" element={<QuizGenerator />} />
                <Route path="/settings" element={<Settings />} />
              </>
            ) : (
              <>
                <Route path="/" element={<MyTasks />} />
                <Route path="/tasks" element={<MyTasks />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/time-logs" element={<MyTimeLogs />} />
                <Route path="/quiz-generator" element={<QuizGenerator />} />
                <Route path="/settings" element={<Settings />} />
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
