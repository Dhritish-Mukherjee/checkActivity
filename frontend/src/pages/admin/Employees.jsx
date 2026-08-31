import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, authAPI } from '../../services';
import CatLoader from '../../components/CatLoader';

/* ─── Departmental Watermark Background Patterns ──────────────────────────── */

const OwnerWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[0.20] group-hover:opacity-[0.35] dark:opacity-[0.24] dark:group-hover:opacity-[0.42] transition-opacity duration-500 text-amber-600 dark:text-amber-400">
    {/* Upward valuation curve */}
    <svg className="absolute -bottom-6 -right-6 w-60 h-36" viewBox="0 0 200 120" fill="none" stroke="currentColor">
      <path d="M10 105 Q 60 85, 90 90 T 150 45 T 195 12" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />
      <path d="M10 105 Q 60 85, 90 90 T 150 45 T 195 12 L 195 120 L 10 120 Z" fill="currentColor" fillOpacity="0.10" />
    </svg>
    {/* Large currency & wealth symbols in corner */}
    <div className="absolute top-2.5 right-28 font-mono font-black text-xl tracking-widest opacity-70">
      $ · ₹ · €
    </div>
    {/* Crown Seal watermark */}
    <svg className="absolute -top-3 -right-3 w-28 h-28 opacity-15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v2H5v-2z" />
    </svg>
    <div className="absolute bottom-16 left-5 font-mono text-[9px] uppercase font-black tracking-widest opacity-60">
      VALUATION // FOUNDER CONTROL
    </div>
    <div className="absolute top-1/2 left-24 -translate-y-1/2 font-mono text-[10px] font-black tracking-wider opacity-45 rotate-6">
      ▲ +340% CAPITAL YIELD
    </div>
  </div>
);

const TechWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[0.18] group-hover:opacity-[0.32] dark:opacity-[0.22] dark:group-hover:opacity-[0.40] transition-opacity duration-500 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] leading-tight">
    {/* Circuit board traces */}
    <svg className="absolute -top-6 -right-6 w-48 h-48" viewBox="0 0 160 160" fill="none" stroke="currentColor">
      <path d="M10 20 H70 V70 H130 V130 H160" strokeWidth="1.5" />
      <circle cx="70" cy="70" r="3.5" fill="currentColor" />
      <circle cx="130" cy="130" r="3.5" fill="currentColor" />
      <path d="M90 15 V50 H140" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
    {/* Monospace Code Lines */}
    <div className="absolute top-3 right-28 text-right space-y-1 opacity-75 font-mono text-[10px]">
      <p className="font-bold">const system = new Engine();</p>
      <p>await cluster.deploy();</p>
      <p>{"<Node status='OK' />"}</p>
    </div>
    <div className="absolute bottom-15 left-5 space-y-0.5 opacity-65 font-mono text-[9px]">
      <p className="font-semibold">git commit -m "feat(core): v2.4"</p>
      <p>latency: 0.8ms · 99.99% uptime</p>
    </div>
  </div>
);

const PromotionalWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[0.18] group-hover:opacity-[0.32] dark:opacity-[0.22] dark:group-hover:opacity-[0.40] transition-opacity duration-500 text-rose-600 dark:text-rose-400">
    {/* Campaign launch curve */}
    <svg className="absolute -bottom-4 -right-4 w-52 h-36" viewBox="0 0 180 120" fill="none" stroke="currentColor">
      <path d="M10 110 C 60 100, 90 60, 160 20" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
      <circle cx="160" cy="20" r="6" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
      <path d="M140 30 L160 20 L150 40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div className="absolute top-3 right-28 font-mono font-black text-xs tracking-wider opacity-75">
      CAMPAIGN // 10X REACH
    </div>
    <div className="absolute top-1/2 left-24 -translate-y-1/2 font-mono text-[10px] font-black uppercase tracking-widest opacity-55 -rotate-6">
      🚀 CTR 16.4% · VIRAL REACH
    </div>
    <div className="absolute bottom-15 left-5 font-mono text-[9px] uppercase font-black tracking-widest opacity-65">
      BROADCAST · MEDIA · ENGAGEMENT
    </div>
  </div>
);

const FacultyWatermark = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[0.18] group-hover:opacity-[0.32] dark:opacity-[0.22] dark:group-hover:opacity-[0.40] transition-opacity duration-500 text-violet-700 dark:text-violet-400">
    {/* Coordinate grid & Calculus Curve */}
    <svg className="absolute -bottom-2 -right-2 w-52 h-36" viewBox="0 0 180 120" fill="none" stroke="currentColor">
      <path d="M10 100 L 170 100" strokeWidth="1" opacity="0.3" />
      <path d="M25 110 L 25 10" strokeWidth="1" opacity="0.3" />
      <path d="M25 90 Q 75 90, 105 50 T 170 15" strokeWidth="2" strokeLinecap="round" />
    </svg>
    {/* LaTeX-style Scientific Equations */}
    <div className="absolute top-3 right-28 text-right space-y-0.5 text-[11px] font-bold italic opacity-75 font-mono">
      <p>E = mc²</p>
      <p>∫ f(x)dx = F(x) + C</p>
      <p>e^(iπ) + 1 = 0</p>
    </div>
    <div className="absolute bottom-15 left-5 space-y-0.5 text-[9px] font-bold opacity-65 font-mono">
      <p>lim (x→0) sin(x)/x = 1</p>
      <p>∑ (1/2ⁿ) = 1 · ∇ × B = μ₀J</p>
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
    badge: 'Tier 1',
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
    badge: 'Tier 2',
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
    badge: 'Tier 3',
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
    badge: 'Tier 4',
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
    rankLabel: 'Executive Leadership',
    tierNumber: 'Tier 1',
    cardBg: 'bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white dark:from-amber-950/40 dark:via-slate-900/95 dark:to-amber-950/20',
    cardBorder: 'border-amber-400/80 dark:border-amber-500/50',
    cardShadow: 'shadow-md shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20',
    accentBar: 'h-2 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500',
    badgeStyle: 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-400/70 dark:border-amber-500/50',
    statsBg: 'bg-amber-500/[0.08] dark:bg-amber-950/50 border-amber-400/30 dark:border-amber-500/30',
    avatarGradient: 'from-amber-400 via-yellow-500 to-orange-500',
    avatarRing: 'ring-amber-400 dark:ring-amber-400/80',
    nameColor: 'text-amber-950 dark:text-amber-100',
    numberColor: 'text-amber-900 dark:text-amber-200',
    avatarSize: 'w-14 h-14',
    icon: (
      <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v2H5v-2z" />
      </svg>
    ),
    isOwner: true,
    Watermark: OwnerWatermark,
  },
  tech: {
    name: 'Tech',
    rankLabel: 'Engineering & Systems',
    tierNumber: 'Tier 2',
    cardBg: 'bg-gradient-to-br from-cyan-50/90 via-sky-50/30 to-white dark:from-cyan-950/40 dark:via-slate-900/95 dark:to-cyan-950/20',
    cardBorder: 'border-cyan-400/80 dark:border-cyan-500/50',
    cardShadow: 'shadow-md shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20',
    accentBar: 'h-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500',
    badgeStyle: 'bg-cyan-500/15 text-cyan-900 dark:text-cyan-200 border-cyan-400/70 dark:border-cyan-500/50',
    statsBg: 'bg-cyan-500/[0.08] dark:bg-cyan-950/50 border-cyan-400/30 dark:border-cyan-500/30',
    avatarGradient: 'from-cyan-400 via-sky-500 to-blue-600',
    avatarRing: 'ring-cyan-400 dark:ring-cyan-400/80',
    nameColor: 'text-cyan-950 dark:text-cyan-100',
    numberColor: 'text-cyan-900 dark:text-cyan-200',
    avatarSize: 'w-12 h-12',
    icon: (
      <svg className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    Watermark: TechWatermark,
  },
  promotional: {
    name: 'Promotional',
    rankLabel: 'Growth & Outreach',
    tierNumber: 'Tier 3',
    cardBg: 'bg-gradient-to-br from-rose-50/90 via-pink-50/30 to-white dark:from-rose-950/35 dark:via-slate-900/95 dark:to-rose-950/20',
    cardBorder: 'border-rose-400/70 dark:border-rose-500/40',
    cardShadow: 'shadow-md shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20',
    accentBar: 'h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-500',
    badgeStyle: 'bg-rose-500/15 text-rose-900 dark:text-rose-200 border-rose-400/60 dark:border-rose-500/40',
    statsBg: 'bg-rose-500/[0.07] dark:bg-rose-950/40 border-rose-400/30 dark:border-rose-500/30',
    avatarGradient: 'from-rose-400 via-pink-500 to-fuchsia-600',
    avatarRing: 'ring-rose-400 dark:ring-rose-400/80',
    nameColor: 'text-rose-950 dark:text-rose-100',
    numberColor: 'text-rose-900 dark:text-rose-200',
    avatarSize: 'w-12 h-12',
    icon: (
      <svg className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6" />
      </svg>
    ),
    Watermark: PromotionalWatermark,
  },
  faculty: {
    name: 'Faculty',
    rankLabel: 'Academic Educator',
    tierNumber: 'Tier 4',
    cardBg: 'bg-gradient-to-br from-violet-50/80 via-purple-50/20 to-white dark:from-violet-950/30 dark:via-slate-900/95 dark:to-violet-950/15',
    cardBorder: 'border-violet-300/80 dark:border-violet-500/35',
    cardShadow: 'shadow-sm shadow-violet-500/5 hover:shadow-xl hover:shadow-violet-500/15',
    accentBar: 'h-1.5 bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-500',
    badgeStyle: 'bg-violet-500/15 text-violet-900 dark:text-violet-200 border-violet-400/50 dark:border-violet-500/40',
    statsBg: 'bg-violet-500/[0.06] dark:bg-violet-950/40 border-violet-300/40 dark:border-violet-500/25',
    avatarGradient: 'from-violet-500 via-purple-600 to-indigo-600',
    avatarRing: 'ring-violet-400 dark:ring-violet-400/80',
    nameColor: 'text-slate-900 dark:text-slate-100',
    numberColor: 'text-violet-950 dark:text-violet-200',
    avatarSize: 'w-12 h-12',
    icon: (
      <svg className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
      </svg>
    ),
    Watermark: FacultyWatermark,
  },
  default: {
    name: 'Team Member',
    rankLabel: 'General Staff',
    tierNumber: 'Member',
    cardBg: 'bg-white dark:bg-slate-900/90',
    cardBorder: 'border-slate-200/90 dark:border-slate-800',
    cardShadow: 'shadow-sm hover:shadow-lg',
    accentBar: 'h-1 bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500',
    badgeStyle: 'bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 border-indigo-500/30',
    statsBg: 'bg-slate-50/90 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/80',
    avatarGradient: 'from-indigo-500 via-indigo-600 to-purple-600',
    avatarRing: 'ring-indigo-400 dark:ring-indigo-400/80',
    nameColor: 'text-slate-900 dark:text-slate-100',
    numberColor: 'text-slate-900 dark:text-slate-100',
    avatarSize: 'w-12 h-12',
    icon: (
      <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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

      {/* Category Tabs with Hierarchy Tiers */}
      <div className="flex items-center gap-2 flex-wrap pb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {DEPARTMENTS.map((dept) => {
          const isActive = activeTab === dept.key;
          const colorMap = {
            indigo: isActive ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-700 dark:text-indigo-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            amber:  isActive ? 'bg-amber-500/15 border-amber-500/60 text-amber-800 dark:text-amber-300 shadow-sm' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            cyan:   isActive ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-800 dark:text-cyan-300'     : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            rose:   isActive ? 'bg-rose-500/15 border-rose-500/60 text-rose-800 dark:text-rose-300'     : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
            violet: isActive ? 'bg-violet-500/15 border-violet-500/60 text-violet-800 dark:text-violet-300' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5',
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
              {dept.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 opacity-80">
                  {dept.badge}
                </span>
              )}
              <span className="ml-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                {countFor(dept.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Employee Cards Grid */}
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
                className={`relative overflow-hidden rounded-2xl border-2 ${config.cardBg} ${config.cardBorder} ${config.cardShadow} group transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between`}
              >
                {/* Department Watermark Motif */}
                {config.Watermark && <config.Watermark />}

                {/* Clickable Card Overlay */}
                <div
                  onClick={() => navigate(`/employees/${emp._id}`)}
                  className="absolute inset-0 z-10 cursor-pointer"
                  title={`View ${emp.name}'s profile`}
                />

                {/* Top Hierarchy Indicator Bar */}
                <div className={`w-full relative z-10 ${config.accentBar}`} />

                {/* Hierarchy Badge in Corner */}
                <div
                  className={`absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-xs backdrop-blur-xs ${config.badgeStyle}`}
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

                {/* Card Main Info */}
                <div className="p-5 pointer-events-none pb-0 relative z-10">
                  <div className="flex items-center gap-3.5 mb-4 pr-24">
                    {/* Avatar with hierarchy ring */}
                    <div className={`relative ${config.avatarSize} rounded-2xl bg-gradient-to-tr ${config.avatarGradient} text-white font-black flex items-center justify-center text-lg shadow-md ring-2 ${config.avatarRing} ring-offset-2 ring-offset-white dark:ring-offset-slate-900 border border-white/60 shrink-0 overflow-hidden`}>
                      {emp.profilePicture ? (
                        <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                      {config.isOwner && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 border border-white shadow-xs flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-amber-950" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Name and Role details */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className={`font-extrabold truncate font-heading tracking-tight text-base ${config.nameColor} group-hover:brightness-110 transition-all`}>
                        {emp.name}
                      </p>
                      <p className="text-xs truncate font-medium text-slate-500 dark:text-slate-400">
                        {emp.email}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {config.rankLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Footer with Hierarchy Tint */}
                <div className={`grid grid-cols-3 gap-2 px-5 py-3.5 mt-4 border-t relative z-10 ${config.statsBg}`}>
                  {isFacultyEmp ? (
                    <>
                      <div className="text-center">
                        <p className={`text-base font-bold font-mono ${config.numberColor}`}>{emp.teacherStats?.totalClasses ?? '—'}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Classes</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-base font-bold font-mono ${config.numberColor}`}>{emp.teacherStats?.totalHours ? `${emp.teacherStats.totalHours}h` : '—'}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Hours</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-base font-bold font-mono ${config.numberColor}`}>
                          {emp.teacherStats?.totalViews ? (emp.teacherStats.totalViews >= 1000 ? `${(emp.teacherStats.totalViews / 1000).toFixed(1)}K` : emp.teacherStats.totalViews) : '—'}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Views</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className={`text-base font-bold font-mono ${config.numberColor}`}>{emp.totalTasks}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-base font-bold font-mono ${config.numberColor}`}>{emp.completedTasks}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Done</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-base font-bold font-mono ${config.numberColor}`}>{emp.totalHours}h</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Logged</p>
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
