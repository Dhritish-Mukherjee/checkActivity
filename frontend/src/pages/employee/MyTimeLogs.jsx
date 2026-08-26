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
      setLogs(res.data.timeLogs);
      setTotalMinutes(res.data.totalMinutes);
    } catch (error) {
      console.error('Failed to fetch time logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Time Logs</h1>

      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="card bg-primary text-white">
        <p className="text-sm text-blue-200 mb-1">Total Time Logged</p>
        <p className="text-3xl font-bold">
          {hours}h {minutes}m
        </p>
      </div>

      {loading ? (
        <p className="text-center py-8 text-slate-500">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No time logs yet</p>
        </div>
      ) : (
        <div className="card space-y-2">
          {logs.map((log) => (
            <div
              key={log._id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-800">{log.task?.title}</p>
                {log.note && (
                  <p className="text-sm text-slate-500 mt-1">{log.note}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(log.date).toLocaleDateString()} ·{' '}
                  <span className="uppercase">{log.type}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">
                  {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTimeLogs;