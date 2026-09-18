import React, { useState } from 'react';
import { Camera, User as UserIcon } from 'lucide-react';

export interface ProfileAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showEditOverlay?: boolean;
  onEditClick?: () => void;
  alt?: string;
  badge?: 'vip' | 'admin' | 'online' | null;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
};

const ICON_SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
};

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
  showEditOverlay = false,
  onEditClick,
  alt,
  badge = null
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'U';
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const iconSizeClass = ICON_SIZE_MAP[size] || ICON_SIZE_MAP.md;

  const imageSource = src && src.trim().length > 0 ? src : DEFAULT_AVATAR;

  return (
    <div
      className={`relative inline-block select-none flex-shrink-0 group ${onEditClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onEditClick}
      role={onEditClick ? 'button' : undefined}
      tabIndex={onEditClick ? 0 : undefined}
      aria-label={alt || `${name}'s Profile Picture`}
    >
      <div
        className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-red-950/60 via-[#182032] to-black border-2 border-white/15 group-hover:border-red-500/60 transition-all duration-200 shadow-md flex items-center justify-center`}
      >
        {!imgError && imageSource ? (
          <img
            src={imageSource}
            alt={alt || name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-red-600 to-amber-600 text-white font-extrabold shadow-inner">
            {initial || <UserIcon className={iconSizeClass} />}
          </div>
        )}

        {/* Hover / Click Edit Camera Overlay */}
        {showEditOverlay && (
          <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
            <Camera className={`${size === 'xl' || size === '2xl' ? 'w-6 h-6' : 'w-4 h-4'} text-white drop-shadow`} />
            {(size === 'xl' || size === '2xl') && (
              <span className="text-[10px] font-bold mt-1 text-gray-200 tracking-tight">Change</span>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      {badge === 'online' && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0a0d14]" />
      )}
      {badge === 'vip' && (
        <span className="absolute -top-1 -right-1 px-1 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-[8px] font-black text-black ring-1 ring-black">
          VIP
        </span>
      )}
    </div>
  );
};
