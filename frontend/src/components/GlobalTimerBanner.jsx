import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { timeLogAPI } from '../services';

/**
 * GlobalTimerBanner
 * Polls /timelogs/active every 10 seconds.
 * Shows a sticky banner at the top of the page if a timer is running — it ticks live.
 * Persists across page navigation because it lives in Layout, outside the route tree.
 */
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
      // silently fail — user might not be logged in yet
    }
  }, [startTick]);

  useEffect(() => {
    fetchActive();
    // Re-poll every 15s so if the timer is stopped from another tab it reflects
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
    <div className="bg-violet-600 text-white px-6 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <span className="animate-pulse text-base">⏱️</span>
        <span>
          Timer running on{' '}
          <Link
            to={`/tasks/${activeTimer.task?._id}`}
            className="font-semibold underline hover:text-violet-200 transition-colors"
          >
            {activeTimer.task?.title || 'a task'}
          </Link>
        </span>
      </div>
      <span className="font-mono font-bold text-lg tabular-nums">{fmt(elapsed)}</span>
    </div>
  );
};

export default GlobalTimerBanner;
