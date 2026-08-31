import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, authAPI } from '../../services';
import CatLoader from '../../components/CatLoader';

/* ─── Minimalist in Resting State ➔ Dynamic Maximalist on Hover ──────────── */

const OwnerWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 text-amber-500 transition-all duration-500">
    {/* Resting state: Subtle minimalist luxury crest */}
    <div className="opacity-[0.06] group-hover:opacity-0 transition-opacity duration-300">
      <svg className="absolute -top-6 -right-6 w-36 h-36" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
        <polygon points="50,15 62,38 85,38 66,54 73,78 50,62 27,78 34,54 15,38 38,38" />
      </svg>
    </div>

    {/* Hover state: Rich maximalist golden bloom & valuation sparklines */}
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.12] via-yellow-500/[0.04] to-transparent dark:from-amber-400/[0.18]" />
      
      {/* Upward Valuation Curve */}
      <svg className="absolute -bottom-4 -right-4 w-56 h-32" viewBox="0 0 200 120" fill="none" stroke="currentColor">
        <path d="M10 105 Q 60 85, 90 90 T 150 45 T 195 12" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />
        <path d="M10 105 Q 60 85, 90 90 T 150 45 T 195 12 L 195 120 L 10 120 Z" fill="currentColor" fillOpacity="0.14" />
      </svg>
      
      {/* Currency & Crown Watermark */}
      <div className="absolute top-2.5 right-24 font-mono font-black text-sm tracking-widest opacity-80 text-amber-600 dark:text-amber-300">
        $ · ₹ · € · ₿
      </div>
      <svg className="absolute -top-3 -right-3 w-24 h-24 opacity-25" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v2H5v-2z" />
      </svg>
      
      <div className="absolute bottom-14 left-5 font-mono text-[9px] uppercase font-black tracking-widest opacity-75 text-amber-700 dark:text-amber-300">
        FOUNDER CONTROL // +340% CAPITAL YIELD
      </div>
    </div>
  </div>
);

const TechWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 text-cyan-500 transition-all duration-500">
    {/* Resting state: Subtle minimalist circuit */}
    <div className="opacity-[0.06] group-hover:opacity-0 transition-opacity duration-300">
      <svg className="absolute -top-4 -right-4 w-32 h-32" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M10 10 H50 V50 H90 V90" />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        <circle cx="90" cy="90" r="3" fill="currentColor" />
      </svg>
    </div>

    {/* Hover state: Rich maximalist cyber circuitry & terminal telemetry */}
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.12] via-sky-500/[0.04] to-transparent dark:from-cyan-400/[0.18]" />
      
      {/* Circuit board bus lines */}
      <svg className="absolute -top-4 -right-4 w-44 h-44" viewBox="0 0 160 160" fill="none" stroke="currentColor">
        <path d="M10 20 H70 V70 H130 V130 H160" strokeWidth="1.5" />
        <circle cx="70" cy="70" r="3.5" fill="currentColor" />
        <circle cx="130" cy="130" r="3.5" fill="currentColor" />
        <path d="M90 15 V50 H140" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
      
      {/* Monospace Terminal Code */}
      <div className="absolute top-2.5 right-24 text-right space-y-0.5 opacity-85 font-mono text-[9px] text-cyan-600 dark:text-cyan-300">
        <p className="font-bold">const sys = new Engine();</p>
        <p>await cluster.deploy();</p>
        <p>{"<Node status='ACTIVE' />"}</p>
      </div>
      <div className="absolute bottom-14 left-5 space-y-0.5 opacity-75 font-mono text-[9px] text-cyan-700 dark:text-cyan-300">
        <p>git commit -m "feat(core): v2.4"</p>
        <p>latency: 0.6ms · 99.99% uptime</p>
      </div>
    </div>
  </div>
);

const PromotionalWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 text-rose-500 transition-all duration-500">
    {/* Resting state: Subtle minimalist trajectory */}
    <div className="opacity-[0.06] group-hover:opacity-0 transition-opacity duration-300">
      <svg className="absolute -bottom-4 -right-4 w-36 h-28" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M10 70 C 40 60, 60 40, 110 15" strokeLinecap="round" strokeDasharray="4 3" />
      </svg>
    </div>

    {/* Hover state: Rich maximalist launch curves & viral metrics */}
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-400/[0.12] via-pink-500/[0.04] to-transparent dark:from-rose-400/[0.18]" />
      
      {/* Rocket trajectory & target radar */}
      <svg className="absolute -bottom-4 -right-4 w-48 h-36" viewBox="0 0 180 120" fill="none" stroke="currentColor">
        <path d="M10 110 C 60 100, 90 60, 160 20" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
        <circle cx="160" cy="20" r="6" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
        <path d="M140 30 L160 20 L150 40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      
      <div className="absolute top-2.5 right-24 font-mono font-black text-xs tracking-wider opacity-85 text-rose-600 dark:text-rose-300">
        CAMPAIGN // 10X REACH
      </div>
      <div className="absolute top-1/2 left-24 -translate-y-1/2 font-mono text-[10px] font-black uppercase tracking-widest opacity-70 -rotate-6 text-rose-600 dark:text-rose-300">
        🚀 CTR 16.4% · VIRAL REACH
      </div>
      <div className="absolute bottom-14 left-5 font-mono text-[9px] uppercase font-black tracking-widest opacity-75 text-rose-700 dark:text-rose-300">
        BROADCAST · MEDIA · ENGAGEMENT
      </div>
    </div>
  </div>
);

const FacultyWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 text-violet-500 transition-all duration-500">
    {/* Resting state: Subtle minimalist coordinate line */}
    <div className="opacity-[0.06] group-hover:opacity-0 transition-opacity duration-300">
      <svg className="absolute -bottom-3 -right-3 w-36 h-24" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M10 70 L 110 70" opacity="0.4" />
        <path d="M20 75 L 20 10" opacity="0.4" />
      </svg>
    </div>

    {/* Hover state: Rich maximalist calculus curve & physics equations */}
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-400/[0.12] via-purple-500/[0.04] to-transparent dark:from-violet-400/[0.18]" />
      
      {/* Calculus Curve */}
      <svg className="absolute -bottom-2 -right-2 w-48 h-32" viewBox="0 0 180 120" fill="none" stroke="currentColor">
        <path d="M10 100 L 170 100" strokeWidth="1.2" opacity="0.4" />
        <path d="M25 110 L 25 10" strokeWidth="1.2" opacity="0.4" />
        <path d="M25 90 Q 75 90, 105 50 T 170 15" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      
      {/* LaTeX Equations */}
      <div className="absolute top-2.5 right-24 text-right space-y-0.5 text-[10px] font-bold italic opacity-85 font-mono text-violet-600 dark:text-violet-300">
        <p>E = mc² · ∫f(x)dx</p>
        <p>e^(iπ) + 1 = 0</p>
      </div>
      <div className="absolute bottom-14 left-5 space-y-0.5 text-[9px] font-bold opacity-75 font-mono text-violet-700 dark:text-violet-300">
        <p>lim (x→0) sin(x)/x = 1</p>
        <p>∇ × B = μ₀J + μ₀ε₀(∂E/∂t)</p>
      </div>
    </div>
  </div>
);

/* ─── Departments Filter Configuration ────────────────────────────────────── */

const DEPARTMENTS = [
  {
    key: 'all',
    label: 'All Members',
    color: 'indigo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'owners_club',
    label: "Owner's Club",
    color: 'amber',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    key: 'tech',
    label: 'Tech',
    color: 'cyan',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    key: 'promotional',
    label: 'Promotional',
    color: 'rose',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    key: 'faculty',
    label: 'Faculty',
    color: 'violet',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

const DEPT_CONFIG = {
  owners_club: {
    name: "Owner's Club",
    accentBar: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
    badgeStyle: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-400/80',
    avatarGradient: 'from-amber-400 via-yellow-500 to-orange-500',
    avatarRing: 'ring-amber-400/40 group-hover:ring-amber-400',
    cardBorderHover: 'hover:border-amber-400 dark:hover:border-amber-400/90 hover:shadow-2xl hover:shadow-amber-500/20',
    icon: (
      <svg className="w-3 h-3 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v2H5v-2z" />
      </svg>
    ),
    isOwner: true,
    Watermark: OwnerWatermark,
  },
  tech: {
    name: 'Tech',
    accentBar: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500',
    badgeStyle: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/80',
    avatarGradient: 'from-cyan-400 via-sky-500 to-blue-600',
    avatarRing: 'ring-cyan-400/40 group-hover:ring-cyan-400',
    cardBorderHover: 'hover:border-cyan-400 dark:hover:border-cyan-400/90 hover:shadow-2xl hover:shadow-cyan-500/20',
    icon: (
      <svg className="w-3 h-3 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    Watermark: TechWatermark,
  },
  promotional: {
    name: 'Promotional',
    accentBar: 'bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-500',
    badgeStyle: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 group-hover:bg-rose-500/20 group-hover:border-rose-400/80',
    avatarGradient: 'from-rose-400 via-pink-500 to-fuchsia-600',
    avatarRing: 'ring-rose-400/40 group-hover:ring-rose-400',
    cardBorderHover: 'hover:border-rose-400 dark:hover:border-rose-400/90 hover:shadow-2xl hover:shadow-rose-500/20',
    icon: (
      <svg className="w-3 h-3 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6" />
      </svg>
    ),
    Watermark: PromotionalWatermark,
  },
  faculty: {
    name: 'Faculty',
    accentBar: 'bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-500',
    badgeStyle: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 group-hover:bg-violet-500/20 group-hover:border-violet-400/80',
    avatarGradient: 'from-violet-500 via-purple-600 to-indigo-600',
    avatarRing: 'ring-violet-400/40 group-hover:ring-violet-400',
    cardBorderHover: 'hover:border-violet-400 dark:hover:border-violet-400/90 hover:shadow-2xl hover:shadow-violet-500/20',
    icon: (
      <svg className="w-3 h-3 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
      </svg>
    ),
    Watermark: FacultyWatermark,
  },
  default: {
    name: 'Team Member',
    accentBar: 'bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500',
    badgeStyle: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 group-hover:bg-indigo-500/20',
    avatarGradient: 'from-indigo-500 via-indigo-600 to-purple-600',
    avatarRing: 'ring-indigo-400/40 group-hover:ring-indigo-400',
    cardBorderHover: 'hover:border-indigo-400/60 dark:hover:border-indigo-500/40 hover:shadow-xl',
    icon: (
      <svg className="w-3 h-3 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    Watermark: null,
  },
};

const getDeptConfig = (dept) => DEPT_CONFIG[dept] || DEPT_CONFIG.default;

const HIERARCHY_ORDER = {
  owners_club: 1,
  tech: 2,
  promotional: 3,
  faculty: 4,
};

const getRank = (emp) => {
  const depts = Array.isArray(emp.department) ? emp.department : (emp.department ? [emp.department] : []);
  if (depts.length === 0) return 99;
  let minRank = 99;
  for (const d of depts) {
    if (HIERARCHY_ORDER[d] && HIERARCHY_ORDER[d] < minRank) {
      minRank = HIERARCHY_ORDER[d];
    }
  }
  return minRank;
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

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await dashboardAPI.getEmployeesSummary();
      setEmployees(res.data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
    : employees.filter((e) => (Array.isArray(e.department) ? e.department.includes(activeTab) : e.department === activeTab));

  // Sort by hierarchy: Owner's Club (1) -> Tech (2) -> Promotional (3) -> Faculty (4)
  const sortedEmployees = [...filtered].sort((a, b) => getRank(a) - getRank(b));

  const countFor = (key) =>
    key === 'all'
      ? employees.length
      : employees.filter((e) => (Array.isArray(e.department) ? e.department.includes(key) : e.department === key)).length;

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
          <h1 className="text-3xl font-extrabold tracking-tight font-heading" style={{ color: 'var(--text-heading)' }}>
            Team Directory
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Overview of team members organized by departmental hierarchy
          </p>
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
            indigo: isActive ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            amber:  isActive ? 'bg-amber-500/15 border-amber-500/50 text-amber-800 dark:text-amber-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            cyan:   isActive ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-800 dark:text-cyan-300'     : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            rose:   isActive ? 'bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-300'     : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            violet: isActive ? 'bg-violet-500/15 border-violet-500/50 text-violet-800 dark:text-violet-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
          };
          return (
            <button
              key={dept.key}
              onClick={() => setActiveTab(dept.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold transition-all ${colorMap[dept.color]}`}
              style={!isActive ? { color: 'var(--text-muted)' } : {}}
            >
              {dept.icon}
              <span>{dept.label}</span>
              <span className="ml-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                {countFor(dept.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Employee Cards Grid — Clean Minimalist Resting ➔ Dynamic Maximalist Hover */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center py-16"><CatLoader text="Loading Members..." /></div>
        ) : sortedEmployees.length === 0 ? (
          <div className="col-span-full flex flex-col items-center py-16 gap-3 text-center">
            <p style={{ color: 'var(--text-faint)' }}>
              {activeTab === 'all' ? 'No employees registered yet.' : `No employees in the ${DEPARTMENTS.find((d) => d.key === activeTab)?.label} department yet.`}
            </p>
          </div>
        ) : (
          sortedEmployees.map((emp) => {
            const primaryDept = Array.isArray(emp.department) ? emp.department[0] : emp.department;
            const config = getDeptConfig(primaryDept);
            const isFacultyEmp = Array.isArray(emp.department) ? emp.department.includes('faculty') : emp.department === 'faculty';

            return (
              <div
                key={emp._id}
                className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/90 shadow-sm ${config.cardBorderHover} group transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between`}
              >
                {/* Minimalist ➔ Maximalist Thematic Watermark on Hover */}
                {config.Watermark && <config.Watermark />}

                {/* Clickable Card Overlay */}
                <div
                  onClick={() => navigate(`/employees/${emp._id}`)}
                  className="absolute inset-0 z-10 cursor-pointer"
                  title={`View ${emp.name}'s profile`}
                />

                {/* Top Hierarchy Indicator Bar (expands on hover) */}
                <div className={`w-full h-1 group-hover:h-1.5 transition-all duration-300 relative z-10 ${config.accentBar}`} />

                {/* Corner Department Badge */}
                <div
                  className={`absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border shadow-2xs backdrop-blur-xs transition-all duration-300 ${config.badgeStyle}`}
                >
                  {config.icon}
                  <span className="font-heading">{config.name}</span>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(emp._id, emp.name, e)}
                  className="absolute bottom-3.5 right-3.5 z-30 w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-rose-500/25 border border-rose-500/30 cursor-pointer shadow-sm backdrop-blur-sm"
                  title="Delete Employee"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>

                {/* Card Main Header Info */}
                <div className="p-5 pointer-events-none pb-0 relative z-10">
                  <div className="flex items-center gap-3.5 mb-4 pr-20">
                    {/* Avatar with energetic hover scaling */}
                    <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-tr ${config.avatarGradient} text-white font-bold flex items-center justify-center text-base shadow-sm ring-2 ${config.avatarRing} ring-offset-2 ring-offset-white dark:ring-offset-slate-900 group-hover:scale-105 transition-all duration-300 shrink-0 overflow-hidden`}>
                      {emp.profilePicture ? (
                        <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                      {config.isOwner && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 border border-white shadow-xs flex items-center justify-center">
                          <svg className="w-2 h-2 text-amber-950" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Name and Email */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-bold truncate font-heading tracking-tight text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.name}
                      </p>
                      <p className="text-xs truncate font-medium text-slate-500 dark:text-slate-400">
                        {emp.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Structured Stats Footer */}
                <div className="grid grid-cols-3 gap-2 px-5 py-3 mt-4 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/60 relative z-10 transition-colors duration-300">
                  {isFacultyEmp ? (
                    <>
                      <div className="text-center">
                        <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">{emp.teacherStats?.totalClasses ?? '—'}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Classes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">{emp.teacherStats?.totalHours ? `${emp.teacherStats.totalHours}h` : '—'}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                          {emp.teacherStats?.totalViews ? (emp.teacherStats.totalViews >= 1000 ? `${(emp.teacherStats.totalViews / 1000).toFixed(1)}K` : emp.teacherStats.totalViews) : '—'}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Views</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">{emp.totalTasks}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">{emp.completedTasks}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">{emp.totalHours}h</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Logged</p>
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
                    const s = getDeptConfig(dept.key);
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
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-semibold ${isSelected ? `${s.badgeStyle} border-current` : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        style={!isSelected ? { borderColor: 'var(--border-base)', color: 'var(--text-muted)' } : {}}
                      >
                        <span>{dept.icon}</span>
                        <span>{dept.label}</span>
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
