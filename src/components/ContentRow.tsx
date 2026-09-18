import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, WatchHistoryItem } from '../types';
import { MovieCard } from './MovieCard';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  movies: Movie[];
  favoritesSet: Set<string>;
  historyMap?: Map<string, WatchHistoryItem>;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  onOpenDetails: (movie: Movie) => void;
  aspectRatio?: 'poster' | 'backdrop';
}

export const ContentRow: React.FC<ContentRowProps> = ({
  title,
  subtitle,
  badge,
  movies,
  favoritesSet,
  historyMap,
  onPlay,
  onToggleFavorite,
  onOpenDetails,
  aspectRatio = 'poster'
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [movies]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollAmount = clientWidth * 0.75;
    rowRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 350);
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative space-y-2 sm:space-y-3 group/row">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-xl font-bold text-white tracking-tight">
            {title}
          </h3>
          {badge && (
            <span className="px-1.5 py-0.5 rounded bg-red-600/20 border border-red-500/30 text-red-400 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
              {badge}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-gray-400 hidden md:inline">
              • {subtitle}
            </span>
          )}
        </div>

        {/* Scroll Arrows for Desktop / Tablet */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 active:scale-90 ${
              !canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 active:scale-90 ${
              !canScrollRight ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div className="relative">
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-3 pt-1 no-scrollbar scroll-smooth gpu-accelerated"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {movies.map((movie) => {
            const historyRecord = historyMap?.get(movie._id);
            return (
              <div key={movie._id} style={{ scrollSnapAlign: 'start' }}>
                <MovieCard
                  movie={movie}
                  isFavorite={favoritesSet.has(movie._id)}
                  onPlay={onPlay}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetails={onOpenDetails}
                  aspectRatio={aspectRatio}
                  progressPercentage={historyRecord?.completionPercentage}
                  resumeSeconds={historyRecord?.progress}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
