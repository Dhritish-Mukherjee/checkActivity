import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = false, size = 'default' }) => {
  const { isDark, toggleTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = (e) => {
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 500);
    toggleTheme(e);
  };

  const isSmall = size === 'sm';
  const buttonSizeClasses = isSmall ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = isSmall ? 16 : 18;

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isDark ? 'Switch to light mode (Shift+D)' : 'Switch to dark mode (Shift+D)'}
        title={isDark ? 'Switch to light mode (Shift+D)' : 'Switch to dark mode (Shift+D)'}
        role="switch"
        aria-checked={isDark}
        className={`relative ${buttonSizeClasses} rounded-xl border flex items-center justify-center overflow-hidden cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: isDark ? 'rgba(129, 140, 248, 0.25)' : 'rgba(245, 158, 11, 0.3)',
          boxShadow: isDark
            ? '0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 10px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {/* Hover ambient aura */}
        <div
          className={`absolute inset-0 rounded-xl blur-xs pointer-events-none transition-opacity duration-300 ${
            isHovered ? 'opacity-30' : 'opacity-10'
          } ${isDark ? 'bg-indigo-500' : 'bg-amber-400'}`}
        />

        {/* Click ripple burst */}
        <AnimatePresence>
          {isRippling && (
            <motion.span
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`absolute inset-0 rounded-full pointer-events-none ${
                isDark ? 'bg-indigo-400/30' : 'bg-amber-400/30'
              }`}
            />
          )}
        </AnimatePresence>

        {/* Animated Sun / Moon Icon Container */}
        <div className="relative z-10 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              /* Sun Icon for Dark Mode (click to go to light) */
              <motion.div
                key="sun-icon"
                initial={{ rotate: -80, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 80, scale: 0.6, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                className="relative flex items-center justify-center"
              >
                <svg
                  width={iconSize}
                  height={iconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                >
                  <circle cx="12" cy="12" r="4.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
                  <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2.2" />
                  <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2.2" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2.2" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2.2" />
                  <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2.2" />
                  <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2.2" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2.2" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2.2" />
                </svg>
              </motion.div>
            ) : (
              /* Moon Icon for Light Mode (click to go to dark) */
              <motion.div
                key="moon-icon"
                initial={{ rotate: 80, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -80, scale: 0.6, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                className="relative flex items-center justify-center"
              >
                <svg
                  width={iconSize}
                  height={iconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-indigo-500 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]"
                >
                  <path
                    d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
                    fill="currentColor"
                    fillOpacity="0.25"
                    stroke="currentColor"
                  />
                  <circle cx="19" cy="5" r="1.2" fill="currentColor" />
                  <circle cx="15" cy="2" r="0.9" fill="currentColor" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {showLabel && (
        <span
          className="text-xs font-semibold select-none cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          onClick={handleClick}
        >
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
