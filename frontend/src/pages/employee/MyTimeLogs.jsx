import { useEffect, useState } from 'react';
import { timeLogAPI } from '../../services';

const inputCls = 'w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all';

const MyTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => { fetchLogs(); }, [dateRange]);

  const fetchLogs = async () => {
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      const res = await timeLogAPI.getMyTimeLogs(params);
      setLogs(res.data.timeLogs || []);
      setTotalMinutes(res.data.totalMinutes || 0);
    } catch (error) {
      console.error('Failed to fetch time logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-base)',
    color: 'var(--text-base)',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-heading" style={{ color: 'var(--text-heading)' }}>My Time Logs</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Summary of work duration and logged hours</p>
      </div>

      {/* Date Filter & Total Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card md:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Date Filter</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>From Date</label>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>To Date</label>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <button onClick={() => setDateRange({ start: '', end: '' })} className="px-4 py-2 mt-5 text-xs font-semibold rounded-xl transition-all" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-base)' }}>
              Reset Filter
            </button>
          </div>
        </div>

        {/* Total Stat Card */}
        <div className="card bg-gradient-to-tr from-indigo-500/10 via-violet-500/5 to-transparent dark:from-indigo-900/60 dark:via-violet-900/40 dark:to-slate-900/80 border-indigo-500/30 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Total Hours Logged</p>
          <div className="my-2">
            <span className="font-mono text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-heading)' }}>
              {hours}<span className="text-xl text-indigo-500 dark:text-indigo-300">h</span> {minutes}<span className="text-xl text-indigo-500 dark:text-indigo-300">m</span>
            </span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Total accumulated across selected period</p>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16 border-dashed" style={{ borderColor: 'var(--border-base)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No time logs recorded yet.</p>
        </div>
      ) : (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold font-heading pb-3" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-base)' }}>Detailed History</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-base)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div className="flex-1 pr-4">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{log.task?.title || 'Task'}</p>
                  {log.note && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{log.note}</p>}
                  <div className="flex items-center gap-3 text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
                    <span>📅 {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>•</span>
                    <span className="uppercase text-indigo-600 dark:text-indigo-400 font-semibold">{log.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-base px-3 py-1.5 rounded-xl inline-block" style={{ color: 'var(--text-heading)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
                    {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTimeLogs;
