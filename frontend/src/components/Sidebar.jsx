import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, logout, isAdmin }) => {
  const adminLinks = [
    { to: '/', icon: '◈', label: 'Dashboard' },
    { to: '/tasks', icon: '▣', label: 'All Tasks' },
    { to: '/employees', icon: '◩', label: 'Team Members' },
  ];

  const employeeLinks = [
    { to: '/', icon: '▣', label: 'My Tasks' },
    { to: '/time-logs', icon: '◎', label: 'Time Logs' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  // Initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950/80 backdrop-blur-xl border-r border-white/10 text-slate-200 z-30 flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/30 border border-white/20">
              S
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-heading">
                Strivers
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 mt-2">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Management' : 'My Workspace'}
          </div>

          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/10 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-lg transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110 ${isActive ? 'text-indigo-400 animate-pulse-glow' : 'opacity-70'}`}>
                    {link.icon}
                  </span>
                  <span className="font-sans tracking-widest uppercase text-[11px] font-bold">{link.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-none bg-indigo-400 shadow-[0_0_12px_#818cf8] animate-pulse-glow rotate-45" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 m-3 bg-slate-900/60 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md border border-white/20 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;