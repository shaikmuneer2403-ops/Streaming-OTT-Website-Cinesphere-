import { embeddedStore } from '../config/database.js';

export const FavoriteModel = {
  async findByUser(userId) {
    return embeddedStore.favorites
      .filter(f => f.user === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async toggle({ userId, contentId, contentType = 'movie' }) {
    const existingIndex = embeddedStore.favorites.findIndex(
      f => f.user === userId && (f.content?._id === contentId || f.content === contentId)
    );

    if (existingIndex !== -1) {
      embeddedStore.favorites.splice(existingIndex, 1);
      return { action: 'removed', contentId };
    }

    const contentObj = embeddedStore.movies.find(m => m._id === contentId) ||
                       embeddedStore.series.find(s => s._id === contentId);

    const newFav = {
      _id: 'fav_' + Date.now(),
      user: userId,
      content: contentObj || { _id: contentId },
      contentType,
      createdAt: new Date().toISOString()
    };

    embeddedStore.favorites.unshift(newFav);
    return { action: 'added', favorite: newFav };
  },

  async deleteItem(contentId, userId) {
    const index = embeddedStore.favorites.findIndex(
      f => f.user === userId && (f.content?._id === contentId || f._id === contentId)
    );
    if (index === -1) return null;
    return embeddedStore.favorites.splice(index, 1)[0];
  },

  async isFavorite(userId, contentId) {
    return embeddedStore.favorites.some(
      f => f.user === userId && (f.content?._id === contentId || f.content === contentId)
    );
  }
};

export default FavoriteModel;
