import { useEffect, useState } from 'react';
import { youtubeAPI } from '../../services';

const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatViews = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

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
      {/* Duration badge */}
      {stream.duration && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded-sm font-semibold tracking-wide">
          {stream.duration}
        </span>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
        <div className="w-11 h-11 rounded-full bg-red-600/0 group-hover:bg-red-600 flex items-center justify-center scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300 text-white shadow-lg">
          <PlayIcon />
        </div>
      </div>
    </div>

    {/* Info */}
    <div className="p-3 flex flex-col gap-1.5 flex-1">
      {/* Teacher badge */}
      {stream.teacher && (
        <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold tracking-wide">
          {stream.teacher}
        </span>
      )}

      {/* Title */}
      <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
        {stream.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-auto pt-1 text-[11px] text-slate-500">
        {stream.views > 0 && (
          <span className="flex items-center gap-1">
            <EyeIcon />
            {formatViews(stream.views)} views
          </span>
        )}
        <span className="flex items-center gap-1">
          <ClockIcon />
          {formatDate(stream.publishedAt)}
        </span>
      </div>
    </div>
  </a>
);

const YoutubeStreams = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(12);

  const fetchStreams = async (count) => {
    setLoading(true);
    setError(null);
    try {
      const res = await youtubeAPI.getRecentStreams(count);
      setStreams(res.data.streams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load streams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams(limit);
  }, [limit]);

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
            <p className="text-[11px] text-slate-500">@Striverseducation YouTube Channel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Limit picker */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-xs bg-slate-800 border border-white/10 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500/40 cursor-pointer"
          >
            <option value={6}>Last 6</option>
            <option value={12}>Last 12</option>
            <option value={20}>Last 20</option>
          </select>

          <a
            href="https://www.youtube.com/@Striverseducation/streams"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-600/20 hover:text-red-300 transition-all"
          >
            <YoutubeIcon />
            View Channel
          </a>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: limit > 12 ? 8 : 6 }).map((_, i) => (
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
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <YoutubeIcon />
          </div>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={() => fetchStreams(limit)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : streams.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500 text-sm">No recent streams found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream.videoId} stream={stream} />
          ))}
        </div>
      )}

      {/* Footer note */}
      {!loading && !error && streams.length > 0 && (
        <p className="text-[10px] text-slate-600 text-right">
          Powered by YouTube Data API v3 · Live data
        </p>
      )}
    </div>
  );
};

export default YoutubeStreams;
