import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, logout, isAdmin }) => {
  const adminLinks = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/tasks', icon: '📋', label: 'Tasks' },
    { to: '/employees', icon: '👥', label: 'Employees' },
  ];

  const employeeLinks = [
    { to: '/', icon: '📋', label: 'My Tasks' },
    { to: '/time-logs', icon: '⏱️', label: 'My Time Logs' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-1">Strivers</h2>
        <p className="text-sm text-blue-200">Task Manager</p>
      </div>

      <nav className="mt-6">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-white/20 text-white border-r-4 border-white'
                  : 'text-blue-100 hover:bg-white/10'
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/20">
        <p className="text-sm text-blue-200 mb-1">Signed in as</p>
        <p className="font-medium truncate">{user?.name}</p>
        <p className="text-xs text-blue-200 capitalize">{user?.role}</p>
      </div>
    </aside>
  );
};

export default Sidebar;