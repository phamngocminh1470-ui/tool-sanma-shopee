import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  CheckCheck,
  Trash2,
  RefreshCw,
  ExternalLink,
  Bot,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { SystemNotification } from '../../types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const NotificationCenterView: React.FC = () => {
  const { notifications, refreshNotifications, showToast, setActiveTab } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'VOUCHER_ALERT'>('ALL');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      if (s.telegram_chat_id) setChatId(s.telegram_chat_id);
    }).catch(() => {});
  }, []);

  const handleTestTelegram = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      showToast('⚠️ Vui lòng nhập đầy đủ Bot Token và Chat ID');
      return;
    }
    setTestingTelegram(true);
    try {
      const res = await api.testTelegram(botToken.trim(), chatId.trim());
      if (res.success) {
        showToast('🎉 Gửi tin nhắn Telegram thành công! Hãy kiểm tra ứng dụng Telegram.');
      } else {
        showToast(`❌ Thất bại: ${res.message}`);
      }
    } catch (e: any) {
      showToast(`Lỗi gửi: ${e.message}`);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSaveTelegram = async () => {
    try {
      await api.updateSettings({
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim(),
      });
      showToast('Đã lưu cấu hình Telegram thành công!');
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'VOUCHER_ALERT') return n.type === 'VOUCHER_ALERT';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Trung Tâm Thông Báo Đa Kênh (Smart Notification Center)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cảnh báo voucher điểm cao, thông báo voucher sắp hết hạn và đồng bộ Telegram bot tức thời.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            api.markAllNotificationsRead().then(() => {
              refreshNotifications();
              showToast('Đã đánh dấu tất cả là đã đọc');
            });
          }}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
        >
          <CheckCheck className="w-4 h-4 text-cyan-400" />
          <span>Đọc tất cả</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            {[
              { val: 'ALL', label: 'Tất cả thông báo' },
              { val: 'UNREAD', label: 'Chưa đọc' },
              { val: 'VOUCHER_ALERT', label: 'Cảnh báo voucher HOT' },
            ].map((tab) => (
              <button
                key={tab.val}
                onClick={() => setFilter(tab.val as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  filter === tab.val
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm border border-indigo-400/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List items */}
          <div className="space-y-2.5">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-xs text-slate-400">
                Không có thông báo nào trong mục này.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    !n.is_read
                      ? 'bg-slate-900 border-cyan-500/30 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold text-xs ${!n.is_read ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {n.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 block pt-1 font-mono">
                      {new Date(n.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={async () => {
                          await api.markNotificationRead(n.id);
                          refreshNotifications();
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await api.deleteNotification(n.id);
                        refreshNotifications();
                        showToast('Đã xóa thông báo');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Telegram Bot Integration Card */}
        <div className="lg:col-span-5 p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-xl h-fit">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Kết Nối Telegram Bot
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Nhận thông báo ngay lập tức về điện thoại hoặc máy tính khi phát hiện voucher HOT điểm cao hoặc voucher sắp hết hạn.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Telegram Bot Token:
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Telegram Chat ID:
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Ví dụ: 987654321 hoặc @your_channel"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Send className={`w-3.5 h-3.5 text-cyan-400 ${testingTelegram ? 'animate-bounce' : ''}`} />
                <span>{testingTelegram ? 'Đang gửi...' : 'Gửi Thử Nghiệm'}</span>
              </button>

              <button
                onClick={handleSaveTelegram}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 transition-colors"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>

          {/* Quick guide */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Hướng dẫn lấy Token & Chat ID:</span>
            <p>1. Mở Telegram, tìm <strong>@BotFather</strong> và gõ <code className="text-cyan-400">/newbot</code> để tạo bot và lấy Token.</p>
            <p>2. Nhắn tin bất kỳ cho bot vừa tạo, sau đó tìm <strong>@userinfobot</strong> để lấy Chat ID của bạn.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
