import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, History, Star } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  favoritesSet: Set<string>;
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movieId: string) => void;
  onOpenDetails: (movie: Movie) => void;
  genres: string[];
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  movies,
  favoritesSet,
  onPlay,
  onToggleFavorite,
  onOpenDetails,
  genres
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'year'>('popularity');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinesphere_search_history');
      return saved ? JSON.parse(saved) : ['Cosmic', 'Cyberpunk', 'Neon', 'Echo'];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (query.trim().length > 2 && !searchHistory.includes(query.trim())) {
      const updated = [query.trim(), ...searchHistory.slice(0, 5)];
      setSearchHistory(updated);
      localStorage.setItem('cinesphere_search_history', JSON.stringify(updated));
    }
  }, [query]);

  if (!isOpen) return null;

  // Filter movies based on search criteria
  const filtered = movies.filter((m) => {
    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.cast.some((c) => c.toLowerCase().includes(q)) ||
      m.genres.some((g) => g.toLowerCase().includes(q));

    const matchesGenre = selectedGenre === 'All' || m.genres.includes(selectedGenre);
    const matchesRating = m.rating >= minRating;

    return matchesQuery && matchesGenre && matchesRating;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'year') return b.releaseYear - a.releaseYear;
    return b.views - a.views;
  });

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('cinesphere_search_history');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d14]/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header & Search Input */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, director, actor, genre, or keyword..."
              autoFocus
              className="w-full bg-[#182032] border border-white/15 focus:border-red-500 rounded-2xl py-4 pl-14 pr-12 text-base sm:text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            aria-label="Close search"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search History Chips */}
        {searchHistory.length > 0 && !query && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gray-400 flex items-center gap-1 font-semibold">
              <History className="w-3.5 h-3.5" /> Recent:
            </span>
            {searchHistory.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
            <button
              onClick={clearHistory}
              className="text-gray-500 hover:text-red-400 text-[11px] underline ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 p-3.5 sm:p-4 glass-card rounded-xl text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-300">
            <SlidersHorizontal className="w-4 h-4 text-red-400" />
            <span>Filters:</span>
          </div>

          {/* Genre select */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-[#182032] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none text-xs"
          >
            <option value="All">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Rating filter */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="bg-[#182032] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none text-xs"
          >
            <option value={0}>Any Rating</option>
            <option value={7}>7.0+ Stars</option>
            <option value={8}>8.0+ Stars (Top Rated)</option>
            <option value={8.5}>8.5+ Masterpieces</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto sm:ml-auto pt-1 sm:pt-0">
            <span className="text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#182032] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none text-xs flex-1 sm:flex-none"
            >
              <option value="popularity">Most Watched</option>
              <option value="rating">Highest Rated</option>
              <option value="year">Newest Release</option>
            </select>
          </div>
        </div>

        {/* Search Results Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Search Results ({filtered.length})
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">No cinema titles found</h4>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Try searching for different keywords, clear your filters, or check out our featured collection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  isFavorite={favoritesSet.has(movie._id)}
                  onPlay={onPlay}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
