import React from 'react';
import { Movie } from '../types';
import { HeroCarousel } from './HeroCarousel';

export interface HeroBannerProps {
  movie?: Movie;
  movies?: Movie[];
  isFavorite?: boolean;
  favorites?: string[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  onOpenDetails: (movie: Movie) => void;
  featuredMovies?: Movie[];
  onSelectHeroMovie?: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  movies,
  isFavorite = false,
  favorites = [],
  onPlay,
  onToggleFavorite,
  onOpenDetails,
  featuredMovies = [],
}) => {
  // Determine full list of slides: prefer movies array or featuredMovies, otherwise fallback to single movie
  let slideList: Movie[] = [];
  if (movies && movies.length > 0) {
    slideList = movies;
  } else if (featuredMovies && featuredMovies.length > 0) {
    slideList = featuredMovies;
  } else if (movie) {
    slideList = [movie];
  }

  // Active favorites list
  const activeFavorites = favorites.length > 0 ? favorites : (movie && isFavorite ? [movie._id] : []);

  return (
    <HeroCarousel
      movies={slideList}
      favorites={activeFavorites}
      onPlay={onPlay}
      onToggleFavorite={onToggleFavorite}
      onOpenDetails={onOpenDetails}
    />
  );
};

