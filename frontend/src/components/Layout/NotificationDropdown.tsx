import React from 'react';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<Props> = ({ isOpen, onClose }) => {
  const { notifications, refreshNotifications, showToast, setActiveTab } = useApp();

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      refreshNotifications();
      showToast('Đã đánh dấu tất cả là đã đọc');
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    }
  };

  const handleItemClick = async (notif: any) => {
    if (!notif.is_read) {
      await api.markNotificationRead(notif.id);
      refreshNotifications();
    }
    if (notif.voucher_id) {
      setActiveTab('all_vouchers');
    }
    onClose();
  };

  return (
    <div className="absolute right-0 top-12 w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Thông Báo Hệ Thống</span>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center space-x-1 transition-colors"
          title="Đánh dấu tất cả đã đọc"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Đọc hết</span>
        </button>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Không có thông báo mới nào
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-3.5 text-xs cursor-pointer transition-colors hover:bg-slate-800/50 ${
                !n.is_read ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`font-semibold text-xs ${!n.is_read ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {n.title}
                </span>
                <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                  {new Date(n.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">{n.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/40 text-center">
        <button
          onClick={() => {
            setActiveTab('notifications');
            onClose();
          }}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold py-1 transition-colors"
        >
          Xem tất cả trong Trung Tâm Thông Báo →
        </button>
      </div>
    </div>
  );
};
