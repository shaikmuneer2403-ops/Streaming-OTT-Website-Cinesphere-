import React from 'react';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  onOpenDetails: (movie: Movie) => void;
  progressPercentage?: number;
  resumeSeconds?: number;
  aspectRatio?: 'poster' | 'backdrop';
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onOpenDetails,
  progressPercentage,
  resumeSeconds,
  aspectRatio = 'poster'
}) => {
  const isBackdrop = aspectRatio === 'backdrop';

  return (
    <div
      onClick={() => onOpenDetails(movie)}
      className={`group relative flex-shrink-0 rounded-xl overflow-hidden glass-card transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] sm:hover:-translate-y-1 hover:z-20 hover:shadow-2xl hover:shadow-black/90 hover:border-red-500/50 cursor-pointer gpu-accelerated select-none ${
        isBackdrop ? 'w-60 sm:w-72 md:w-80' : 'w-36 sm:w-44 md:w-48'
      }`}
    >
      {/* Media Artwork */}
      <div className={`relative w-full overflow-hidden ${isBackdrop ? 'aspect-video' : 'aspect-[2/3]'}`}>
        <img
          src={isBackdrop ? (movie.backdrop || movie.poster) : movie.poster}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <span className="inline-flex items-center gap-1 bg-amber-500/95 text-black px-1.5 py-0.5 rounded-md text-[10px] font-black shadow-md backdrop-blur-sm">
            <Star className="w-2.5 h-2.5 fill-black" />
            {movie.rating}
          </span>
          {movie.featured && (
            <span className="bg-red-600/90 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-md">
              HOT
            </span>
          )}
        </div>

        {/* Quick Play Pill on Mobile */}
        <div className="sm:hidden absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(movie);
            }}
            className="w-7 h-7 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg active:scale-80 transition-transform"
            aria-label="Play"
          >
            <Play className="w-3 h-3 fill-white ml-0.5" />
          </button>
        </div>

        {/* Watch Progress Indicator for Continue Watching */}
        {progressPercentage !== undefined && progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
          </div>
        )}

        {/* Desktop Hover Overlay with Micro-Interactions */}
        <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/75 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-col justify-end p-3 sm:p-4 z-10">
          <div className="space-y-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-1">
              {movie.title}
            </h4>

            <div className="flex items-center gap-1.5 text-[10px] text-gray-300 font-medium">
              <span>{movie.releaseYear}</span>
              <span>•</span>
              <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
              <span>•</span>
              <span className="text-red-400 font-semibold">{movie.genres[0]}</span>
            </div>

            {resumeSeconds !== undefined && resumeSeconds > 0 && (
              <p className="text-[10px] text-amber-300 font-semibold">
                Resume at {Math.floor(resumeSeconds / 60)}m
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onPlay(movie)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                title="Play Now"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Play</span>
              </button>

              <button
                onClick={() => onToggleFavorite(movie._id)}
                className={`p-2 rounded-lg border text-white transition-all active:scale-90 ${
                  isFavorite
                    ? 'bg-red-950/70 border-red-500 text-red-400'
                    : 'bg-white/10 hover:bg-white/20 border-white/15'
                }`}
                title={isFavorite ? 'Remove from My List' : 'Add to My List'}
              >
                {isFavorite ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => onOpenDetails(movie)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-90 transition-all"
                title="View Details"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Bottom Caption Bar (always legible on touch devices) */}
      <div className="sm:hidden p-2 bg-[#0e1320] border-t border-white/5 space-y-1">
        <h4 className="text-[11px] font-bold text-white leading-tight truncate">
          {movie.title}
        </h4>
        <div className="flex items-center justify-between text-[9px] text-gray-400">
          <span>{movie.releaseYear} • {movie.genres[0]}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(movie._id);
            }}
            className="p-1 text-gray-300 active:scale-75 transition-transform"
            aria-label={isFavorite ? 'Remove from list' : 'Add to list'}
          >
            {isFavorite ? <Check className="w-3 h-3 text-red-400" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
