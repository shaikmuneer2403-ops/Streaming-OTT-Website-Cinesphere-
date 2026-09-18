import React from 'react';
import { X, CheckCheck, Bell, Film, MessageSquare, AlertCircle, Crown } from 'lucide-react';
import { NotificationItem } from '../types';
import { apiClient } from '../services/api';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onNotificationsChanged: () => void;
  onSelectNotification?: (link: string) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationsChanged,
  onSelectNotification
}) => {
  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      onNotificationsChanged();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      onNotificationsChanged();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className="w-4 h-4 text-red-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'subscription':
        return <Crown className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-4 sm:p-6 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#111622] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#182032] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-bold">
              {notifications.filter(n => !n.read).length} new
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              No notifications yet. You're completely up to date!
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.read) handleMarkAsRead(notif._id);
                  if (onSelectNotification && notif.link) onSelectNotification(notif.link);
                }}
                className={`p-4 flex gap-3 cursor-pointer transition-colors ${
                  notif.read ? 'bg-transparent hover:bg-white/[0.02]' : 'bg-red-500/[0.06] hover:bg-red-500/[0.1]'
                }`}
              >
                <div className="p-2 rounded-lg bg-white/5 h-fit flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-gray-500 block pt-0.5">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
