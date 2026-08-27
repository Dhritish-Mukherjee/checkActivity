import { useEffect, useState } from 'react';
import { timeLogAPI } from '../../services';

const MyTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchLogs();
  }, [dateRange]);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-heading">My Time Logs</h1>
        <p className="text-slate-400 text-sm mt-0.5">Summary of work duration and logged hours</p>
      </div>

      {/* Date Filter & Total Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card md:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Date Filter</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="px-4 py-2 mt-5 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Total Stat Card */}
        <div className="card bg-gradient-to-tr from-indigo-900/60 via-violet-900/40 to-slate-900/80 border-indigo-500/30 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Total Hours Logged</p>
          <div className="my-2">
            <span className="font-mono text-4xl font-extrabold text-white tracking-tight">
              {hours}<span className="text-xl text-indigo-300">h</span> {minutes}<span className="text-xl text-indigo-300">m</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Total accumulated across selected period</p>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-white/10">
          <p className="text-slate-400 text-sm">No time logs recorded yet.</p>
        </div>
      ) : (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-white font-heading border-b border-white/10 pb-3">Detailed History</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <p className="font-bold text-white text-sm">{log.task?.title || 'Task'}</p>
                  {log.note && (
                    <p className="text-xs text-slate-400 mt-1">{log.note}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                    <span>📅 {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>•</span>
                    <span className="uppercase text-indigo-400 font-semibold">{log.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-white text-base bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10 inline-block">
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