import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, authAPI } from '../../services';
import CatLoader from '../../components/CatLoader';

const DEPARTMENTS = [
  {
    key: 'all', label: 'All Members', color: 'indigo',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    key: 'faculty', label: 'Faculty', color: 'violet',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    key: 'tech', label: 'Tech', color: 'cyan',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
  },
  {
    key: 'promotional', label: 'Promotional', color: 'rose',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  },
  {
    key: 'owners_club', label: 'Owners Club', color: 'amber',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  },
];

const DEPT_COLORS = {
  faculty:     { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-600 dark:text-violet-400', avatar: 'from-violet-600 to-purple-600', shadow: 'shadow-violet-500/20' },
  tech:        { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-600 dark:text-cyan-400',   avatar: 'from-cyan-600 to-blue-600',   shadow: 'shadow-cyan-500/20' },
  promotional: { bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   text: 'text-rose-600 dark:text-rose-400',   avatar: 'from-rose-600 to-pink-600',   shadow: 'shadow-rose-500/20' },
  owners_club: { bg: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20', border: 'border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]', text: 'text-amber-600 dark:text-amber-300', avatar: 'from-amber-400 via-yellow-500 to-orange-500', shadow: 'shadow-amber-500/40' },
  default:     { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', avatar: 'from-indigo-600 to-purple-600', shadow: 'shadow-indigo-500/20' },
};

const getDeptStyle = (dept) => DEPT_COLORS[dept] || DEPT_COLORS.default;

const DeptBadge = ({ dept }) => {
  if (!dept || (Array.isArray(dept) && dept.length === 0)) return null;
  const depts = Array.isArray(dept) ? dept : [dept];
  return (
    <div className="flex flex-wrap gap-1">
      {depts.map(d => {
        const s = getDeptStyle(d);
        const info = DEPARTMENTS.find((x) => x.key === d);
        return (
          <span key={d} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.border} border ${s.text}`}>
            {info?.icon}{info?.label || d}
          </span>
        );
      })}
    </div>
  );
};

const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500/50 transition-all';

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', department: [] });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await dashboardAPI.getEmployeesSummary();
      setEmployees(res.data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newEmployee, role: 'employee' };
      if (!payload.department || payload.department.length === 0) delete payload.department;
      await authAPI.register(payload);
      setShowCreateModal(false);
      setNewEmployee({ name: '', email: '', password: '', department: [] });
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleDelete = (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete({ id, name });
  };

  const confirmAndDelete = async () => {
    if (!confirmDelete) return;
    try {
      await authAPI.deleteEmployee(confirmDelete.id);
      setConfirmDelete(null);
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete employee');
      setConfirmDelete(null);
    }
  };

  const filtered = activeTab === 'all'
    ? employees
    : employees.filter((e) => Array.isArray(e.department) ? e.department.includes(activeTab) : e.department === activeTab);

  const countFor = (key) =>
    key === 'all' ? employees.length : employees.filter((e) => Array.isArray(e.department) ? e.department.includes(key) : e.department === key).length;

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-base)',
    color: 'var(--text-base)',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading" style={{ color: 'var(--text-heading)' }}>Team Directory</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Overview of active team members and logged activity</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <span className="font-mono text-indigo-200">[+]</span>
          <span>Add Employee</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 flex-wrap pb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {DEPARTMENTS.map((dept) => {
          const isActive = activeTab === dept.key;
          const colorMap = {
            indigo: isActive ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            violet: isActive ? 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            cyan:   isActive ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-300'     : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            rose:   isActive ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'     : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            amber:  isActive ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
          };
          return (
            <button
              key={dept.key}
              onClick={() => setActiveTab(dept.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold transition-all ${colorMap[dept.color]}`}
              style={!isActive ? { color: 'var(--text-muted)' } : {}}
            >
              {dept.icon}
              {dept.label}
              <span className={`ml-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded-md`} style={{ backgroundColor: 'var(--bg-subtle)' }}>
                {countFor(dept.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center py-16"><CatLoader text="Loading Members..." /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center py-16 gap-3 text-center">
            <p style={{ color: 'var(--text-faint)' }}>
              {activeTab === 'all' ? 'No employees registered yet.' : `No employees in the ${DEPARTMENTS.find((d) => d.key === activeTab)?.label} department yet.`}
            </p>
          </div>
        ) : (
          filtered.map((emp) => {
            const primaryDept = Array.isArray(emp.department) ? emp.department[0] : emp.department;
            const style = getDeptStyle(primaryDept);
            return (
              <div key={emp._id} className={`card card-hover block group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${style.shadow} hover:border-transparent`}>
                <div onClick={() => navigate(`/employees/${emp._id}`)} className="absolute inset-0 z-10 cursor-pointer" title={`View ${emp.name}'s profile`} />
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${style.avatar} opacity-70`} />
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${style.avatar} rounded-full blur-[40px] opacity-20 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-50 transition-opacity pointer-events-none`} />
                <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br ${style.avatar} rounded-full blur-[40px] opacity-10 dark:opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none`} />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.02)_50%,transparent_55%)] bg-[length:200%_200%] bg-[100%_100%] group-hover:bg-[0%_0%] transition-all duration-700 pointer-events-none" />

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(emp._id, emp.name, e)}
                  className="absolute top-4 right-4 z-30 w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500/30 border border-rose-500/30 cursor-pointer shadow-lg"
                  title="Delete Employee"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>

                {/* Card Content */}
                <div className="flex items-center gap-3.5 mb-4 relative z-0 pointer-events-none">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${style.avatar} text-white font-black flex items-center justify-center text-base shadow-lg ${style.shadow} border border-white/20 shrink-0 overflow-hidden`}>
                    {emp.profilePicture ? (
                      <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                    ) : emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pr-10 space-y-1">
                    <p className="font-bold group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors truncate font-heading" style={{ color: 'var(--text-heading)' }}>{emp.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{emp.email}</p>
                    <DeptBadge dept={emp.department} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3.5 -mx-6 -mb-6 p-4 rounded-b-2xl pointer-events-none relative z-0" style={{ backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-base)' }}>
                  {(Array.isArray(emp.department) ? emp.department.includes('faculty') : emp.department === 'faculty') ? (
                    <>
                      <div className="text-center">
                        <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-heading)' }}>{emp.teacherStats?.totalClasses ?? '—'}</p>
                        <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>Classes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400 font-mono">{emp.teacherStats?.totalHours ? `${emp.teacherStats.totalHours}h` : '—'}</p>
                        <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                          {emp.teacherStats?.totalViews ? (emp.teacherStats.totalViews >= 1000 ? `${(emp.teacherStats.totalViews / 1000).toFixed(1)}K` : emp.teacherStats.totalViews) : '—'}
                        </p>
                        <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>Views</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-heading)' }}>{emp.totalTasks}</p>
                        <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{emp.completedTasks}</p>
                        <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>Done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono">{emp.totalHours}h</p>
                        <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-faint)' }}>Logged</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--bg-overlay)' }}>
          <div className="rounded-3xl max-w-sm w-full p-7 shadow-2xl" style={{ backgroundColor: 'var(--bg-modal)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            <h2 className="text-lg font-bold font-heading mb-1" style={{ color: 'var(--text-heading)' }}>Delete Employee?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to delete <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>{confirmDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-base)' }}>Cancel</button>
              <button type="button" onClick={confirmAndDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-500/20">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--bg-overlay)' }}>
          <div className="rounded-3xl max-w-md w-full p-7 shadow-2xl" style={{ backgroundColor: 'var(--bg-modal)', border: '1px solid var(--border-base)' }}>
            <h2 className="text-xl font-bold font-heading mb-1" style={{ color: 'var(--text-heading)' }}>Add New Employee</h2>
            <p className="text-xs mb-5 pb-4" style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--border-base)' }}>Create an account and assign their department.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
                <input type="text" required value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} className={inputCls} style={inputStyle} placeholder="e.g. Anirban Ghosh" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Email Address *</label>
                <input type="email" required value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className={inputCls} style={inputStyle} placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Initial Password *</label>
                <input type="password" required minLength={6} value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} className={inputCls} style={inputStyle} placeholder="Min. 6 characters" />
              </div>

              {/* Department Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Departments</label>
                <div className="grid grid-cols-2 gap-2">
                  {DEPARTMENTS.filter((d) => d.key !== 'all').map((dept) => {
                    const isSelected = newEmployee.department.includes(dept.key);
                    const s = getDeptStyle(dept.key);
                    return (
                      <button
                        key={dept.key}
                        type="button"
                        onClick={() => {
                          const newDepts = isSelected
                            ? newEmployee.department.filter(d => d !== dept.key)
                            : [...newEmployee.department, dept.key];
                          setNewEmployee({ ...newEmployee, department: newDepts });
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-semibold ${isSelected ? `${s.bg} ${s.border} ${s.text}` : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        style={!isSelected ? { borderColor: 'var(--border-base)', color: 'var(--text-muted)' } : {}}
                      >
                        <span className={isSelected ? s.text : ''}>{dept.icon}</span>
                        {dept.label}
                      </button>
                    );
                  })}
                </div>
                {newEmployee.department.length === 0 && (
                  <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-faint)' }}>Optional — can be assigned later</p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4" style={{ borderTop: '1px solid var(--border-base)' }}>
                <button type="button" onClick={() => { setShowCreateModal(false); setNewEmployee({ name: '', email: '', password: '', department: [] }); }} className="px-4 py-2 text-xs font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-primary text-sm py-2 px-5">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
