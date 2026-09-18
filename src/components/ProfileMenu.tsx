import React, { useRef, useEffect } from 'react';
import {
  User as UserIcon,
  Bookmark,
  Settings,
  Camera,
  LogOut,
  Crown,
  ChevronRight,
  Shield
} from 'lucide-react';
import { User } from '../types';
import { ProfileAvatar } from './ProfileAvatar';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenMyProfile: () => void;
  onOpenWatchlist: () => void;
  onOpenSettings: () => void;
  onChangeProfilePicture: () => void;
  onLogout: () => void;
  onOpenSubscriptions?: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenMyProfile,
  onOpenWatchlist,
  onOpenSettings,
  onChangeProfilePicture,
  onLogout,
  onOpenSubscriptions
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const plan = currentUser.subscription?.plan || 'FREE';

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-3 w-72 sm:w-80 bg-[#101522] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-scale-in text-left divide-y divide-white/10"
      role="menu"
      aria-label="User account menu"
    >
      {/* User Header Section with Profile DP & Info */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="flex items-center gap-3.5">
          {/* Clickable Profile DP with Edit Badge */}
          <div className="relative group">
            <ProfileAvatar
              src={currentUser.profileImage}
              name={currentUser.name}
              size="lg"
              showEditOverlay={true}
              onEditClick={() => {
                onClose();
                onChangeProfilePicture();
              }}
              badge={currentUser.subscription?.plan === 'PREMIUM' ? 'vip' : 'online'}
            />
            <button
              onClick={() => {
                onClose();
                onChangeProfilePicture();
              }}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center border border-[#101522] shadow transition-transform group-hover:scale-110"
              title="Change Profile Picture"
              aria-label="Change Profile Picture"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white truncate leading-tight">
                {currentUser.name}
              </h4>
              {currentUser.role === 'admin' && (
                <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {currentUser.email}
            </p>

            {/* Plan Badge */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600/20 to-amber-600/20 border border-red-500/30 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                {plan} TIER
              </span>
              {onOpenSubscriptions && plan !== 'PREMIUM' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSubscriptions();
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold underline"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Options */}
      <div className="py-2 px-2 space-y-0.5">
        {/* Change Profile Picture Action Button */}
        <button
          onClick={() => {
            onClose();
            onChangeProfilePicture();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <span>Change Profile Picture</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
        </button>

        {/* My Profile */}
        <button
          onClick={() => {
            onClose();
            onOpenMyProfile();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/5 text-gray-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <span>My Profile</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
        </button>

        {/* Watchlist */}
        <button
          onClick={() => {
            onClose();
            onOpenWatchlist();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/5 text-gray-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
            <span>Watchlist / My List</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/5 text-gray-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <span>Settings & Security</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Logout Action */}
      <div className="p-2">
        <button
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
