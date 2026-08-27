import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// --- Simple Frontend Caching Layer ---
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

const originalGet = api.get;
api.get = async (url, config = {}) => {
  if (config.bypassCache) {
    return originalGet.call(api, url, config);
  }

  const cacheKey = url + JSON.stringify(config.params || {});
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Return cloned data so components don't accidentally mutate the cache
    return Promise.resolve(JSON.parse(JSON.stringify(cached.data)));
  }

  const response = await originalGet.call(api, url, config);
  // Clone response before caching to avoid mutation issues
  cache.set(cacheKey, { timestamp: Date.now(), data: JSON.parse(JSON.stringify(response)) });
  return response;
};

// Clear cache on any data mutation to keep it fresh
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    cache.clear();
  }
  return config;
});
// -------------------------------------

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  updateProfile: (data) => api.put('/auth/profile', data),
  getCurrentUser: () => api.get('/auth/me'),
  getEmployees: () => api.get('/auth/employees'),
  getAllUsers: () => api.get('/auth/users'),
  deleteEmployee: (id) => api.delete(`/auth/users/${id}`),
};

export const taskAPI = {
  getAllTasks: (params) => api.get('/tasks/all', { params }),
  getMyTasks: (params) => api.get('/tasks/my', { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  updateTaskStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const timeLogAPI = {
  getMyTimeLogs: (params) => api.get('/timelogs/my', { params }),
  getActiveTimer: () => api.get('/timelogs/active', { bypassCache: true }),
  getTaskTimeLogs: (taskId) => api.get(`/timelogs/task/${taskId}`),
  getAllTimeLogs: (params) => api.get('/timelogs/all', { params }),
  createManualEntry: (data) => api.post('/timelogs/manual', data),
  startTimer: (taskId) => api.post('/timelogs/timer/start', { taskId }),
  stopTimer: (id, data) => api.patch(`/timelogs/timer/${id}/stop`, data),
};

export const dashboardAPI = {
  getStatistics: () => api.get('/dashboard/statistics'),
  getHoursPerEmployee: (params) => api.get('/dashboard/hours-per-employee', { params }),
  getTaskStatusBreakdown: (params) => api.get('/dashboard/task-status', { params }),
  getTimeTrend: (params) => api.get('/dashboard/time-trend', { params }),
  getEmployeeTimeTrend: (params) => api.get('/dashboard/employee-time-trend', { params }),
  getTasksCompletedPerEmployee: (params) => api.get('/dashboard/tasks-completed', { params }),
  getEmployeesSummary: () => api.get('/dashboard/employees-summary'),
  getQuizLogs: () => api.get('/dashboard/quiz-logs'),
};

export const youtubeAPI = {
  getRecentStreams:  (limit = 12) => api.get('/youtube/streams', { params: { limit }, bypassCache: true }),
  getSyncStatus:     ()           => api.get('/youtube/sync-status', { bypassCache: true }),
  getTeachers:       ()           => api.get('/youtube/teachers', { bypassCache: true }),
  getSeries:         ()           => api.get('/youtube/series', { bypassCache: true }),
  triggerSync:       ()           => api.post('/youtube/sync'),
  refreshViews:      ()           => api.post('/youtube/refresh-views'),
};

export default api;