import React, { useState, useEffect, useMemo } from 'react';
import {
  Movie,
  Series,
  User,
  WatchHistoryItem,
  FavoriteItem,
  NotificationItem
} from './types';
import { apiClient, getAuthToken, getCurrentUser, clearSession } from './services/api';
import { registerSocketUser, getSocket } from './services/socket';

// Components
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ContentRow } from './components/ContentRow';
import { MovieCard } from './components/MovieCard';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { MovieDetailModal } from './components/MovieDetailModal';
import { SearchOverlay } from './components/SearchOverlay';
import { UserProfileModal } from './components/UserProfileModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { NotificationsDropdown } from './components/NotificationsDropdown';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { ArchitectureExplainerModal } from './components/ArchitectureExplainerModal';
import { SkeletonLoader } from './components/SkeletonLoader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AvatarChangeModal } from './components/AvatarChangeModal';

export default function App() {
  // Global State - Backend/MongoDB is the source of truth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  // Content State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Overlays
  const [activePlayerMovie, setActivePlayerMovie] = useState<Movie | null>(null);
  const [playerResumeSeconds, setPlayerResumeSeconds] = useState<number>(0);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'overview' | 'history' | 'favorites' | 'security'>('overview');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);

  // Global Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Memoized Favorites Set for O(1) lookups
  const favoritesSet = useMemo(() => {
    return new Set(favorites.map(f => (typeof f.content === 'object' ? f.content._id : f.content)));
  }, [favorites]);

  // Memoized Watch History Map for O(1) lookups
  const historyMap = useMemo(() => {
    const map = new Map<string, WatchHistoryItem>();
    history.forEach(h => {
      const id = typeof h.content === 'object' ? h.content._id : h.content;
      map.set(id, h);
    });
    return map;
  }, [history]);

  // Featured Movies & Hero Banner Selection (Curating top movies and anime)
  const featuredMovies = useMemo(() => {
    const featured = movies.filter(m => m.featured);
    const anime = movies.filter(m => m.genres?.some(g => g.toLowerCase().includes('anime')));
    const combined = [...featured, ...anime, ...movies].filter(
      (m, idx, self) => self.findIndex(t => t._id === m._id) === idx
    );
    return combined.slice(0, 6);
  }, [movies]);

  const heroMovie = useMemo(() => {
    if (selectedHeroId) {
      const found = movies.find(m => m._id === selectedHeroId);
      if (found) return found;
    }
    return featuredMovies[0] || movies[0] || null;
  }, [movies, featuredMovies, selectedHeroId]);

  // Fetch initial platform content
  const loadContent = async () => {
    try {
      setLoading(true);
      const moviesRes = await apiClient.getMovies();
      setMovies(moviesRes.movies || []);
      setGenres(moviesRes.genres || []);

      const seriesRes = await apiClient.getSeries();
      setSeries(seriesRes.series || []);
    } catch (err) {
      console.error('Failed to fetch platform catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user personalized records (history, favorites, notifications)
  const loadUserData = async () => {
    if (!currentUser) return;
    try {
      const [favRes, histRes, notifRes] = await Promise.all([
        apiClient.getFavorites().catch(() => ({ favorites: [] })),
        apiClient.getHistory().catch(() => ({ history: [] })),
        apiClient.getNotifications().catch(() => ({ notifications: [] }))
      ]);

      setFavorites(favRes.favorites || []);
      setHistory(histRes.history || []);
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.warn('Could not fetch user records:', err);
    }
  };

  // Verify session against backend /api/auth/me on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setCurrentUser(null);
        setAuthChecking(false);
        return;
      }
      try {
        const meRes = await apiClient.getMe();
        if (meRes.success && meRes.user) {
          setCurrentUser(meRes.user);
        } else {
          clearSession();
          setCurrentUser(null);
        }
      } catch {
        clearSession();
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    initAuth();
    loadContent();
  }, []);

  useEffect(() => {
    registerSocketUser(currentUser);
    if (currentUser) {
      loadUserData();
    } else {
      setFavorites([]);
      setHistory([]);
      setNotifications([]);
    }
  }, [currentUser]);

  // Handle Play Movie
  const handlePlayMovie = (movie: Movie) => {
    const historyItem = historyMap.get(movie._id);
    const resumeSeconds = historyItem?.progress && historyItem.progress > 10 ? historyItem.progress : 0;
    setPlayerResumeSeconds(resumeSeconds);
    setActivePlayerMovie(movie);
  };

  // Handle Toggle Favorite
  const handleToggleFavorite = async (movieId: string) => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }

    try {
      const res = await apiClient.toggleFavorite(movieId, 'movie');
      showToast(res.message);
      loadUserData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update favorites');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    registerSocketUser(null);
    showToast('Signed out of CineSphere.');
    if (activeTab === 'admin' || activeTab === 'favorites' || activeTab === 'history') {
      setActiveTab('home');
    }
  };

  // Filtered movies when user selects a genre tab
  const displayMovies = useMemo(() => {
    if (selectedGenre === 'All') return movies;
    return movies.filter(m => m.genres.includes(selectedGenre));
  }, [movies, selectedGenre]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#182032]/95 border border-red-500 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Global Cinematic Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setShowSearch(true)}
        onOpenProfile={(initialTab) => {
          setProfileInitialTab(initialTab || 'overview');
          setShowProfile(true);
        }}
        onOpenAuth={() => setShowAuth(true)}
        onOpenSubscriptions={() => setShowSubscriptions(true)}
        onOpenArchitecture={() => setShowArchitecture(true)}
        onChangeProfilePicture={() => setShowAvatarModal(true)}
        notifications={notifications}
        onOpenNotifications={() => setShowNotifications(true)}
        onLogout={handleLogout}
        selectedGenre={selectedGenre}
        onSelectGenre={(g) => {
          setSelectedGenre(g);
          if (activeTab !== 'movies') setActiveTab('movies');
        }}
        genres={genres}
      />

      {/* Primary Page Layouts */}
      <main className="flex-1 pb-24 md:pb-16">
        {loading ? (
          <SkeletonLoader />
        ) : (
          <>
            {/* VIEW 1: HOME PAGE */}
            {activeTab === 'home' && (
              <div className="space-y-8 sm:space-y-10 animate-fade-in-up">
                {/* Hero Feature Movie */}
                {heroMovie && (
                  <HeroBanner
                    movie={heroMovie}
                    isFavorite={favoritesSet.has(heroMovie._id)}
                    onPlay={handlePlayMovie}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetails={setDetailMovie}
                    featuredMovies={featuredMovies}
                    onSelectHeroMovie={(m) => setSelectedHeroId(m._id)}
                  />
                )}

                {/* Continue Watching Row (personalized from watch history) */}
                {currentUser && history.length > 0 && (
                  <ContentRow
                    title="Continue Watching"
                    subtitle="Pick up where you left off"
                    badge="RESUME"
                    movies={history.map(h => h.content).filter(Boolean)}
                    favoritesSet={favoritesSet}
                    historyMap={historyMap}
                    onPlay={handlePlayMovie}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetails={setDetailMovie}
                    aspectRatio="backdrop"
                  />
                )}

                {/* Trending Now */}
                <ContentRow
                  title="Trending Blockbusters"
                  subtitle="Most viewed this week"
                  badge="HOT"
                  movies={[...movies].sort((a, b) => b.views - a.views)}
                  favoritesSet={favoritesSet}
                  historyMap={historyMap}
                  onPlay={handlePlayMovie}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={setDetailMovie}
                />

                {/* Sci-Fi & Cosmic */}
                <ContentRow
                  title="Sci-Fi & Cosmic Horizons"
                  movies={movies.filter(m => m.genres.some(g => g.toLowerCase().includes('sci-fi')))}
                  favoritesSet={favoritesSet}
                  historyMap={historyMap}
                  onPlay={handlePlayMovie}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={setDetailMovie}
                />

                {/* Action & Adrenaline */}
                <ContentRow
                  title="Action & High Stakes"
                  movies={movies.filter(m => m.genres.some(g => g.toLowerCase().includes('action')))}
                  favoritesSet={favoritesSet}
                  historyMap={historyMap}
                  onPlay={handlePlayMovie}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={setDetailMovie}
                />

                {/* Top Rated Masterpieces */}
                <ContentRow
                  title="Critically Acclaimed"
                  subtitle="8.0+ Stars"
                  badge="TOP"
                  movies={movies.filter(m => m.rating >= 8.0)}
                  favoritesSet={favoritesSet}
                  historyMap={historyMap}
                  onPlay={handlePlayMovie}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={setDetailMovie}
                />

                {/* Anime & Masterpiece Animation */}
                <ContentRow
                  title="Anime & Masterpiece Animation"
                  subtitle="Handcrafted animation & epic fantasy sagas"
                  badge="ANIME"
                  movies={movies.filter(m => m.genres.some(g => g.toLowerCase().includes('anime')))}
                  favoritesSet={favoritesSet}
                  historyMap={historyMap}
                  onPlay={handlePlayMovie}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={setDetailMovie}
                />
              </div>
            )}

            {/* VIEW 2: MOVIES CATALOG */}
            {activeTab === 'movies' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black text-white">Movie Catalog</h2>
                    <p className="text-xs text-gray-400">Showing {displayMovies.length} 4K Ultra HD titles</p>
                  </div>

                  {/* Mobile-First Scrollable Genre Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                      onClick={() => setSelectedGenre('All')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                        selectedGenre === 'All'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      All Genres
                    </button>
                    {genres.map(g => (
                      <button
                        key={g}
                        onClick={() => setSelectedGenre(g)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                          selectedGenre === g
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {displayMovies.map(movie => (
                    <MovieCard
                      key={movie._id}
                      movie={movie}
                      isFavorite={favoritesSet.has(movie._id)}
                      onPlay={handlePlayMovie}
                      onToggleFavorite={handleToggleFavorite}
                      onOpenDetails={setDetailMovie}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: SERIES */}
            {activeTab === 'series' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-white">Original Series & Seasons</h2>
                  <p className="text-xs text-gray-400">Episodic dramas and multi-season sagas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {series.map(s => (
                    <div key={s._id} className="p-3.5 sm:p-4 glass-card rounded-2xl flex gap-3.5 sm:gap-4 hover:border-red-500/30 transition-all">
                      <img src={s.poster} alt={s.title} className="w-24 sm:w-28 h-36 sm:h-40 object-cover rounded-xl shadow-lg flex-shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black">★ {s.rating}</span>
                          <span className="text-xs text-gray-400">{s.releaseYear} • {s.seasons.length} Seasons</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">{s.title}</h3>
                        <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{s.description}</p>
                        <div className="pt-1 sm:pt-2">
                          <span className="text-[11px] text-red-400 font-semibold">
                            {s.seasons.reduce((acc, sea) => acc + sea.episodes.length, 0)} Episodes Available
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: MY LIST / FAVORITES */}
            {activeTab === 'favorites' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-white">My Saved List</h2>
                  <p className="text-xs text-gray-400">Your personalized cinema bookmarks ({favorites.length} titles)</p>
                </div>

                {favorites.length === 0 ? (
                  <div className="text-center py-16 sm:py-20 glass-card rounded-2xl space-y-3 p-6 border-dashed">
                    <p className="text-base font-bold text-gray-300">Your list is currently empty</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Explore the catalog and tap the "+ Add to My List" button on any movie you want to save.
                    </p>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all active:scale-95"
                    >
                      Browse Cinema
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {favorites.map(item => (
                      <MovieCard
                        key={item._id}
                        movie={item.content}
                        isFavorite={true}
                        onPlay={handlePlayMovie}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenDetails={setDetailMovie}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 5: WATCH HISTORY */}
            {activeTab === 'history' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-white">Watch History</h2>
                  <p className="text-xs text-gray-400">Track your streaming progress and resume seamlessly</p>
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-16 sm:py-20 glass-card rounded-2xl space-y-3 p-6 border-dashed">
                    <p className="text-base font-bold text-gray-300">No watch history yet</p>
                    <p className="text-xs text-gray-500">Movies you watch will automatically remember your exact timestamp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {history.map(item => (
                      <MovieCard
                        key={item._id}
                        movie={item.content}
                        isFavorite={favoritesSet.has(item.content._id)}
                        onPlay={handlePlayMovie}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenDetails={setDetailMovie}
                        aspectRatio="backdrop"
                        progressPercentage={item.completionPercentage}
                        resumeSeconds={item.progress}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 6: ADMIN SUITE */}
            {activeTab === 'admin' && (
              <AdminPanel
                currentUser={currentUser}
                onClose={() => setActiveTab('home')}
                onRefreshMovies={loadContent}
                onAuthSuccess={(adminUser) => {
                  setCurrentUser(adminUser);
                  showToast(`Welcome Administrator: ${adminUser.name}`);
                }}
                onOpenAuth={() => setShowAuth(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenProfile={() => setShowProfile(true)}
        onOpenAuth={() => setShowAuth(true)}
        favoritesCount={favorites.length}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white text-sm">CINESPHERE</span>
          <span>• Production OTT Cinema Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/frontend/index.html" className="hover:text-white transition-colors">HTML Portal</a>
          <a href="/frontend/admin/dashboard.html" className="hover:text-amber-400 transition-colors">Admin Dashboard</a>
          <button onClick={() => setShowArchitecture(true)} className="hover:text-blue-400 transition-colors">Architecture Guide</button>
        </div>
      </footer>

      {/* Full Cinema Video Player Modal */}
      {activePlayerMovie && (
        <VideoPlayerModal
          movie={activePlayerMovie}
          initialResumeSeconds={playerResumeSeconds}
          onClose={() => setActivePlayerMovie(null)}
          onProgressSaved={loadUserData}
        />
      )}

      {/* Movie Details Modal */}
      {detailMovie && (
        <MovieDetailModal
          movie={detailMovie}
          isFavorite={favoritesSet.has(detailMovie._id)}
          currentUser={currentUser}
          onClose={() => setDetailMovie(null)}
          onPlay={handlePlayMovie}
          onToggleFavorite={handleToggleFavorite}
          onRequireAuth={() => setShowAuth(true)}
        />
      )}

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        movies={movies}
        favoritesSet={favoritesSet}
        onPlay={handlePlayMovie}
        onToggleFavorite={handleToggleFavorite}
        onOpenDetails={setDetailMovie}
        genres={genres}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentUser={currentUser}
        onUpdateUser={setCurrentUser}
        onLogout={handleLogout}
        onOpenSubscriptions={() => setShowSubscriptions(true)}
        history={history}
        favorites={favorites}
        onPlay={handlePlayMovie}
        onRefreshData={loadUserData}
        initialTab={profileInitialTab}
        onChangeProfilePicture={() => setShowAvatarModal(true)}
      />

      {/* Global DP / Profile Avatar Change Modal */}
      {currentUser && (
        <AvatarChangeModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentImage={currentUser.profileImage}
          userName={currentUser.name}
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            showToast('Profile picture updated across the platform!');
          }}
        />
      )}

      {/* Subscription Plans Modal */}
      <SubscriptionModal
        isOpen={showSubscriptions}
        onClose={() => setShowSubscriptions(false)}
        currentUser={currentUser}
        onSubscriptionUpdated={setCurrentUser}
        onRequireAuth={() => setShowAuth(true)}
      />

      {/* Notifications Dropdown */}
      <NotificationsDropdown
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onNotificationsChanged={loadUserData}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.name}!`);
        }}
      />

      {/* Architecture Explainer Modal */}
      <ArchitectureExplainerModal
        isOpen={showArchitecture}
        onClose={() => setShowArchitecture(false)}
      />
    </div>
  );
}
