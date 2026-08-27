import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services';

const Settings = () => {
  const { user, updateUser } = useAuth();
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

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
      // 1. Upload to Cloudinary
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

      // 2. Update backend profile
      const updateRes = await authAPI.updateProfile({ profilePicture: secureUrl });
      
      // 3. Update local context
      updateUser(updateRes.data.user);
      
      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      e.target.value = ''; // Reset input
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight font-heading leading-tight mb-1">
          Profile Settings
        </h1>
        <p className="text-xs text-slate-400">Manage your account and personalization preferences.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-2xl flex items-center gap-3">
          <span className="font-mono font-bold">[!:]</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-2xl flex items-center gap-3">
          <span className="font-mono font-bold">[OK]</span>
          <span>{success}</span>
        </div>
      )}

      <div className="card space-y-8">
        <h2 className="text-lg font-bold text-white font-heading border-b border-white/5 pb-4">Personal Information</h2>
        
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl relative bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                
                {/* Upload Overlay */}
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
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold max-w-[120px]">
              Click avatar to change picture
            </p>
          </div>

          {/* Details Section */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-300 text-sm">
                {user?.name}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-300 text-sm">
                {user?.email}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Role &amp; Permissions
              </label>
              <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-glow" />
                <span className="text-indigo-400 text-sm uppercase tracking-wider font-bold">
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
