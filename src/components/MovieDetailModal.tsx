import React from 'react';
import { X, Play, Plus, Check, Star, Film, Clock, Users } from 'lucide-react';
import { Movie, User } from '../types';
import { CommentsSection } from './CommentsSection';

interface MovieDetailModalProps {
  movie: Movie | null;
  isFavorite: boolean;
  currentUser: User | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  onRequireAuth: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  isFavorite,
  currentUser,
  onClose,
  onPlay,
  onToggleFavorite,
  onRequireAuth
}) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-[#0d111a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors border border-white/10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <img
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover filter brightness-[0.75]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d111a] via-[#0d111a]/40 to-transparent" />

          {/* Floating Actions on Backdrop */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-amber-500 text-black px-2 py-0.5 rounded text-xs font-black">
                  <Star className="w-3 h-3 fill-black" />
                  {movie.rating}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white text-xs font-semibold border border-white/15">
                  {movie.ageRating || '16+'}
                </span>
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-bold tracking-wider">
                  4K ULTRA HD
                </span>
                <span className="text-gray-300 text-xs font-medium">
                  {movie.releaseYear} • {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {movie.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onPlay(movie);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => onToggleFavorite(movie._id)}
                className={`p-3 rounded-xl border text-white transition-all ${
                  isFavorite
                    ? 'bg-red-950/60 border-red-500 text-red-400'
                    : 'bg-white/10 hover:bg-white/20 border-white/20'
                }`}
                title={isFavorite ? 'Remove from My List' : 'Add to My List'}
              >
                {isFavorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Synopsis
              </h4>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {movie.description}
              </p>
            </div>

            <div className="space-y-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs">
              <div>
                <span className="text-gray-400 block mb-1 font-medium">Director</span>
                <span className="text-white font-semibold">{movie.director}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1 font-medium">Cast</span>
                <span className="text-gray-200">{movie.cast.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1 font-medium">Genres</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 rounded bg-white/10 text-gray-300 font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Community Discussion / Comments */}
          <div className="pt-4 border-t border-white/10">
            <CommentsSection
              movieId={movie._id}
              currentUser={currentUser}
              onRequireAuth={onRequireAuth}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
