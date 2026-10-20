import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';

import { DashboardView } from './components/Views/DashboardView';
import { AutoHunterView } from './components/Views/AutoHunterView';
import { AllVouchersView } from './components/Views/AllVouchersView';
import { CollectionVouchersView } from './components/Views/CollectionVouchersView';
import { CategoryVouchersView } from './components/Views/CategoryVouchersView';
import { SourceManagerView } from './components/Views/SourceManagerView';
import { ScanHistoryView } from './components/Views/ScanHistoryView';
import { NotificationCenterView } from './components/Views/NotificationCenterView';
import { ReportsView } from './components/Views/ReportsView';
import { AutomationRulesView } from './components/Views/AutomationRulesView';
import { SettingsView } from './components/Views/SettingsView';
import { SystemHealthView } from './components/Views/SystemHealthView';
import { AboutCopyrightView } from './components/Views/AboutCopyrightView';

export const MainApp: React.FC = () => {
  const { activeTab, toastMessage } = useApp();

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'auto_hunter':
        return <AutoHunterView />;
      case 'all_vouchers':
        return <AllVouchersView />;
      case 'new_vouchers':
        return (
          <CollectionVouchersView
            collectionName="new-24h"
            title="Voucher Mới Phát Hiện Trong 24H"
            subtitle="Các mã ưu đãi mới nhất vừa được hệ thống phát hiện và chuẩn hóa"
            icon="sparkles"
          />
        );
      case 'deep_discount':
        return (
          <CollectionVouchersView
            collectionName="deep-discount"
            title="Voucher Giảm Sâu & Mức Giảm Cực Cao"
            subtitle="Danh sách các mã giảm từ 20% hoặc có giá trị giảm từ 100.000Đ"
            icon="flame"
          />
        );
      case 'expiring_soon':
        return (
          <CollectionVouchersView
            collectionName="expiring-soon"
            title="Voucher Sắp Hết Hạn (&lt; 24 Giờ)"
            subtitle="Khẩn cấp: Sử dụng ngay trước khi voucher hết hạn hoặc hết lượt"
            icon="clock"
          />
        );
      case 'verified':
        return (
          <CollectionVouchersView
            collectionName="verified"
            title="Voucher Đã Xác Minh"
            subtitle="Mã ưu đãi chính thức từ Shopee Mall, ngân hàng đối tác và kênh đã xác thực"
            icon="check"
          />
        );
      case 'unverified':
        return (
          <CollectionVouchersView
            collectionName="unverified"
            title="Voucher Chưa Xác Minh (Cộng Đồng)"
            subtitle="Mã thu thập từ nguồn chia sẻ cộng đồng, blog deal và đối chiếu chéo"
            icon="help"
          />
        );
      case 'categories':
        return <CategoryVouchersView />;
      case 'archive':
        return (
          <CollectionVouchersView
            collectionName="archived"
            title="Kho Lưu Trữ Voucher Đã Hết Hạn"
            subtitle="Hồ sơ lịch sử voucher đã hết hạn phục vụ thống kê và chu kỳ lặp lại"
            icon="archive"
          />
        );
      case 'sources':
        return <SourceManagerView />;
      case 'history':
        return <ScanHistoryView />;
      case 'notifications':
        return <NotificationCenterView />;
      case 'reports':
        return <ReportsView />;
      case 'rules':
        return <AutomationRulesView />;
      case 'settings':
        return <SettingsView />;
      case 'health':
        return <SystemHealthView />;
      case 'about':
        return <AboutCopyrightView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-950/40 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
