import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    // Default to dark (matches the existing design)
    return true;
  });

  // Ensure DOM class and localStorage are properly synced on mount / change
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Smooth View Transition helper
  const triggerTransition = useCallback((nextState, event) => {
    // Check if View Transitions API is supported and user hasn't reduced motion
    const canTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!canTransition) {
      setIsDark(nextState);
      return;
    }

    // Determine the origin coordinates of the circular ripple
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (event) {
      if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
        x = event.clientX;
        y = event.clientY;
      } else if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    // Furthest corner distance
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);
    root.style.setProperty('--theme-r', `${endRadius}px`);
    root.classList.add('is-theme-transitioning');

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsDark(nextState);
        root.classList.toggle('dark', nextState);
        localStorage.setItem('theme', nextState ? 'dark' : 'light');
      });
    });

    transition.finished.finally(() => {
      root.classList.remove('is-theme-transitioning');
    });
  }, []);

  const toggleTheme = useCallback((event) => {
    triggerTransition(!isDark, event);
  }, [isDark, triggerTransition]);

  const setTheme = useCallback((themeName, event) => {
    const nextDark = themeName === 'dark';
    if (nextDark === isDark) return;
    triggerTransition(nextDark, event);
  }, [isDark, triggerTransition]);

  // Global keyboard shortcut: Shift+D or Alt+T to toggle theme
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if ((e.shiftKey && (e.key === 'D' || e.key === 'd')) || (e.altKey && (e.key === 't' || e.key === 'T'))) {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  return (
    <ThemeContext.Provider value={{ isDark, theme: isDark ? 'dark' : 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
