import React from 'react';
import { Play, Plus, Check, Info, Star, Sparkles } from 'lucide-react';
import { Movie } from '../types';

export interface HeroSlideProps {
  movie: Movie;
  isActive: boolean;
  isFavorite: boolean;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  onOpenDetails: (movie: Movie) => void;
}

export const HeroSlide: React.FC<HeroSlideProps> = ({
  movie,
  isActive,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onOpenDetails
}) => {
  const isAnime = movie.genres.some(
    (g) => g.toLowerCase() === 'anime' || g.toLowerCase().includes('animation')
  );

  const durationHours = Math.floor(movie.duration / 60);
  const durationMinutes = movie.duration % 60;
  const durationFormatted = durationHours > 0 ? `${durationHours}h ${durationMinutes}m` : `${durationMinutes}m`;

  return (
    <div
      className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
        isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
      }`}
      aria-hidden={!isActive}
    >
      {/* Background Poster / Backdrop Image */}
      <img
        src={movie.backdrop || movie.poster}
        alt={movie.title}
        referrerPolicy="no-referrer"
        className={`absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.70] transition-transform duration-1000 ease-out ${
          isActive ? 'scale-105' : 'scale-100'
        }`}
      />

      {/* Subtle Multi-Directional Dark Gradient Overlays for Guaranteed Text Legibility */}
      {/* Bottom to top cinematic fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/65 to-transparent" />
      {/* Left to right dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/80 md:via-[#0a0d14]/70 to-transparent w-full md:w-4/5" />
      {/* Top subtle navbar shadow fade */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0a0d14]/80 to-transparent" />

      {/* Synchronized Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-14 sm:pb-16 md:pb-18 w-full">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs">
            {/* Anime vs Movie Special Indicator */}
            {isAnime && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-2 py-0.5 rounded-md font-extrabold text-[10px] tracking-wider uppercase shadow-md">
                <Sparkles className="w-2.5 h-2.5 fill-white" />
                ANIME
              </span>
            )}

            {/* Quality Badge */}
            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black tracking-wider text-[10px] shadow-sm">
              4K ULTRA HD
            </span>

            {/* Rating */}
            <span className="inline-flex items-center gap-1 bg-amber-500 text-black px-2 py-0.5 rounded-md font-black shadow-md">
              <Star className="w-3 h-3 fill-black" />
              {movie.rating.toFixed(1)}
            </span>

            {/* Age Certification */}
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold border border-white/20 backdrop-blur-sm">
              {movie.ageRating || '16+'}
            </span>

            {/* Year & Duration */}
            <span className="text-gray-300 font-medium">
              {movie.releaseYear} • {durationFormatted}
            </span>

            {/* Genres */}
            <span className="hidden xs:inline text-gray-400">
              • {movie.genres.join(' • ')}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl">
            {movie.title}
          </h1>

          {/* Short Description */}
          <p className="text-xs sm:text-sm md:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-md max-w-xl">
            {movie.description}
          </p>

          {/* Action Buttons with Touch-Friendly Hit Areas */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
            {/* Watch Now Button */}
            <button
              onClick={() => onPlay(movie)}
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label={`Watch ${movie.title} now`}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>Watch Now</span>
            </button>

            {/* Add to List Button */}
            <button
              onClick={() => onToggleFavorite(movie._id)}
              className={`min-h-[44px] sm:min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm backdrop-blur-md border active:scale-95 transition-all duration-200 cursor-pointer ${
                isFavorite
                  ? 'bg-red-950/70 text-red-400 border-red-500/50 hover:bg-red-950/90'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
              aria-label={isFavorite ? `Remove ${movie.title} from list` : `Add ${movie.title} to list`}
            >
              {isFavorite ? <Check className="w-4 h-4 text-red-400" /> : <Plus className="w-4 h-4" />}
              <span className="hidden xs:inline">{isFavorite ? 'In List' : 'Add to List'}</span>
            </button>

            {/* Details Button */}
            <button
              onClick={() => onOpenDetails(movie)}
              className="min-h-[44px] sm:min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label={`View details for ${movie.title}`}
            >
              <Info className="w-4 h-4 text-gray-300" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
