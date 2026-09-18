import { Movie, Series, User, Comment, WatchHistoryItem, FavoriteItem, NotificationItem, SubscriptionPlan, AdminAnalytics } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('cinesphere_token');
}

export function getCurrentUser(): User | null {
  const str = localStorage.getItem('cinesphere_user');
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export function saveSession(token: string, user: User) {
  localStorage.setItem('cinesphere_token', token);
  localStorage.setItem('cinesphere_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('cinesphere_token');
  localStorage.removeItem('cinesphere_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from server'
  }));

  if (!response.ok) {
    throw new Error(data.message || `API error ${response.status}`);
  }

  return data;
}

export const apiClient = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (userData: { name: string; email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getMe: () => request<{ success: boolean; user: User }>('/auth/me'),

  updateProfile: (data: { name?: string; profileImage?: string }) =>
    request<{ success: boolean; message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Movies
  getMovies: (params: { genre?: string; search?: string; year?: string; sort?: string; limit?: number; featured?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.genre && params.genre !== 'All') q.set('genre', params.genre);
    if (params.search) q.set('search', params.search);
    if (params.year) q.set('year', params.year);
    if (params.sort) q.set('sort', params.sort);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.featured !== undefined) q.set('featured', String(params.featured));
    const queryStr = q.toString();
    return request<{ success: boolean; count: number; genres: string[]; movies: Movie[] }>(`/movies${queryStr ? '?' + queryStr : ''}`);
  },

  getMovieById: (id: string) => request<{ success: boolean; movie: Movie }>(`/movies/${id}`),

  createMovie: (movieData: Partial<Movie>) =>
    request<{ success: boolean; message: string; movie: Movie }>('/movies', {
      method: 'POST',
      body: JSON.stringify(movieData)
    }),

  updateMovie: (id: string, movieData: Partial<Movie>) =>
    request<{ success: boolean; message: string; movie: Movie }>(`/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData)
    }),

  deleteMovie: (id: string) =>
    request<{ success: boolean; message: string }>(`/movies/${id}`, {
      method: 'DELETE'
    }),

  // Series
  getSeries: () => request<{ success: boolean; count: number; series: Series[] }>('/series'),
  getSeriesById: (id: string) => request<{ success: boolean; series: Series }>(`/series/${id}`),

  // Comments
  getComments: (movieId: string) =>
    request<{ success: boolean; count: number; comments: Comment[] }>(`/comments/${movieId}`),

  addComment: (movieId: string, text: string) =>
    request<{ success: boolean; message: string; comment: Comment }>('/comments', {
      method: 'POST',
      body: JSON.stringify({ movieId, text })
    }),

  likeComment: (id: string) =>
    request<{ success: boolean; likes: string[]; likeCount: number }>(`/comments/${id}/like`, {
      method: 'POST'
    }),

  replyComment: (id: string, text: string) =>
    request<{ success: boolean; message: string; comment: Comment }>(`/comments/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  reportComment: (id: string) =>
    request<{ success: boolean; message: string }>(`/comments/${id}/report`, {
      method: 'POST'
    }),

  deleteComment: (id: string) =>
    request<{ success: boolean; message: string }>(`/comments/${id}`, {
      method: 'DELETE'
    }),

  // Watch History
  getHistory: () =>
    request<{ success: boolean; count: number; history: WatchHistoryItem[] }>('/history'),

  saveProgress: (data: { contentId: string; contentType?: string; episode?: number; progress: number; duration: number }) =>
    request<{ success: boolean; message: string; record: WatchHistoryItem }>('/history', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteHistoryItem: (id: string) =>
    request<{ success: boolean; message: string }>(`/history/${id}`, {
      method: 'DELETE'
    }),

  clearHistory: () =>
    request<{ success: boolean; message: string }>('/history', {
      method: 'DELETE'
    }),

  // Favorites / My List
  getFavorites: () =>
    request<{ success: boolean; count: number; favorites: FavoriteItem[] }>('/favorites'),

  toggleFavorite: (contentId: string, contentType = 'movie') =>
    request<{ success: boolean; action: 'added' | 'removed'; message: string }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ contentId, contentType })
    }),

  removeFavorite: (id: string) =>
    request<{ success: boolean; message: string }>(`/favorites/${id}`, {
      method: 'DELETE'
    }),

  // Subscriptions
  getPlans: () =>
    request<{ success: boolean; plans: SubscriptionPlan[] }>('/subscriptions/plans'),

  upgradePlan: (planId: string) =>
    request<{ success: boolean; message: string; subscription: User['subscription']; user: User }>('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId })
    }),

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; count: number; notifications: NotificationItem[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean; notification: NotificationItem }>(`/notifications/${id}/read`, {
      method: 'PUT'
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT'
    }),

  // Admin APIs
  getAdminUsers: (params: { search?: string; role?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.role) q.set('role', params.role);
    if (params.status) q.set('status', params.status);
    const qs = q.toString();
    return request<{ success: boolean; count: number; users: User[] }>(`/admin/users${qs ? '?' + qs : ''}`);
  },

  updateUserStatus: (id: string, status: 'active' | 'suspended') =>
    request<{ success: boolean; message: string; user: User }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  updateUserRole: (id: string, role: 'user' | 'admin') =>
    request<{ success: boolean; message: string; user: User }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/users/${id}`, {
      method: 'DELETE'
    }),

  getAnalytics: () => request<AdminAnalytics & { success: boolean }>('/admin/analytics'),

  getAdminComments: (params: { reportedOnly?: boolean } = {}) => {
    const q = params.reportedOnly ? '?reportedOnly=true' : '';
    return request<{ success: boolean; count: number; comments: Comment[] }>(`/admin/comments${q}`);
  },

  moderateComment: (id: string, data: { hidden?: boolean; reported?: boolean; deleteAction?: boolean }) =>
    request<{ success: boolean; message: string; comment?: Comment }>(`/admin/comments/${id}/moderate`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getLiveActivity: () =>
    request<{ success: boolean; activeViewersCount: number; activeViewers: any[] }>('/admin/live-activity'),

  // Requirement 12: Admin Login Activity from MongoDB
  getAdminLoginActivity: (limit: number = 100) =>
    request<{ success: boolean; count: number; activities: any[] }>(`/admin/login-activity?limit=${limit}`),

  // Requirement 8: Database Health endpoint
  getHealth: () =>
    request<{
      success: boolean;
      database: string;
      databaseName?: string;
      engine?: string;
      atlasConnected?: boolean;
      atlasError?: string | null;
      timestamp?: string;
    }>('/health')
};
