import mongoose from 'mongoose';
import { embeddedStore, isUsingEmbeddedStore } from '../config/database.js';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  text: { type: String, required: true, trim: true },
  likes: [{ type: String }],
  replies: [
    {
      user: {
        _id: String,
        name: String,
        profileImage: String
      },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  reported: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let MongooseCommentModel;
try {
  MongooseCommentModel = mongoose.model('Comment', commentSchema);
} catch (e) {
  MongooseCommentModel = mongoose.models.Comment;
}

export const CommentModel = {
  async findByMovie(movieId, { includeHidden = false } = {}) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      const q = { movie: movieId };
      if (!includeHidden) q.hidden = { $ne: true };
      return await MongooseCommentModel.find(q).populate('user', 'name profileImage').sort({ createdAt: -1 });
    }
    return embeddedStore.comments
      .filter(c => c.movie === movieId && (includeHidden || !c.hidden))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findAll({ reportedOnly = false } = {}) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      const q = reportedOnly ? { reported: true } : {};
      return await MongooseCommentModel.find(q).populate('user', 'name email').populate('movie', 'title poster').sort({ createdAt: -1 });
    }
    let list = [...embeddedStore.comments];
    if (reportedOnly) {
      list = list.filter(c => c.reported);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create({ user, movie, text }) {
    if (!isUsingEmbeddedStore() && mongoose.connection.readyState === 1) {
      return await MongooseCommentModel.create({
        user: user._id || user.id,
        movie,
        text
      });
    }
    const newComment = {
      _id: 'com_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      user: {
        _id: user._id || user.id,
        name: user.name,
        profileImage: user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
      },
      movie,
      text,
      likes: [],
      replies: [],
      reported: false,
      hidden: false,
      createdAt: new Date().toISOString()
    };
    embeddedStore.comments.unshift(newComment);
    return newComment;
  },

  async toggleLike(commentId, userId) {
    const comment = embeddedStore.comments.find(c => c._id === commentId);
    if (!comment) return null;
    const exists = comment.likes.includes(userId);
    if (exists) {
      comment.likes = comment.likes.filter(id => id !== userId);
    } else {
      comment.likes.push(userId);
    }
    return comment;
  },

  async addReply(commentId, { user, text }) {
    const comment = embeddedStore.comments.find(c => c._id === commentId);
    if (!comment) return null;
    const reply = {
      _id: 'rep_' + Date.now(),
      user: {
        _id: user._id || user.id,
        name: user.name,
        profileImage: user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
      },
      text,
      createdAt: new Date().toISOString()
    };
    comment.replies.push(reply);
    return comment;
  },

  async report(commentId) {
    const comment = embeddedStore.comments.find(c => c._id === commentId);
    if (!comment) return null;
    comment.reported = true;
    return comment;
  },

  async moderate(commentId, { hidden, reported }) {
    const comment = embeddedStore.comments.find(c => c._id === commentId);
    if (!comment) return null;
    if (hidden !== undefined) comment.hidden = hidden;
    if (reported !== undefined) comment.reported = reported;
    return comment;
  },

  async deleteById(commentId, userId, isAdmin = false) {
    const index = embeddedStore.comments.findIndex(c => c._id === commentId);
    if (index === -1) return null;
    const comment = embeddedStore.comments[index];
    const authorId = typeof comment.user === 'object' ? comment.user._id : comment.user;
    if (!isAdmin && authorId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }
    return embeddedStore.comments.splice(index, 1)[0];
  },

  async countDocuments() {
    return embeddedStore.comments.length;
  }
};

export default CommentModel;
