import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { authAPI } from '../services';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const cloudName = 'ddhhqxnbm';
  const uploadPreset = 'Strivers';

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const cloudinaryResponse = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload to Cloudinary failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      const secureUrl = cloudinaryResponse.secure_url;
      const updateRes = await authAPI.updateProfile({ profilePicture: secureUrl });
      updateUser(updateRes.data.user);
      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight font-heading leading-tight mb-1" style={{ color: 'var(--text-heading)' }}>
          Profile & Preferences
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage your account, visual themes, and personalization settings.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-sm rounded-2xl flex items-center gap-3">
          <span className="font-mono font-bold">[!:]</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-2xl flex items-center gap-3">
          <span className="font-mono font-bold">[OK]</span>
          <span>{success}</span>
        </div>
      )}

      {/* Appearance & Theme Section */}
      <div className="card space-y-6">
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="text-lg font-bold font-heading" style={{ color: 'var(--text-heading)' }}>
              Appearance &amp; Theme
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Customize your workspace look and feel. Transitions animate dynamically.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Theme Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => setTheme('light', e)}
            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              !isDark
                ? 'border-amber-500/80 shadow-lg shadow-amber-500/10 bg-amber-500/5'
                : 'border-white/10 hover:border-white/20'
            }`}
            style={{ backgroundColor: !isDark ? undefined : 'var(--bg-subtle)' }}
          >
            {/* Active radio indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">☀️</span>
                <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>Light Mode</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                !isDark ? 'border-amber-500 bg-amber-500' : 'border-slate-500 bg-transparent'
              }`}>
                {!isDark && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                )}
              </div>
            </div>

            {/* Mock Light Preview */}
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 p-2.5 space-y-2 select-none pointer-events-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div className="h-2 w-16 bg-indigo-500 rounded-full" />
                <div className="h-2 w-2 bg-amber-400 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="h-7 bg-white rounded-lg shadow-xs border border-slate-200/80 p-1 flex flex-col justify-center">
                  <div className="h-1.5 w-6 bg-slate-300 rounded mb-1" />
                  <div className="h-2 w-8 bg-slate-800 rounded" />
                </div>
                <div className="h-7 bg-white rounded-lg shadow-xs border border-slate-200/80 p-1 flex flex-col justify-center">
                  <div className="h-1.5 w-6 bg-slate-300 rounded mb-1" />
                  <div className="h-2 w-8 bg-indigo-500 rounded" />
                </div>
                <div className="h-7 bg-white rounded-lg shadow-xs border border-slate-200/80 p-1 flex flex-col justify-center">
                  <div className="h-1.5 w-6 bg-slate-300 rounded mb-1" />
                  <div className="h-2 w-8 bg-emerald-500 rounded" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dark Theme Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => setTheme('dark', e)}
            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              isDark
                ? 'border-indigo-500/80 shadow-lg shadow-indigo-500/15 bg-indigo-500/5'
                : 'border-black/10 hover:border-black/20'
            }`}
            style={{ backgroundColor: isDark ? undefined : 'var(--bg-subtle)' }}
          >
            {/* Active radio indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌙</span>
                <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>Dark Mode</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                isDark ? 'border-indigo-500 bg-indigo-500' : 'border-slate-400 bg-transparent'
              }`}>
                {isDark && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                )}
              </div>
            </div>

            {/* Mock Dark Preview */}
            <div className="rounded-xl overflow-hidden border border-slate-700/80 shadow-sm bg-slate-900 p-2.5 space-y-2 select-none pointer-events-none">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="h-2 w-16 bg-indigo-400 rounded-full" />
                <div className="h-2 w-2 bg-indigo-400 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="h-7 bg-slate-800/90 rounded-lg border border-slate-700/60 p-1 flex flex-col justify-center">
                  <div className="h-1.5 w-6 bg-slate-500 rounded mb-1" />
                  <div className="h-2 w-8 bg-slate-200 rounded" />
                </div>
                <div className="h-7 bg-slate-800/90 rounded-lg border border-slate-700/60 p-1 flex flex-col justify-center">
                  <div className="h-1.5 w-6 bg-slate-500 rounded mb-1" />
                  <div className="h-2 w-8 bg-indigo-400 rounded" />
                </div>
                <div className="h-7 bg-slate-800/90 rounded-lg border border-slate-700/60 p-1 flex flex-col justify-center">
                  <div className="h-1.5 w-6 bg-slate-500 rounded mb-1" />
                  <div className="h-2 w-8 bg-emerald-400 rounded" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
          <span className="font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px]">
            Shift + D
          </span>
          <span>or</span>
          <span className="font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px]">
            Alt + T
          </span>
          <span>switches theme instantly with circular reveal animation.</span>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="card space-y-8">
        <h2 className="text-lg font-bold font-heading pb-4" style={{ color: 'var(--text-heading)', borderBottom: '1px solid var(--border-subtle)' }}>
          Personal Information
        </h2>

        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 shadow-2xl relative bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white" style={{ borderColor: 'var(--border-base)' }}>
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                <label className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {loading ? (
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs font-bold text-white">{uploadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl mb-1">📸</span>
                      <span className="text-xs font-bold text-white tracking-wider uppercase">Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
            <p className="text-[10px] text-center uppercase tracking-wider font-semibold max-w-[120px]" style={{ color: 'var(--text-faint)' }}>
              Click avatar to change picture
            </p>
          </div>

          {/* Details Section */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Full Name
              </label>
              <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-base)' }}>
                {user?.name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-base)' }}>
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Role &amp; Permissions
              </label>
              <div className="px-4 py-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse-glow" />
                <span className="text-indigo-600 dark:text-indigo-400 text-sm uppercase tracking-wider font-bold">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

