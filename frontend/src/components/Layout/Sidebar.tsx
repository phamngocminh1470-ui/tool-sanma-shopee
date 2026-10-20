import React from 'react';
import {
  LayoutDashboard,
  Crosshair,
  Ticket,
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  HelpCircle,
  Layers,
  Archive,
  Radio,
  History,
  Bell,
  BarChart3,
  Sliders,
  Settings,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ViewTab } from '../../types';
import { BrandLogo } from '../Common/BrandLogo';

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, unreadCount, hunterStatus } = useApp();

  const navGroups: { group: string; items: NavItem[] }[] = [
    {
      group: 'TRUNG TÂM VẬN HÀNH',
      items: [
        { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
        {
          id: 'auto_hunter',
          label: 'Auto Hunter Console',
          icon: Crosshair,
          badge: hunterStatus?.is_scanning_now ? 'SCANNING' : 'ONLINE',
          badgeColor: hunterStatus?.is_scanning_now ? 'bg-cyan-500 animate-pulse text-slate-950 font-bold' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        },
      ],
    },
    {
      group: 'BỘ SƯU TẬP VOUCHER',
      items: [
        { id: 'all_vouchers', label: 'Tất cả Voucher', icon: Ticket },
        { id: 'new_vouchers', label: 'Voucher mới 24h', icon: Sparkles, badge: 'HOT', badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold' },
        { id: 'deep_discount', label: 'Voucher giảm sâu', icon: Flame, badge: 'ƯU TIÊN', badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold' },
        { id: 'expiring_soon', label: 'Sắp hết hạn', icon: Clock, badge: 'GẤP', badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold' },
        { id: 'verified', label: 'Đã xác minh', icon: CheckCircle2 },
        { id: 'unverified', label: 'Chưa xác minh', icon: HelpCircle },
        { id: 'categories', label: 'Theo ngành hàng', icon: Layers },
        { id: 'archive', label: 'Kho lưu trữ', icon: Archive },
      ],
    },
    {
      group: 'NGUỒN & HOẠT ĐỘNG',
      items: [
        { id: 'sources', label: 'Quản lý nguồn (Sources)', icon: Radio },
        { id: 'history', label: 'Lịch sử phiên quét', icon: History },
        {
          id: 'notifications',
          label: 'Trung tâm thông báo',
          icon: Bell,
          badge: unreadCount > 0 ? String(unreadCount) : undefined,
          badgeColor: 'bg-indigo-500 text-white font-bold shadow-sm shadow-indigo-500/50',
        },
        { id: 'reports', label: 'Báo cáo & Xuất file', icon: BarChart3 },
      ],
    },
    {
      group: 'HỆ THỐNG & CÀI ĐẶT',
      items: [
        { id: 'rules', label: 'Quy tắc tự động', icon: Sliders },
        { id: 'settings', label: 'Cài đặt & Trọng số', icon: Settings },
        { id: 'health', label: 'Sức khỏe hệ thống', icon: Activity },
        { id: 'about', label: 'Bản quyền & Giới thiệu', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-30 select-none backdrop-blur-xl">
      {/* Brand Header with Custom Typographic Logo */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-transparent">
        <BrandLogo size="md" showSubtitle={true} />
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {group.group}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-700 text-white shadow-md shadow-indigo-950/60 font-semibold border border-indigo-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-cyan-200' : 'text-slate-400 group-hover:text-cyan-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Branding & Status */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${hunterStatus?.scheduler_running ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50 animate-pulse' : 'bg-slate-600'}`}></span>
            <span className="text-slate-300 font-medium text-xs">
              {hunterStatus?.is_scanning_now ? 'Đang săn mã...' : hunterStatus?.scheduler_running ? 'Hệ thống tự động' : 'Tạm dừng'}
            </span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">15m cycle</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono tracking-tight">
          Bản quyền © TUẤN ANH STUDIO
        </p>
      </div>
    </aside>
  );
};
