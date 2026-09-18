import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Film,
  MessageSquare,
  Activity,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Clock,
  Radio,
  Star,
  TrendingUp,
  X,
  Lock,
  LogIn,
  ArrowLeft,
  Database,
  Smartphone,
  Laptop,
  Globe
} from 'lucide-react';
import { User, Movie, Comment, AdminAnalytics, LiveViewer, LoginActivityItem } from '../types';
import { apiClient, saveSession } from '../services/api';
import { getSocket, joinAdminRoom } from '../services/socket';

interface AdminPanelProps {
  currentUser: User | null;
  onClose: () => void;
  onRefreshMovies: () => void;
  onAuthSuccess?: (user: User) => void;
  onOpenAuth?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onClose,
  onRefreshMovies,
  onAuthSuccess,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'live' | 'users' | 'activity' | 'content' | 'comments'>('analytics');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivityItem[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liveViewers, setLiveViewers] = useState<LiveViewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // New Movie Form Modal State
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    poster: '',
    backdrop: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    genres: 'Sci-Fi, Action',
    director: '',
    cast: '',
    releaseYear: 2025,
    duration: 120,
    rating: 8.5
  });

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleQuickAdminLogin = async () => {
    try {
      setAuthLoading(true);
      const res = await apiClient.login({
        email: 'admin@cinesphere.tv',
        password: 'AdminPassword123!'
      });
      saveSession(res.token, res.user);
      if (onAuthSuccess) {
        onAuthSuccess(res.user);
      }
      showToast('Authenticated as Administrator');
    } catch (err: any) {
      showToast(err.message || 'Admin authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadData = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      return;
    }
    try {
      setLoading(true);
      const [analyticsRes, usersRes, moviesRes, commentsRes, activityRes] = await Promise.all([
        apiClient.getAnalytics().catch(err => {
          console.warn('Telemetry request deferred:', err?.message || err);
          return { success: false } as any;
        }),
        apiClient.getAdminUsers().catch(err => {
          console.warn('Users request deferred:', err?.message || err);
          return { success: false, users: [] } as any;
        }),
        apiClient.getMovies({ limit: 100 }).catch(err => {
          console.warn('Movies request deferred:', err?.message || err);
          return { success: false, movies: [] } as any;
        }),
        apiClient.getAdminComments({ reportedOnly }).catch(err => {
          console.warn('Comments request deferred:', err?.message || err);
          return { success: false, comments: [] } as any;
        }),
        apiClient.getAdminLoginActivity(100).catch(err => {
          console.warn('Login activity deferred:', err?.message || err);
          return { success: false, activities: [] } as any;
        })
      ]);

      if (analyticsRes?.success && analyticsRes.stats) setAnalytics(analyticsRes);
      if (usersRes?.success && usersRes.users) setUsers(usersRes.users || []);
      if (moviesRes?.success && moviesRes.movies) setMovies(moviesRes.movies || []);
      if (commentsRes?.success && commentsRes.comments) setComments(commentsRes.comments || []);
      if (activityRes?.success && activityRes.activities) setLoginActivities(activityRes.activities || []);
    } catch (err: any) {
      console.warn('Admin data load warning:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      return;
    }

    loadData();

    // Socket.io Real-Time Live Monitoring Connection
    const socket = getSocket();
    joinAdminRoom();

    const handleLiveMonitoring = (data: { count: number; viewers: LiveViewer[] }) => {
      setLiveViewers(data.viewers || []);
    };

    socket.on('live_monitoring_update', handleLiveMonitoring);

    return () => {
      socket.off('live_monitoring_update', handleLiveMonitoring);
    };
  }, [currentUser?.role, currentUser?._id, reportedOnly]);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await apiClient.updateUserStatus(userId, nextStatus as any);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: nextStatus as any } : u));
      showToast(`User status changed to ${nextStatus}.`);
    } catch (err: any) {
      showToast(err.message || 'Status update failed');
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const nextRole = currentRole === 'admin' ? 'user' : 'admin';
      await apiClient.updateUserRole(userId, nextRole as any);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: nextRole as any } : u));
      showToast(`User role updated to ${nextRole}.`);
    } catch (err: any) {
      showToast(err.message || 'Role update failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await apiClient.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      showToast('User account permanently deleted.');
    } catch (err: any) {
      showToast(err.message || 'Deletion failed');
    }
  };

  const handleModerateComment = async (commentId: string, action: 'hide' | 'unhide' | 'dismissReport' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Delete this comment from community discussions?')) return;
        await apiClient.moderateComment(commentId, { deleteAction: true });
        setComments(prev => prev.filter(c => c._id !== commentId));
        showToast('Comment deleted by administrator.');
      } else if (action === 'hide') {
        await apiClient.moderateComment(commentId, { hidden: true });
        setComments(prev => prev.map(c => c._id === commentId ? { ...c, hidden: true } : c));
        showToast('Comment hidden from public view.');
      } else if (action === 'unhide') {
        await apiClient.moderateComment(commentId, { hidden: false });
        setComments(prev => prev.map(c => c._id === commentId ? { ...c, hidden: false } : c));
        showToast('Comment restored.');
      } else if (action === 'dismissReport') {
        await apiClient.moderateComment(commentId, { reported: false });
        setComments(prev => prev.map(c => c._id === commentId ? { ...c, reported: false } : c));
        showToast('Report dismissed.');
      }
    } catch (err: any) {
      showToast(err.message || 'Moderation action failed');
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!window.confirm('Delete this movie title from platform catalog?')) return;
    try {
      await apiClient.deleteMovie(movieId);
      setMovies(prev => prev.filter(m => m._id !== movieId));
      onRefreshMovies();
      showToast('Movie deleted from catalog.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete movie');
    }
  };

  const handleAddMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedMovie = {
        ...newMovie,
        genres: newMovie.genres.split(',').map(s => s.trim()).filter(Boolean),
        cast: newMovie.cast.split(',').map(s => s.trim()).filter(Boolean),
        poster: newMovie.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
        backdrop: newMovie.backdrop || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&auto=format&fit=crop&q=80',
        releaseYear: Number(newMovie.releaseYear),
        duration: Number(newMovie.duration),
        rating: Number(newMovie.rating),
        views: 120
      };

      const res = await apiClient.createMovie(formattedMovie as any);
      setMovies(prev => [res.movie, ...prev]);
      setShowAddMovieModal(false);
      onRefreshMovies();
      showToast('New cinema title published successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to add movie');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // RBAC Access Control Gate: Isolate admin features from unauthenticated and standard users
  if (!currentUser || currentUser.role !== 'admin') {
    const isStandardUser = Boolean(currentUser && currentUser.role !== 'admin');

    return (
      <div className="fixed inset-0 z-50 bg-[#0a0d14] flex flex-col overflow-y-auto text-white animate-fade-in">
        {/* Header */}
        <header className="h-16 px-6 bg-[#111622] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block">
                CINESPHERE <span className="text-amber-400 font-mono text-xs">OPERATIONS SUITE</span>
              </span>
              <span className="text-[10px] text-gray-400">Role-Based Access Control (RBAC)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Return to Movies"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Access Denied Container */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-md w-full bg-[#111622] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isStandardUser ? 'Administrator Privileges Required' : 'Authentication Required'}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isStandardUser
                  ? `Your account (${currentUser?.email}) has standard 'user' privileges. In accordance with strict RBAC rules, only accounts with the 'admin' role can access platform telemetry, user management, and moderation.`
                  : 'Access to system telemetry, real-time viewer sockets, and platform controls is protected by backend JWT authentication and role validation.'}
              </p>
            </div>

            {/* Account Status Badge */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Session Status:</span>
                <span className={`font-semibold ${isStandardUser ? 'text-blue-400' : 'text-gray-400'}`}>
                  {isStandardUser ? `Logged In (${currentUser?.name})` : 'Unauthenticated'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Access Level:</span>
                <span className="font-mono font-bold text-amber-400">
                  {isStandardUser ? currentUser?.role.toUpperCase() : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Required Level:</span>
                <span className="font-mono font-bold text-emerald-400">ADMIN (FULL ACCESS)</span>
              </div>
            </div>

            {/* Quick Demo Admin Login / Switch */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={authLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Shield className="w-4 h-4 text-black" />
                )}
                <span>{isStandardUser ? 'Switch to Demo Administrator' : '1-Click Sign In as Administrator'}</span>
              </button>

              {onOpenAuth && !isStandardUser && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-gray-300" />
                  <span>Custom Sign In</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-gray-400 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Cinema Catalog</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d14] flex flex-col overflow-hidden text-white animate-fade-in">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-[#111622] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="font-extrabold text-base tracking-tight text-white">
              CINESPHERE <span className="text-amber-400 font-mono text-xs">OPERATIONS SUITE</span>
            </span>
          </div>
          <span className="hidden md:inline-block px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
            PROD ENVIRONMENT
          </span>
        </div>

        {/* Live Socket Status & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Socket.IO Live Monitoring: {liveViewers.length} active</span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Exit Admin Console"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-[#111622] border-r border-white/10 p-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Telemetry & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'live' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500" />
            <span>Live Stream Viewers</span>
            {liveViewers.length > 0 && (
              <span className="ml-auto px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px]">
                {liveViewers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users (MongoDB) ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'activity' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Login Activity ({loginActivities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'content' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Content Catalog ({movies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'comments' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discussion Moderation</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
          {message && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl animate-fade-in">
              {message}
            </div>
          )}

          {/* TAB 1: ANALYTICS & TELEMETRY */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">Platform Health & Growth Analytics</h2>
                <p className="text-xs text-gray-400">Aggregated database engagement and watch history statistics</p>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#182032] border border-white/10 space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Registered</span>
                  <div className="text-3xl font-black text-white">{analytics?.stats.totalUsers || users.length}</div>
                  <span className="text-[11px] text-emerald-400 font-medium">↑ Community members</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#182032] border border-white/10 space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Catalog Titles</span>
                  <div className="text-3xl font-black text-white">{analytics?.stats.totalMovies || movies.length}</div>
                  <span className="text-[11px] text-red-400 font-medium">4K HDR Streams</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#182032] border border-white/10 space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Watch Time</span>
                  <div className="text-3xl font-black text-amber-400">{analytics?.stats.totalWatchHours || 48} hrs</div>
                  <span className="text-[11px] text-gray-400 font-medium">Viewer engagement</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#182032] border border-white/10 space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Community Reviews</span>
                  <div className="text-3xl font-black text-white">{analytics?.stats.totalComments || comments.length}</div>
                  <span className="text-[11px] text-blue-400 font-medium">Active discussions</span>
                </div>
              </div>

              {/* Charts Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Trend Bar Graph */}
                <div className="p-5 rounded-2xl bg-[#182032] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Weekly Registration & Activity Trend</span>
                    </h3>
                    <span className="text-[11px] text-gray-400">Past 7 Days</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {analytics?.charts.registrationTrend.map((d) => (
                      <div key={d.day} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-300">
                          <span className="font-semibold">{d.day}</span>
                          <span>{d.activeUsers} active viewers • {d.registrations} new accounts</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 rounded-full h-full"
                            style={{ width: `${(d.activeUsers / 130) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Watched Content */}
                <div className="p-5 rounded-2xl bg-[#182032] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-red-500" />
                      <span>Most Streamed Cinema Titles</span>
                    </h3>
                    <span className="text-[11px] text-gray-400">By View Count</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {analytics?.charts.mostWatched.map((m, idx) => (
                      <div key={m.title} className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded-xl text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-5 font-mono text-gray-500 font-bold">#{idx + 1}</span>
                          <span className="font-bold text-white">{m.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">{m.views.toLocaleString()} views</span>
                          <span className="text-amber-400 font-bold">★ {m.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE USER MONITORING VIA SOCKET.IO */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                    <span>Real-Time Stream Viewers</span>
                  </h2>
                  <p className="text-xs text-gray-400">Active WebSocket connections streaming or browsing CineSphere</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {liveViewers.length} Viewers Currently Online
                </span>
              </div>

              {liveViewers.length === 0 ? (
                <div className="text-center py-16 bg-[#182032] border border-dashed border-white/10 rounded-2xl space-y-2">
                  <Radio className="w-8 h-8 text-gray-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No active viewers currently</h4>
                  <p className="text-xs text-gray-500">
                    When viewers sign in or stream a movie, their session telemetry appears here in real-time.
                  </p>
                </div>
              ) : (
                <div className="bg-[#182032] border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111622] text-gray-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Current Activity</th>
                        <th className="p-3.5">Watch Progress</th>
                        <th className="p-3.5">Connected At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {liveViewers.map((viewer) => (
                        <tr key={viewer.socketId} className="hover:bg-white/[0.02]">
                          <td className="p-3.5 flex items-center gap-3">
                            <img
                              src={viewer.profileImage || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + viewer.name}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-white/10"
                            />
                            <div>
                              <span className="font-bold text-white block">{viewer.name}</span>
                              <span className="text-[10px] text-gray-400">{viewer.email}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-white/10 font-bold uppercase text-[10px]">
                              {viewer.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {viewer.watching ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                <Film className="w-3.5 h-3.5" />
                                <span>Watching: {viewer.watching}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">Browsing Catalog</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-gray-300">
                            {viewer.progressText || '—'}
                          </td>
                          <td className="p-3.5 text-gray-400">
                            {new Date(viewer.connectedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">Registered Users</h2>
                  <p className="text-xs text-gray-400">Manage account access, roles, and status</p>
                </div>

                <div className="relative w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-[#182032] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="bg-[#182032] border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111622] text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Member</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Registered</th>
                      <th className="p-3.5">Last Login (MongoDB)</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 flex items-center gap-3">
                          <img
                            src={user.profileImage}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <span className="font-bold text-white block">{user.name}</span>
                            <span className="text-[10px] text-gray-400">{user.email}</span>
                            <span className="text-[9px] font-mono text-gray-500 block truncate max-w-[160px]" title={user._id}>
                              ID: {user._id}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleUserRole(user._id, user.role)}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold uppercase text-[10px] transition-colors"
                            title="Click to toggle role"
                          >
                            {user.role}
                          </button>
                        </td>
                        <td className="p-3.5 text-gray-400 font-mono text-[11px]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3.5">
                          {user.lastLoginAt ? (
                            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              {new Date(user.lastLoginAt).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-[11px]">Never logged in</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            user.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(user._id, user.status)}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200"
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-1.5 rounded bg-red-600/20 hover:bg-red-600/40 text-red-400"
                            title="Delete user permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: LOGIN ACTIVITY FROM MONGODB */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>Login Activity Log</span>
                  </h2>
                  <p className="text-xs text-gray-400">
                    MongoDB Collection: <span className="text-amber-300 font-mono">login_activity</span> ({loginActivities.length} total logged sessions)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const res = await apiClient.getAdminLoginActivity(100).catch(() => null);
                      if (res?.activities) setLoginActivities(res.activities);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Log</span>
                  </button>
                </div>
              </div>

              {loginActivities.length === 0 ? (
                <div className="text-center py-16 bg-[#182032] border border-dashed border-white/10 rounded-2xl space-y-2">
                  <Clock className="w-8 h-8 text-gray-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No login activities recorded yet</h4>
                  <p className="text-xs text-gray-500">
                    When users sign in, their session telemetry (device, browser, IP) is permanently written to MongoDB <span className="font-mono text-amber-400">login_activity</span>.
                  </p>
                </div>
              ) : (
                <div className="bg-[#182032] border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111622] text-gray-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Login Time</th>
                        <th className="p-3.5">Device</th>
                        <th className="p-3.5">Browser</th>
                        <th className="p-3.5">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loginActivities.map((act) => (
                        <tr key={act._id} className="hover:bg-white/[0.02]">
                          <td className="p-3.5">
                            <span className="font-bold text-white block">
                              {act.userName || 'Member'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {act.userEmail || act.userId}
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-300 font-mono text-[11px]">
                            {new Date(act.loginTime).toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                              {act.device.toLowerCase().includes('mobile') ? (
                                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>{act.device}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-300">
                            {act.browser}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-gray-400">
                            {act.ipAddress}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTENT MANAGEMENT */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white">Catalog Management</h2>
                  <p className="text-xs text-gray-400">Publish, modify, or archive cinema titles</p>
                </div>

                <button
                  onClick={() => setShowAddMovieModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish New Movie</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map((movie) => (
                  <div
                    key={movie._id}
                    className="p-3 bg-[#182032] border border-white/10 rounded-xl flex gap-3 items-center justify-between"
                  >
                    <div className="flex gap-3 items-center overflow-hidden">
                      <img
                        src={movie.poster}
                        alt=""
                        className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                        <span className="text-[10px] text-gray-400 block">
                          {movie.releaseYear} • {movie.genres.slice(0, 2).join(', ')}
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold">★ {movie.rating}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMovie(movie._id)}
                      className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                      title="Delete movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COMMENT MODERATION */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white">Community Discussion Moderation</h2>
                  <p className="text-xs text-gray-400">Moderate community comments, handle flags and spam</p>
                </div>

                <button
                  onClick={() => setReportedOnly(!reportedOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    reportedOnly
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-white/10 text-gray-300 border-white/10'
                  }`}
                >
                  {reportedOnly ? 'Showing Reported Only' : 'Show Reported Only'}
                </button>
              </div>

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      comment.hidden
                        ? 'bg-red-950/20 border-red-500/20 opacity-60'
                        : comment.reported
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-[#182032] border-white/10'
                    }`}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{comment.user?.name}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {comment.reported && (
                          <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            ⚠️ REPORTED
                          </span>
                        )}
                        {comment.hidden && (
                          <span className="px-2 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                            HIDDEN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{comment.text}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {comment.hidden ? (
                        <button
                          onClick={() => handleModerateComment(comment._id, 'unhide')}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-300 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleModerateComment(comment._id, 'hide')}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-300 flex items-center gap-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </button>
                      )}

                      {comment.reported && (
                        <button
                          onClick={() => handleModerateComment(comment._id, 'dismissReport')}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-300"
                        >
                          Dismiss Report
                        </button>
                      )}

                      <button
                        onClick={() => handleModerateComment(comment._id, 'delete')}
                        className="p-1.5 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add New Movie Modal */}
      {showAddMovieModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#111622] border border-white/10 rounded-2xl p-6 shadow-2xl my-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Publish New Cinema Title</h3>
              <button onClick={() => setShowAddMovieModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMovieSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={newMovie.title}
                  onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                  placeholder="e.g. Neon Horizon"
                  className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Description / Synopsis</label>
                <textarea
                  rows={3}
                  required
                  value={newMovie.description}
                  onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                  placeholder="Cinematic plot synopsis..."
                  className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Director</label>
                  <input
                    type="text"
                    value={newMovie.director}
                    onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
                    placeholder="Director name"
                    className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Release Year</label>
                  <input
                    type="number"
                    value={newMovie.releaseYear}
                    onChange={(e) => setNewMovie({ ...newMovie, releaseYear: Number(e.target.value) })}
                    className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newMovie.duration}
                    onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
                    className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Rating (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMovie.rating}
                    onChange={(e) => setNewMovie({ ...newMovie, rating: Number(e.target.value) })}
                    className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Genres (comma separated)</label>
                <input
                  type="text"
                  value={newMovie.genres}
                  onChange={(e) => setNewMovie({ ...newMovie, genres: e.target.value })}
                  placeholder="Sci-Fi, Action, Thriller"
                  className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Cast Members (comma separated)</label>
                <input
                  type="text"
                  value={newMovie.cast}
                  onChange={(e) => setNewMovie({ ...newMovie, cast: e.target.value })}
                  placeholder="Actor 1, Actor 2, Actor 3"
                  className="w-full bg-[#182032] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white shadow-lg transition-colors"
                >
                  Publish Movie
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMovieModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
