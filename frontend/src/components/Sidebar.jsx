import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Sidebar = ({ user, logout, isAdmin, isOpen, onClose }) => {
  const adminLinks = [
    { to: '/', icon: '◈', label: 'Dashboard' },
    { to: '/tasks', icon: '▣', label: 'All Tasks' },
    ...(user?.isTeamMember ? [
      { to: '/my-tasks', icon: '▤', label: 'My Tasks' },
      { to: '/time-logs', icon: '◎', label: 'Time Logs' }
    ] : []),
    { to: '/employees', icon: '◩', label: 'Team Members' },
    { to: '/quiz-generator', icon: '⚡', label: 'Quiz Engine' },
    { to: '/settings', icon: '◮', label: 'Settings' },
  ];

  const employeeLinks = [
    { to: '/', icon: '▣', label: 'My Tasks' },
    { to: '/time-logs', icon: '◎', label: 'Time Logs' },
    { to: '/quiz-generator', icon: '⚡', label: 'Quiz Engine' },
    { to: '/settings', icon: '◮', label: 'Settings' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 md:hidden"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-[100dvh] w-64 backdrop-blur-xl border-r z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-base)',
          color: 'var(--text-base)',
        }}
      >
        <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
          {/* Brand Header */}
          <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <img src="/logo.png" alt="Strivers Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 font-heading" style={{ color: 'var(--text-heading)' }}>
                  Strivers
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                  Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5 mt-2">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              {isAdmin ? 'Management' : 'My Workspace'}
            </div>

            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/10 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--text-heading)' : 'var(--text-muted)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-lg transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110 ${isActive ? 'text-indigo-500 dark:text-indigo-400 animate-pulse-glow' : 'opacity-70'}`}>
                      {link.icon}
                    </span>
                    <span className="font-sans tracking-widest uppercase text-[11px] font-bold">{link.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-none bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_12px_#818cf8] animate-pulse-glow rotate-45" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div
          className="p-4 m-3 rounded-2xl backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-base)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md border border-white/20 shrink-0 overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>{user?.name}</p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {user?.role}
              </span>
            </div>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
