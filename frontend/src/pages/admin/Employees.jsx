import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, authAPI } from '../../services';

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

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
      await authAPI.register({ ...newEmployee, role: 'employee' });
      setShowCreateModal(false);
      setNewEmployee({ name: '', email: '', password: '' });
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleDelete = async (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await authAPI.deleteEmployee(id);
        fetchEmployees();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-heading">Team Directory</h1>
          <p className="text-slate-400 text-sm mt-0.5">Overview of active team members and logged activity</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <span className="font-mono text-indigo-200">[+]</span>
          <span>Add Employee</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : employees.length === 0 ? (
          <p className="text-slate-500 col-span-full text-center py-12">No employees registered yet.</p>
        ) : (
          employees.map((emp) => (
            <div
              key={emp._id}
              className="card card-hover block group relative overflow-hidden"
            >
              {/* Navigation Overlay (Behind buttons, above background) */}
              <div 
                onClick={() => navigate(`/employees/${emp._id}`)}
                className="absolute inset-0 z-10 cursor-pointer"
                title={`View ${emp.name}'s profile`}
              />

              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.02)_50%,transparent_55%)] bg-[length:200%_200%] bg-[100%_100%] group-hover:bg-[0%_0%] transition-all duration-700 pointer-events-none" />
              
              {/* Delete Button (Highest Z-index) */}
              <button 
                type="button"
                onClick={(e) => handleDelete(emp._id, emp.name, e)}
                className="absolute top-4 right-4 z-30 w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500/30 hover:text-rose-300 border border-rose-500/30 cursor-pointer shadow-lg"
                title="Delete Employee"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>

              {/* Card Content */}
              <div className="flex items-center gap-3.5 mb-4 relative z-0 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-base shadow-lg shadow-indigo-500/20 border border-white/20 shrink-0 overflow-hidden">
                  {emp.profilePicture ? (
                    <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    emp.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-10">
                  <p className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate font-heading">{emp.name}</p>
                  <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-white/10 bg-slate-950/40 -mx-6 -mb-6 p-4 rounded-b-2xl pointer-events-none relative z-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-white font-mono">{emp.totalTasks}</p>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400 font-mono">{emp.completedTasks}</p>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Done</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-cyan-400 font-mono">{emp.totalHours}h</p>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Logged</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-7 shadow-2xl">
            <h2 className="text-xl font-bold text-white font-heading mb-4 border-b border-white/10 pb-3">
              Add New Employee Account
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm py-2 px-5">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;