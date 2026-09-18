import CommentModel from '../models/Comment.js';

export async function getMovieComments(req, res, next) {
  try {
    const { movieId } = req.params;
    const comments = await CommentModel.findByMovie(movieId);
    return res.json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req, res, next) {
  try {
    const { movieId, text } = req.body;

    if (!movieId || !text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID and comment text are required.'
      });
    }

    const comment = await CommentModel.create({
      user: req.user,
      movie: movieId,
      text: text.trim()
    });

    // Notify connected Socket.IO room if available
    const io = req.app.get('io');
    if (io) {
      io.to(`movie_${movieId}`).emit('new_comment', comment);
    }

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      comment
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleLikeComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await CommentModel.toggleLike(id, req.user._id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    return res.json({
      success: true,
      likes: comment.likes,
      likeCount: comment.likes.length
    });
  } catch (err) {
    next(err);
  }
}

export async function replyComment(req, res, next) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply text cannot be empty.'
      });
    }

    const comment = await CommentModel.addReply(id, {
      user: req.user,
      text: text.trim()
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    // Broadcast update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`movie_${comment.movie}`).emit('comment_updated', comment);
    }

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully!',
      comment
    });
  } catch (err) {
    next(err);
  }
}

export async function reportComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await CommentModel.report(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Comment reported to moderators for review.'
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const deleted = await CommentModel.deleteById(id, req.user._id, isAdmin);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Comment deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
