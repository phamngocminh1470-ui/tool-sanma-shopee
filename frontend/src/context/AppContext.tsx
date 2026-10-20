import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ViewTab, SystemNotification } from '../types';
import { api } from '../api/client';

interface AppContextType {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  notifications: SystemNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  hunterStatus: any;
  refreshHunterStatus: () => Promise<void>;
  triggerScan: () => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('shopee_hunter_theme');
    return saved ? saved === 'dark' : true;
  });
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [hunterStatus, setHunterStatus] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark theme to DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('shopee_hunter_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('shopee_hunter_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications(30);
      setNotifications(data);
    } catch (e) {
      // Backend may be starting up
    }
  }, []);

  const refreshHunterStatus = useCallback(async () => {
    try {
      const data = await api.getHunterStatus();
      setHunterStatus(data);
    } catch (e) {
      // Backend may be starting up
    }
  }, []);

  const triggerScan = async () => {
    try {
      showToast('⚡ Đang khởi động tiến trình quét đa nguồn...');
      const res = await api.triggerScanNow();
      if (res.success) {
        showToast(`✅ Quét hoàn tất! Tìm thấy ${res.total_found} voucher (${res.new_records} mới).`);
      } else {
        showToast(`⚠️ ${res.message}`);
      }
      refreshHunterStatus();
      refreshNotifications();
    } catch (e: any) {
      showToast(`❌ Lỗi quét: ${e.message}`);
    }
  };

  useEffect(() => {
    refreshNotifications();
    refreshHunterStatus();

    // Polling every 10 seconds for real-time background scanner sync
    const interval = setInterval(() => {
      refreshHunterStatus();
      refreshNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshNotifications, refreshHunterStatus]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isDark,
        toggleTheme,
        notifications,
        unreadCount,
        refreshNotifications,
        hunterStatus,
        refreshHunterStatus,
        triggerScan,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
