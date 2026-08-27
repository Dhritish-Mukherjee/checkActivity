import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { timeLogAPI } from '../services';

const GlobalTimerBanner = () => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef(null);
  const pollRef = useRef(null);

  const startTick = useCallback((timer) => {
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000));
    }, 1000);
    setElapsed(Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000));
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const res = await timeLogAPI.getActiveTimer();
      const timer = res.data.activeTimer;
      if (timer) {
        setActiveTimer(timer);
        startTick(timer);
      } else {
        setActiveTimer(null);
        clearInterval(tickRef.current);
        setElapsed(0);
      }
    } catch {
      // silently ignore unauthenticated
    }
  }, [startTick]);

  useEffect(() => {
    fetchActive();
    pollRef.current = setInterval(fetchActive, 15000);
    return () => {
      clearInterval(tickRef.current);
      clearInterval(pollRef.current);
    };
  }, [fetchActive]);

  const fmt = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  if (!activeTimer) return null;

  return (
    <div className="bg-gradient-to-r from-violet-900/90 via-indigo-900/90 to-purple-900/90 border-b border-indigo-500/30 text-white px-8 py-3 flex items-center justify-between shadow-xl shadow-indigo-950/50 backdrop-blur-md relative z-30 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-sweep pointer-events-none" />
      <div className="flex items-center gap-3.5 relative z-10">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75 shadow-[0_0_10px_#c084fc]"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
        </span>
        <span className="text-sm font-medium text-slate-200">
          Timer running for task:{' '}
          <Link
            to={`/tasks/${activeTimer.task?._id}`}
            className="font-bold text-white underline hover:text-indigo-300 transition-colors ml-1"
          >
            {activeTimer.task?.title || 'Current Task'}
          </Link>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-xl font-black text-violet-200 tracking-wider bg-slate-950/60 px-4 py-1 rounded-xl border border-violet-500/30 shadow-inner">
          {fmt(elapsed)}
        </span>
        <Link
          to={`/tasks/${activeTimer.task?._id}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-500/30"
        >
          View &amp; Stop
        </Link>
      </div>
    </div>
  );
};

export default GlobalTimerBanner;
