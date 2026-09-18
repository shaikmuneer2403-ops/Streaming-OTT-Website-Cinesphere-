import React, { useState } from 'react';
import {
  Play,
  Search,
  Bell,
  User as UserIcon,
  Shield,
  Crown,
  LogOut,
  ChevronDown,
  BookOpen,
  Home,
  Film,
  Tv,
  Bookmark,
  Clock,
  Sparkles,
  Camera,
  X
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileMenu } from './ProfileMenu';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenProfile: (initialTab?: 'overview' | 'history' | 'favorites' | 'security') => void;
  onOpenAuth: () => void;
  onOpenSubscriptions: () => void;
  onOpenArchitecture: () => void;
  onChangeProfilePicture?: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onLogout: () => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  genres: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenProfile,
  onOpenAuth,
  onOpenSubscriptions,
  onOpenArchitecture,
  onChangeProfilePicture,
  notifications,
  onOpenNotifications,
  onLogout,
  selectedGenre,
  onSelectGenre,
  genres
}) => {
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleGenreClick = (genre: string) => {
    onSelectGenre(genre);
    setShowGenreMenu(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
            <button
              onClick={() => { setActiveTab('home'); onSelectGenre('All'); }}
              className="flex items-center gap-2 sm:gap-2.5 group text-left cursor-pointer focus:outline-none"
              aria-label="CineSphere Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 via-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 active:scale-95 transition-transform">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center">
                  CINE<span className="text-red-500">SPHERE</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 tracking-widest block -mt-1 uppercase">
                  4K STREAMING
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-5 text-sm font-medium text-gray-300">
              <button
                onClick={() => { setActiveTab('home'); onSelectGenre('All'); }}
                className={`hover:text-white transition-colors py-1 relative ${
                  activeTab === 'home' && selectedGenre === 'All' ? 'text-white font-bold' : ''
                }`}
              >
                Home
                {activeTab === 'home' && selectedGenre === 'All' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => handleTabClick('movies')}
                className={`hover:text-white transition-colors py-1 relative ${
                  activeTab === 'movies' ? 'text-white font-bold' : ''
                }`}
              >
                Movies
                {activeTab === 'movies' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => handleTabClick('series')}
                className={`hover:text-white transition-colors py-1 relative ${
                  activeTab === 'series' ? 'text-white font-bold' : ''
                }`}
              >
                Series
                {activeTab === 'series' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Genres Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowGenreMenu(!showGenreMenu)}
                  className="flex items-center gap-1 hover:text-white transition-colors py-1 cursor-pointer"
                  aria-haspopup="true"
                  aria-expanded={showGenreMenu}
                >
                  <span>{selectedGenre === 'All' ? 'Genres' : selectedGenre}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showGenreMenu ? 'rotate-180' : ''}`} />
                </button>

                {showGenreMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-[#141b2a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl z-50 animate-scale-in">
                    <button
                      onClick={() => handleGenreClick('All')}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors ${
                        selectedGenre === 'All' ? 'text-red-400 font-bold bg-white/5' : 'text-gray-300'
                      }`}
                    >
                      All Genres
                    </button>
                    {genres.map(g => (
                      <button
                        key={g}
                        onClick={() => handleGenreClick(g)}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors ${
                          selectedGenre === g ? 'text-red-400 font-bold bg-white/5' : 'text-gray-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleTabClick('favorites')}
                className={`hover:text-white transition-colors py-1 relative ${
                  activeTab === 'favorites' ? 'text-white font-bold' : ''
                }`}
              >
                My List
                {activeTab === 'favorites' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => handleTabClick('history')}
                className={`hover:text-white transition-colors py-1 relative ${
                  activeTab === 'history' ? 'text-white font-bold' : ''
                }`}
              >
                Watch History
                {activeTab === 'history' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Right Tools & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Architecture Pill */}
            <button
              onClick={onOpenArchitecture}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="View Full-Stack Request Flow & Technical Architecture"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Architecture</span>
            </button>

            {/* Subscription VIP Button */}
            <button
              onClick={onOpenSubscriptions}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>VIP</span>
            </button>

            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-xl hover:bg-white/5 active:scale-90 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications Trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-xl hover:bg-white/5 active:scale-90 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Admin Portal / Console Button */}
            {currentUser?.role === 'admin' ? (
              <button
                onClick={() => handleTabClick('admin')}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Suite</span>
              </button>
            ) : (
              <button
                onClick={() => handleTabClick('admin')}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all"
              >
                Admin
              </button>
            )}

            {/* User Profile / Sign In */}
            {currentUser ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/5 hover:bg-white/10 hover:ring-2 hover:ring-red-500/40 border border-white/10 transition-all active:scale-95 cursor-pointer"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                  title="Your Profile & Settings"
                >
                  <ProfileAvatar
                    src={currentUser.profileImage}
                    name={currentUser.name}
                    size="sm"
                    badge={currentUser.subscription?.plan === 'PREMIUM' ? 'vip' : 'online'}
                  />
                  <span className="text-xs font-bold text-white max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                {/* Modern Profile Dropdown Menu */}
                <ProfileMenu
                  isOpen={isProfileMenuOpen}
                  onClose={() => setIsProfileMenuOpen(false)}
                  currentUser={currentUser}
                  onOpenMyProfile={() => onOpenProfile('overview')}
                  onOpenWatchlist={() => setActiveTab('favorites')}
                  onOpenSettings={() => onOpenProfile('security')}
                  onChangeProfilePicture={() => {
                    setIsProfileMenuOpen(false);
                    if (onChangeProfilePicture) onChangeProfilePicture();
                  }}
                  onLogout={onLogout}
                  onOpenSubscriptions={onOpenSubscriptions}
                />
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Animated Hamburger Button for Mobile & Tablet */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all focus:outline-none cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-5 h-4 relative flex flex-col justify-between items-center">
                <span
                  className={`w-5 h-0.5 bg-white rounded-full transform transition-all duration-300 ease-out origin-center ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`w-5 h-0.5 bg-white rounded-full transition-opacity duration-200 ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`w-5 h-0.5 bg-white rounded-full transform transition-all duration-300 ease-out origin-center ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Glassmorphic Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 sm:top-18 z-30 flex flex-col animate-fade-in">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative glass-drawer w-full max-h-[calc(100vh-4rem)] overflow-y-auto px-5 py-6 space-y-6 animate-fade-in-up">
            {/* Quick Search Bar */}
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenSearch(); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
            >
              <span className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-red-500" />
                <span>Search movies, series, directors...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-gray-300">⌘K</kbd>
            </button>

            {/* Primary Nav Links */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { handleTabClick('home'); onSelectGenre('All'); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'home' && selectedGenre === 'All'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleTabClick('movies')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'movies'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Movies</span>
              </button>

              <button
                onClick={() => handleTabClick('series')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'series'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Series</span>
              </button>

              <button
                onClick={() => handleTabClick('favorites')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'favorites'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>My List</span>
              </button>

              <button
                onClick={() => handleTabClick('history')}
                className={`col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Watch History & Resume</span>
              </button>
            </div>

            {/* Quick Genres Carousel Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Filter By Genre
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => handleGenreClick('All')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                    selectedGenre === 'All'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenreClick(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                      selectedGenre === g
                        ? 'bg-red-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* VIP Card */}
            <div
              onClick={() => { setMobileMenuOpen(false); onOpenSubscriptions(); }}
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-red-500/15 border border-amber-500/30 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-extrabold text-amber-300">CineSphere VIP</span>
                </div>
                <p className="text-[11px] text-gray-300">4K HDR, Dolby Atmos, and 4 Concurrent Screens</p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold shadow">
                Upgrade
              </span>
            </div>

            {/* Secondary Actions */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenArchitecture(); }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Technical Architecture Guide</span>
                </span>
                <span className="text-blue-400 text-[10px] font-bold">VIEW</span>
              </button>

              <button
                onClick={() => handleTabClick('admin')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Administrative Control Console</span>
                </span>
                <span className="text-[10px] font-bold uppercase">PORTAL</span>
              </button>
            </div>

            {/* User Session Bar in Mobile Drawer */}
            <div className="pt-2 border-t border-white/10">
              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <ProfileAvatar
                          src={currentUser.profileImage}
                          name={currentUser.name}
                          size="md"
                          showEditOverlay={true}
                          onEditClick={() => {
                            setMobileMenuOpen(false);
                            if (onChangeProfilePicture) onChangeProfilePicture();
                          }}
                        />
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            if (onChangeProfilePicture) onChangeProfilePicture();
                          }}
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center border border-[#101522]"
                          title="Change Profile Picture"
                        >
                          <Camera className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{currentUser.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Profile Actions for Mobile */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onChangeProfilePicture) onChangeProfilePicture();
                      }}
                      className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 active:scale-95 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 text-red-400" />
                      <span>Change DP</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenProfile('overview');
                      }}
                      className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 active:scale-95 transition-all"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>My Profile</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In or Create Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
