/**
 * CineSphere Core API Client
 * Automatically handles JWT token attachments, JSON serialization, and response normalization.
 */

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('cinesphere_token') || null;
}

export function getCurrentUser() {
  const str = localStorage.getItem('cinesphere_user');
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem('cinesphere_token', token);
  localStorage.setItem('cinesphere_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('cinesphere_token');
  localStorage.removeItem('cinesphere_user');
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid JSON response from server'
  }));

  if (!response.ok) {
    if (response.status === 401) {
      // Session expired or unauthorized
      console.warn('Session expired or unauthorized');
    }
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Movies & Content API
export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: data }),
  changePassword: (data) => request('/auth/change-password', { method: 'PUT', body: data }),

  // Movies
  getMovies: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/movies${query ? '?' + query : ''}`);
  },
  getMovieById: (id) => request(`/movies/${id}`),

  // Series
  getSeries: () => request('/series'),
  getSeriesById: (id) => request(`/series/${id}`),

  // Comments
  getComments: (movieId) => request(`/comments/${movieId}`),
  addComment: (movieId, text) => request('/comments', { method: 'POST', body: { movieId, text } }),
  likeComment: (id) => request(`/comments/${id}/like`, { method: 'POST' }),
  replyComment: (id, text) => request(`/comments/${id}/reply`, { method: 'POST', body: { text } }),
  reportComment: (id) => request(`/comments/${id}/report`, { method: 'POST' }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),

  // Watch History
  getHistory: () => request('/history'),
  saveProgress: (data) => request('/history', { method: 'POST', body: data }),
  deleteHistoryItem: (id) => request(`/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => request('/history', { method: 'DELETE' }),

  // Favorites / My List
  getFavorites: () => request('/favorites'),
  toggleFavorite: (contentId, contentType = 'movie') => request('/favorites', { method: 'POST', body: { contentId, contentType } }),
  removeFavorite: (id) => request(`/favorites/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getPlans: () => request('/subscriptions/plans'),
  createCheckoutSession: (planId) => request('/subscriptions/checkout-session', { method: 'POST', body: { planId } }),
  upgradePlan: (planId) => request('/subscriptions/upgrade', { method: 'POST', body: { planId } }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Admin APIs
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users${query ? '?' + query : ''}`);
  },
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PUT', body: { status } }),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getAnalytics: () => request('/admin/analytics'),
  getAdminComments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/comments${query ? '?' + query : ''}`);
  },
  moderateComment: (id, data) => request(`/admin/comments/${id}/moderate`, { method: 'PUT', body: data }),
  getLiveActivity: () => request('/admin/live-activity'),

  // Movie Management
  createMovie: (movieData) => request('/movies', { method: 'POST', body: movieData }),
  updateMovie: (id, movieData) => request(`/movies/${id}`, { method: 'PUT', body: movieData }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: 'DELETE' }),
};

export default api;
