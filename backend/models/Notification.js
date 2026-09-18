import { embeddedStore } from '../config/database.js';

export const NotificationModel = {
  async findByUser(userId) {
    return embeddedStore.notifications
      .filter(n => n.user === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markAsRead(id, userId) {
    const notif = embeddedStore.notifications.find(n => n._id === id && n.user === userId);
    if (notif) {
      notif.read = true;
    }
    return notif;
  },

  async markAllAsRead(userId) {
    embeddedStore.notifications.forEach(n => {
      if (n.user === userId) n.read = true;
    });
    return true;
  },

  async create({ userId, title, message, type = 'system', link = '/' }) {
    const notif = {
      _id: 'notif_' + Date.now(),
      user: userId,
      title,
      message,
      type,
      read: false,
      link,
      createdAt: new Date().toISOString()
    };
    embeddedStore.notifications.unshift(notif);
    return notif;
  },

  async broadcast({ title, message, type = 'system', link = '/' }) {
    embeddedStore.users.forEach(u => {
      embeddedStore.notifications.unshift({
        _id: 'notif_' + Date.now() + '_' + u._id,
        user: u._id,
        title,
        message,
        type,
        read: false,
        link,
        createdAt: new Date().toISOString()
      });
    });
    return true;
  }
};

export default NotificationModel;
