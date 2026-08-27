import { useEffect, useState, useCallback } from 'react';
import { youtubeAPI } from '../../services';

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
);
const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);
const SyncIcon = ({ spin }) => (
  <svg className={`w-4 h-4 ${spin ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const YoutubeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const DBIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatViews = (n) => {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};
const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
};

const SERIES_STYLES = {
  'Lali Series': { bg: 'bg-violet-500/10', border: 'border-violet-500/25', text: 'text-violet-400', dot: 'bg-violet-400' },
  'Udyam Series': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};
const SeriesBadge = ({ name }) => {
  if (!name) return null;
  const s = SERIES_STYLES[name] || { bg: 'bg-slate-500/10', border: 'border-slate-500/25', text: 'text-slate-400', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {name}
    </span>
  );
};

// ─── Stream Card ──────────────────────────────────────────────────────────────
const StreamCard = ({ stream }) => (
  <a
    href={stream.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group relative flex flex-col rounded-xl overflow-hidden border border-white/5 bg-slate-900/60 hover:border-red-500/30 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-0.5"
  >
    {/* Thumbnail */}
    <div className="relative aspect-video overflow-hidden bg-slate-800">
      <img
        src={stream.thumbnail}
        alt={stream.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      {stream.duration && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded-sm font-semibold">
          {stream.duration}
        </span>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
        <div className="w-11 h-11 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 bg-red-600 transition-all duration-300 text-white shadow-lg">
          <PlayIcon />
        </div>
      </div>
    </div>

    {/* Info */}
    <div className="p-3 flex flex-col gap-1.5 flex-1">
      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {stream.series && <SeriesBadge name={stream.series} />}
        {stream.teacher && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border bg-red-500/10 border-red-500/25 text-red-400">
            {stream.teacher}
          </span>
        )}
      </div>
      {/* Title */}
      <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
        {stream.title}
      </p>
      {/* Meta */}
      <div className="flex items-center gap-3 mt-auto pt-1 text-[11px] text-slate-500">
        {stream.views > 0 && (
          <span className="flex items-center gap-1"><EyeIcon />{formatViews(stream.views)}</span>
        )}
        <span className="flex items-center gap-1"><ClockIcon />{timeAgo(stream.publishedAt)}</span>
      </div>
    </div>
  </a>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const YoutubeStreams = () => {
  const [streams, setStreams]       = useState([]);
  const [status, setStatus]         = useState(null); // sync status
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError]           = useState(null);
  const [limit, setLimit]           = useState(12);

  const fetchStreams = useCallback(async (count) => {
    setLoading(true);
    setError(null);
    try {
      const [streamsRes, statusRes] = await Promise.all([
        youtubeAPI.getRecentStreams(count),
        youtubeAPI.getSyncStatus(),
      ]);
      setStreams(streamsRes.data.streams || []);
      setStatus(statusRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load streams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStreams(limit); }, [limit, fetchStreams]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await youtubeAPI.triggerSync();
      setSyncResult({ type: 'success', ...res.data });
      await fetchStreams(limit);
    } catch (err) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-500">
            <YoutubeIcon />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-heading leading-tight">Recent Live Streams</h2>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              @Striverseducation
              {status && (
                <>
                  <span className="text-slate-700">·</span>
                  <DBIcon />
                  <span>{status.totalVideos} in DB</span>
                  {status.lastSynced && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span>synced {timeAgo(status.lastSynced)}</span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-xs bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500/40 cursor-pointer"
          >
            <option value={6}>Last 6</option>
            <option value={12}>Last 12</option>
            <option value={24}>Last 24</option>
          </select>

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              syncing
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-not-allowed'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300'
            }`}
          >
            <SyncIcon spin={syncing} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>

          <a
            href="https://www.youtube.com/@Striverseducation/streams"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-600/20 hover:text-red-300 transition-all"
          >
            <YoutubeIcon />
            Channel
          </a>
        </div>
      </div>

      {/* Sync result toast */}
      {syncResult && (
        <div className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border text-sm ${
          syncResult.type === 'success'
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
        }`}>
          <span>
            {syncResult.type === 'success'
              ? `✅ Sync done — ${syncResult.created} new, ${syncResult.updated} updated, ${syncResult.teachersAffected} teachers`
              : `❌ ${syncResult.message}`}
          </span>
          <button onClick={() => setSyncResult(null)} className="text-slate-500 hover:text-white shrink-0">✕</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-white/5 bg-slate-900/60 animate-pulse">
              <div className="aspect-video bg-slate-800" />
              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-700 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400"><YoutubeIcon /></div>
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={() => fetchStreams(limit)} className="px-4 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-300 text-xs hover:bg-slate-700 transition-colors">Retry</button>
        </div>
      ) : streams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center border border-dashed border-white/10 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400"><SyncIcon spin={false} /></div>
          <div>
            <p className="text-white font-semibold text-sm">No videos in database yet</p>
            <p className="text-slate-500 text-xs mt-1">Click <strong className="text-slate-300">Sync Now</strong> to import all streams from YouTube.</p>
          </div>
          <button onClick={handleSync} disabled={syncing} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-2">
            <SyncIcon spin={syncing} />
            {syncing ? 'Syncing…' : 'Run Initial Sync'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream.videoId} stream={stream} />
          ))}
        </div>
      )}

      {!loading && !error && streams.length > 0 && (
        <p className="text-[10px] text-slate-600 text-right">
          {status?.source === 'database' ? '📦 Served from database' : '🌐 Live from YouTube API'} · View counts refresh daily at 2:00 AM IST
        </p>
      )}
    </div>
  );
};

export default YoutubeStreams;
