import React, { useState, useEffect } from 'react';
import { Heart, Reply, Flag, Trash2, Send, CornerDownRight } from 'lucide-react';
import { Comment, User } from '../types';
import { apiClient } from '../services/api';
import { getSocket } from '../services/socket';
import { ProfileAvatar } from './ProfileAvatar';

interface CommentsSectionProps {
  movieId: string;
  currentUser: User | null;
  onRequireAuth: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  movieId,
  currentUser,
  onRequireAuth
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getComments(movieId);
      setComments(res.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();

    // Socket.io real-time movie room listener
    const socket = getSocket();
    socket.emit('join_movie', movieId);

    const handleNewComment = (comment: Comment) => {
      if (comment.movie === movieId || (typeof comment.movie === 'object' && comment.movie._id === movieId)) {
        setComments(prev => [comment, ...prev.filter(c => c._id !== comment._id)]);
      }
    };

    const handleCommentUpdated = (updated: Comment) => {
      setComments(prev => prev.map(c => c._id === updated._id ? updated : c));
    };

    const handleCommentDeleted = ({ commentId }: { commentId: string }) => {
      setComments(prev => prev.filter(c => c._id !== commentId));
    };

    socket.on('new_comment', handleNewComment);
    socket.on('comment_updated', handleCommentUpdated);
    socket.on('comment_deleted', handleCommentDeleted);

    return () => {
      socket.emit('leave_movie', movieId);
      socket.off('new_comment', handleNewComment);
      socket.off('comment_updated', handleCommentUpdated);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [movieId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      setSubmitting(true);
      const res = await apiClient.addComment(movieId, newCommentText.trim());
      setComments(prev => [res.comment, ...prev]);
      setNewCommentText('');
      showToast('Comment posted to cinema community!');
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    try {
      const res = await apiClient.likeComment(commentId);
      setComments(prev =>
        prev.map(c =>
          c._id === commentId
            ? { ...c, likes: res.likes }
            : c
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to like');
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!replyText.trim()) return;

    try {
      const res = await apiClient.replyComment(commentId, replyText.trim());
      setComments(prev => prev.map(c => c._id === commentId ? res.comment : c));
      setReplyingToId(null);
      setReplyText('');
      showToast('Reply published.');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit reply');
    }
  };

  const handleReport = async (commentId: string) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    try {
      await apiClient.reportComment(commentId);
      showToast('Comment reported to moderators.');
    } catch (err: any) {
      showToast(err.message || 'Already reported');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await apiClient.deleteComment(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      showToast('Comment deleted.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Community Discussion</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-300 font-semibold">
            {comments.length}
          </span>
        </h3>
        {toastMessage && (
          <span className="text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full animate-fade-in">
            {toastMessage}
          </span>
        )}
      </div>

      {/* Add New Comment Box */}
      <form onSubmit={handleAddComment} className="space-y-3">
        <div className="flex gap-3">
          <ProfileAvatar
            src={currentUser?.profileImage}
            name={currentUser?.name || 'Guest'}
            size="md"
          />
          <div className="flex-1 relative">
            <textarea
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={currentUser ? "Share your thoughts on the cinematography, plot, or score..." : "Sign in to leave a review or join the discussion..."}
              disabled={!currentUser}
              className="w-full bg-[#111622] border border-white/10 focus:border-red-500/80 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pl-13">
          <span className="text-xs text-gray-500">
            {newCommentText.length}/500 characters
          </span>
          {currentUser ? (
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequireAuth}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              Sign In to Comment
            </button>
          )}
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading community reviews...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-gray-400 font-medium">No reviews yet.</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to share your thoughts on this cinematic piece!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const hasLiked = currentUser ? comment.likes.includes(currentUser._id) : false;
            const isAuthor = currentUser && comment.user._id === currentUser._id;
            const isAdmin = currentUser && currentUser.role === 'admin';

            return (
              <div
                key={comment._id}
                className="p-4 rounded-xl bg-[#111622]/70 border border-white/5 space-y-3 transition-colors hover:border-white/10"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      src={comment.user.profileImage}
                      name={comment.user.name}
                      size="sm"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block leading-tight">
                        {comment.user.name}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Like Button */}
                    <button
                      onClick={() => handleToggleLike(comment._id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        hasLiked
                          ? 'bg-red-950/70 text-red-400 border border-red-500/40'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-red-500' : ''}`} />
                      <span>{comment.likes.length}</span>
                    </button>

                    {/* Report Button */}
                    <button
                      onClick={() => handleReport(comment._id)}
                      className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                      title="Report comment"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button (author or admin) */}
                    {(isAuthor || isAdmin) && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-sm text-gray-300 leading-relaxed pl-11">
                  {comment.text}
                </p>

                {/* Reply Toggle */}
                <div className="pl-11 flex items-center gap-4 text-xs font-semibold text-gray-400">
                  <button
                    onClick={() => setReplyingToId(replyingToId === comment._id ? null : comment._id)}
                    className="hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Reply</span>
                  </button>
                  {comment.replies?.length > 0 && (
                    <span className="text-gray-500 font-normal">
                      {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>

                {/* Nested Reply Box */}
                {replyingToId === comment._id && (
                  <div className="pl-11 pt-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-[#182032] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => handleReplySubmit(comment._id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies List */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-11 space-y-2 pt-2 border-t border-white/5">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex items-start gap-2.5 text-xs bg-white/[0.02] p-2.5 rounded-lg">
                        <CornerDownRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <ProfileAvatar
                          src={reply.user.profileImage}
                          name={reply.user.name}
                          size="xs"
                        />
                        <div>
                          <span className="font-bold text-gray-200 mr-2">{reply.user.name}:</span>
                          <span className="text-gray-300">{reply.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
