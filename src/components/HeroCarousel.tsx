import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play as PlayIcon } from 'lucide-react';
import { Movie } from '../types';
import { HeroSlide } from './HeroSlide';

export interface HeroCarouselProps {
  movies: Movie[];
  favorites?: string[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  onOpenDetails: (movie: Movie) => void;
  autoSlideInterval?: number; // ms, default 6000
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  movies = [],
  favorites = [],
  onPlay,
  onToggleFavorite,
  onOpenDetails,
  autoSlideInterval = 6000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = movies.length;

  // Next and Prev handlers
  const goToNext = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setUserInteracted(true);
    // Resume auto-slide after 8s if user manually clicked
    setTimeout(() => setUserInteracted(false), 8000);
  };

  // Preload next image to prevent flickering
  useEffect(() => {
    if (totalSlides > 1) {
      const nextIndex = (currentIndex + 1) % totalSlides;
      const nextMovie = movies[nextIndex];
      if (nextMovie) {
        const img = new Image();
        img.src = nextMovie.backdrop || nextMovie.poster;
      }
    }
  }, [currentIndex, movies, totalSlides]);

  // Auto-slide ticker
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || userInteracted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, autoSlideInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, isPaused, userInteracted, autoSlideInterval, goToNext]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Go Next
      goToNext();
      setUserInteracted(true);
      setTimeout(() => setUserInteracted(false), 6000);
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Go Prev
      goToPrev();
      setUserInteracted(true);
      setTimeout(() => setUserInteracted(false), 6000);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section
      className="relative w-full h-[70vh] sm:h-[75vh] md:h-[82vh] max-h-[850px] min-h-[480px] bg-[#0a0d14] overflow-hidden select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured Movies and Anime"
    >
      {/* Slides Container */}
      {movies.map((movie, index) => (
        <HeroSlide
          key={movie._id || index}
          movie={movie}
          isActive={index === currentIndex}
          isFavorite={favorites.includes(movie._id)}
          onPlay={onPlay}
          onToggleFavorite={onToggleFavorite}
          onOpenDetails={onOpenDetails}
        />
      ))}

      {/* Left Navigation Arrow */}
      {totalSlides > 1 && (
        <button
          onClick={() => {
            goToPrev();
            setUserInteracted(true);
            setTimeout(() => setUserInteracted(false), 6000);
          }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {totalSlides > 1 && (
        <button
          onClick={() => {
            goToNext();
            setUserInteracted(true);
            setTimeout(() => setUserInteracted(false), 6000);
          }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Bottom Carousel Controls: Indicators & Auto-play status */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 z-20 flex items-center gap-2 sm:gap-3 bg-black/45 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-white/15">
          {/* Pause / Play toggle indicator */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
            aria-label={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
          >
            {isPaused ? <PlayIcon className="w-3 h-3 text-red-400 fill-red-400" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Dots / Indicators */}
          <div className="flex items-center gap-1.5">
            {movies.map((m, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={m._id || idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'w-6 sm:w-8 bg-red-600 shadow-md shadow-red-600/50'
                      : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}: ${m.title}`}
                  title={m.title}
                />
              );
            })}
          </div>

          {/* Slide Number Counter */}
          <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-300 ml-1">
            {String(currentIndex + 1).padStart(2, '0')}/{String(totalSlides).padStart(2, '0')}
          </span>
        </div>
      )}
    </section>
  );
};
