import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Shield, Crown, Clock, Heart, Key, LogOut, Trash2, Play, Camera, Sparkles, Image as ImageIcon } from 'lucide-react';
import { User, WatchHistoryItem, FavoriteItem, Movie } from '../types';
import { apiClient } from '../services/api';
import { ProfileAvatar } from './ProfileAvatar';
import { AvatarChangeModal } from './AvatarChangeModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  onOpenSubscriptions: () => void;
  history: WatchHistoryItem[];
  favorites: FavoriteItem[];
  onPlay: (movie: Movie) => void;
  onRefreshData: () => void;
  initialTab?: 'overview' | 'history' | 'favorites' | 'security';
  onChangeProfilePicture?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  onOpenSubscriptions,
  history,
  favorites,
  onPlay,
  onRefreshData,
  initialTab = 'overview',
  onChangeProfilePicture
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'favorites' | 'security'>(initialTab);
  const [name, setName] = useState(currentUser?.name || '');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (currentUser) setName(currentUser.name);
    }
  }, [isOpen, initialTab, currentUser]);

  if (!isOpen || !currentUser) return null;

  const showNotice = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const profileImage = avatarSeed
        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`
        : undefined;

      const res = await apiClient.updateProfile({ name, profileImage });
      onUpdateUser(res.user);
      showNotice('Profile updated successfully!');
    } catch (err: any) {
      showNotice(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      showNotice('Password changed securely.');
    } catch (err: any) {
      showNotice(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await apiClient.deleteHistoryItem(id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Clear your entire watch history?')) return;
    try {
      await apiClient.clearHistory();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await apiClient.removeFavorite(id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="relative w-full max-w-3xl bg-[#0d111a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-8 flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-[#111622] p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="relative inline-block mx-auto group">
                <ProfileAvatar
                  src={currentUser.profileImage}
                  name={currentUser.name}
                  size="xl"
                  showEditOverlay={true}
                  onEditClick={() => setIsAvatarModalOpen(true)}
                  badge={currentUser.subscription?.plan === 'PREMIUM' ? 'vip' : 'online'}
                />
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg border-2 border-[#111622] transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Change Profile Picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
                <span className="text-xs text-gray-400 block truncate">{currentUser.email}</span>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                    {currentUser.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    Change DP
                  </button>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'overview' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Account Info</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'history' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Watch History ({history.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'favorites' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>My List ({favorites.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'security' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Security</span>
              </button>
            </nav>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 border border-red-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-h-[75vh]">
          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in">
              {message}
            </div>
          )}

          {/* Overview & Subscription */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Account Details</h3>
                <p className="text-xs text-gray-400">Manage your subscription and profile persona.</p>
              </div>

              {/* Current Subscription Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-red-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3 h-3" /> ACTIVE SUBSCRIPTION
                  </span>
                  <div className="text-base font-extrabold text-white">
                    {currentUser.subscription?.plan || 'FREE'} PASS
                  </div>
                  <div className="text-xs text-gray-300">
                    Status: <span className="text-emerald-400 font-semibold">{currentUser.subscription?.status || 'Active'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSubscriptions();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white text-xs font-bold shadow-md hover:scale-105 transition-all"
                >
                  Change Plan
                </button>
              </div>

              {/* Profile Avatar & DP Management Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar
                      src={currentUser.profileImage}
                      name={currentUser.name}
                      size="lg"
                      showEditOverlay={true}
                      onEditClick={() => setIsAvatarModalOpen(true)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Profile Display Picture (DP)</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          LIVE
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Upload custom photos, crop your picture, or choose from popular anime and cinema presets.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Change Profile DP</span>
                  </button>
                </div>
              </div>

              {/* Profile Editor */}
              <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Avatar Persona Generator (type any keyword)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={avatarSeed}
                      onChange={(e) => setAvatarSeed(e.target.value)}
                      placeholder="e.g. Neo, Cyber, Jedi, Phoenix..."
                      className="flex-1 bg-[#182032] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium"
                    >
                      Randomize
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Watch History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Watch History</h3>
                  <p className="text-xs text-gray-400">Continue watching and review your streaming history</p>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  Your watch history is empty. Start streaming a movie!
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.content.backdrop || item.content.poster}
                          alt={item.content.title}
                          className="w-16 h-10 object-cover rounded-lg flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">{item.content.title}</h4>
                          <span className="text-[10px] text-gray-400">
                            {item.completionPercentage}% watched • {Math.floor(item.progress / 60)}m {item.progress % 60}s
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            onPlay(item.content);
                          }}
                          className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white"
                          title="Resume"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteHistory(item._id)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites / My List */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">My List</h3>
                <p className="text-xs text-gray-400">Cinema titles you have bookmarked for later</p>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No movies in your list yet. Click "+ Add to My List" on any title!
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.content.poster}
                          alt={item.content.title}
                          className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.content.title}</h4>
                          <span className="text-[10px] text-gray-400">
                            {item.content.releaseYear} • {item.content.genres.slice(0, 2).join(' • ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            onPlay(item.content);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFavorite(item._id)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Security & Password</h3>
                <p className="text-xs text-gray-400">Update your security credentials</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">New Password (min 6 characters)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Profile DP Change Modal (Upload, Crop, Anime & Cinema Presets) */}
      <AvatarChangeModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentImage={currentUser.profileImage}
        userName={currentUser.name}
        onSave={(updatedUser) => {
          onUpdateUser(updatedUser);
          showNotice('Profile picture updated successfully across the platform!');
        }}
      />
    </div>
  );
};
