import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  getEmployees: () => api.get('/auth/employees'),
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
  getTasksCompletedPerEmployee: (params) => api.get('/dashboard/tasks-completed', { params }),
  getEmployeesSummary: () => api.get('/dashboard/employees-summary'),
};

export default api;