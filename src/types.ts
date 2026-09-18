export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profileImage: string;
  subscription: {
    plan: 'FREE' | 'BASIC' | 'PREMIUM';
    status: string;
    expiresAt: string;
  };
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string | null;
  lastActive?: string;
}

export interface LoginActivityItem {
  _id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  loginTime: string;
  device: string;
  browser: string;
  ipAddress: string;
}

export interface Movie {
  _id: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  videoUrl: string;
  trailerUrl?: string;
  genres: string[];
  cast: string[];
  director: string;
  releaseYear: number;
  duration: number; // minutes
  rating: number;
  views: number;
  featured: boolean;
  ageRating: string;
  language: string;
  createdAt?: string;
}

export interface SeriesEpisode {
  episodeNumber: number;
  title: string;
  duration: number;
  videoUrl: string;
  description: string;
}

export interface SeriesSeason {
  seasonNumber: number;
  episodes: SeriesEpisode[];
}

export interface Series {
  _id: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  genres: string[];
  releaseYear: number;
  rating: number;
  featured: boolean;
  seasons: SeriesSeason[];
}

export interface CommentReply {
  _id: string;
  user: {
    _id: string;
    name: string;
    profileImage: string;
  };
  text: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    profileImage: string;
    email?: string;
  };
  movie: string | { _id: string; title: string; poster: string };
  text: string;
  likes: string[];
  replies: CommentReply[];
  reported: boolean;
  hidden: boolean;
  createdAt: string;
}

export interface WatchHistoryItem {
  _id: string;
  user: string;
  content: Movie;
  contentType: 'movie' | 'series';
  episode?: number;
  progress: number; // seconds
  duration: number; // seconds
  completionPercentage: number;
  lastWatched: string;
}

export interface FavoriteItem {
  _id: string;
  user: string;
  content: Movie;
  contentType: 'movie' | 'series';
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'movie' | 'system' | 'comment' | 'subscription';
  read: boolean;
  link: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: 'FREE' | 'BASIC' | 'PREMIUM';
  name: string;
  price: number;
  interval: string;
  resolution: string;
  devices: number;
  ads: boolean;
  downloads: boolean;
  badge: string;
  features: string[];
}

export interface LiveViewer {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  profileImage: string;
  role: string;
  watching: string | null;
  progressText?: string;
  connectedAt: string;
  lastActive: string;
  ip: string;
}

export interface AdminAnalytics {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalMovies: number;
    totalSeries: number;
    totalEpisodes: number;
    totalComments: number;
    totalWatchHours: number;
    newUsersToday: number;
  };
  charts: {
    registrationTrend: Array<{ day: string; registrations: number; activeUsers: number }>;
    mostWatched: Array<{ title: string; views: number; rating: number }>;
    genreCounts: Record<string, number>;
  };
}
