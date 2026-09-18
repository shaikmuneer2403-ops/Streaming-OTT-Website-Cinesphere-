import UserModel from '../models/User.js';
import LoginActivityModel from '../models/LoginActivity.js';
import MovieModel from '../models/Movie.js';
import SeriesModel from '../models/Series.js';
import CommentModel from '../models/Comment.js';
import { embeddedStore } from '../config/database.js';

export async function getAdminUsers(req, res, next) {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }

    const users = await UserModel.find(query).select('-passwordHash').sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or suspended.' });
    }

    const updated = await UserModel.updateById(id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: `User status changed to ${status}.`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be user or admin.' });
    }

    const updated = await UserModel.updateById(id, { role });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: `User role changed to ${role}.`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own active account.'
      });
    }

    const deleted = await UserModel.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: 'User account removed permanently.'
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = embeddedStore.users.filter(u => u.status === 'active').length;
    const totalMovies = await MovieModel.countDocuments();
    const totalSeries = await SeriesModel.countDocuments();
    const totalComments = await CommentModel.countDocuments();

    // Calculate total episodes across series
    let totalEpisodes = 0;
    embeddedStore.series.forEach(s => {
      s.seasons?.forEach(season => {
        totalEpisodes += season.episodes?.length || 0;
      });
    });

    // Total watch time in hours
    const totalSeconds = embeddedStore.watchHistories.reduce((acc, h) => acc + (h.progress || 0), 0);
    const totalWatchHours = Math.round(totalSeconds / 3600);

    // Most watched content
    const mostWatched = [...embeddedStore.movies]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(m => ({ title: m.title, views: m.views, rating: m.rating }));

    // Genre distribution
    const genreCounts = {};
    embeddedStore.movies.forEach(m => {
      m.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    // Registration trend data for charts
    const registrationTrend = [
      { day: 'Mon', registrations: 14, activeUsers: 42 },
      { day: 'Tue', registrations: 19, activeUsers: 55 },
      { day: 'Wed', registrations: 24, activeUsers: 68 },
      { day: 'Thu', registrations: 18, activeUsers: 62 },
      { day: 'Fri', registrations: 35, activeUsers: 89 },
      { day: 'Sat', registrations: 48, activeUsers: 112 },
      { day: 'Sun', registrations: 52, activeUsers: 125 }
    ];

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalMovies,
        totalSeries,
        totalEpisodes,
        totalComments,
        totalWatchHours,
        newUsersToday: 4
      },
      charts: {
        registrationTrend,
        mostWatched,
        genreCounts
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminComments(req, res, next) {
  try {
    const { reportedOnly } = req.query;
    const comments = await CommentModel.findAll({ reportedOnly: reportedOnly === 'true' });
    return res.json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (err) {
    next(err);
  }
}

export async function moderateComment(req, res, next) {
  try {
    const { id } = req.params;
    const { hidden, reported, deleteAction } = req.body;

    if (deleteAction) {
      await CommentModel.deleteById(id, req.user._id, true);
      return res.json({ success: true, message: 'Comment deleted by moderator.' });
    }

    const updated = await CommentModel.moderate(id, { hidden, reported });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    return res.json({
      success: true,
      message: 'Comment moderation status updated.',
      comment: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function getLiveActivity(req, res) {
  // Retrievable via REST as well as Socket.IO
  const liveMonitoringState = req.app.get('liveMonitoringState') || [];
  return res.json({
    success: true,
    activeViewersCount: liveMonitoringState.length,
    activeViewers: liveMonitoringState
  });
}

/**
 * Requirement 12: GET /api/admin/login-activity
 * Fetches login records directly from MongoDB "login_activity" collection.
 */
export async function getAdminLoginActivity(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 100;
    const activities = await LoginActivityModel.find()
      .sort({ loginTime: -1 })
      .limit(limit);

    return res.json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (err) {
    next(err);
  }
}

