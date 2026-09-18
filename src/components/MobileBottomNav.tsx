import React from 'react';
import { Home, Film, Tv, Bookmark, User as UserIcon, Shield } from 'lucide-react';
import { User } from '../types';
import { ProfileAvatar } from './ProfileAvatar';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  favoritesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenProfile,
  onOpenAuth,
  favoritesCount
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'Series', icon: Tv },
    { id: 'favorites', label: 'My List', icon: Bookmark, badge: favoritesCount > 0 ? favoritesCount : null },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0d14]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="grid grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isActive ? 'text-red-500 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black rounded-full px-1 min-w-[14px] h-[14px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}

        {/* 5th Tab: Profile or Auth */}
        <button
          onClick={currentUser ? onOpenProfile : onOpenAuth}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
            activeTab === 'profile' ? 'text-red-500 font-bold' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {currentUser ? (
            <ProfileAvatar
              src={currentUser.profileImage}
              name={currentUser.name}
              size="xs"
            />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-[50px]">
            {currentUser ? 'Profile' : 'Sign In'}
          </span>
        </button>
      </div>
    </div>
  );
};

