import mongoose from 'mongoose';
import { embeddedStore, isUsingEmbeddedStore } from '../config/database.js';

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: mongoose.Schema.Types.ObjectId, refPath: 'contentType', required: true },
  contentType: { type: String, enum: ['Movie', 'Series'], default: 'Movie' },
  episode: { type: Number },
  progress: { type: Number, required: true, default: 0 }, // seconds
  duration: { type: Number, required: true, default: 0 }, // seconds
  completionPercentage: { type: Number, default: 0 },
  lastWatched: { type: Date, default: Date.now }
});

export const WatchHistoryModel = {
  async findByUser(userId) {
    const list = embeddedStore.watchHistories.filter(h => h.user === userId);
    return list.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
  },

  async upsert({ userId, contentId, contentType = 'movie', episode = null, progress, duration }) {
    const pct = duration > 0 ? Math.min(100, Math.round((progress / duration) * 100)) : 0;
    
    // Find movie or series metadata
    let contentObj = embeddedStore.movies.find(m => m._id === contentId) ||
                     embeddedStore.series.find(s => s._id === contentId);

    const existingIndex = embeddedStore.watchHistories.findIndex(
      h => h.user === userId && (h.content?._id === contentId || h.content === contentId)
    );

    const record = {
      _id: existingIndex !== -1 ? embeddedStore.watchHistories[existingIndex]._id : 'hist_' + Date.now(),
      user: userId,
      content: contentObj || { _id: contentId, title: 'Content ' + contentId },
      contentType,
      episode,
      progress: Math.floor(progress),
      duration: Math.floor(duration),
      completionPercentage: pct,
      lastWatched: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      embeddedStore.watchHistories[existingIndex] = record;
    } else {
      embeddedStore.watchHistories.unshift(record);
    }

    return record;
  },

  async deleteItem(id, userId) {
    const index = embeddedStore.watchHistories.findIndex(
      h => (h._id === id || h.content?._id === id) && h.user === userId
    );
    if (index === -1) return null;
    return embeddedStore.watchHistories.splice(index, 1)[0];
  },

  async clearUser(userId) {
    embeddedStore.watchHistories = embeddedStore.watchHistories.filter(h => h.user !== userId);
    return true;
  }
};

export default WatchHistoryModel;
