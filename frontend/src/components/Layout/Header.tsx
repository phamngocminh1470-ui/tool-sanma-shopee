import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationDropdown } from './NotificationDropdown';
import { PublicLinkBadge } from '../Common/PublicLinkBadge';

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Bảng Điều Khiển Tổng Quan', subtitle: 'Giám sát toàn diện luồng voucher và sức khỏe hệ thống' },
  auto_hunter: { title: 'Auto Hunter Console', subtitle: 'Trung tâm điều khiển và giám sát săn voucher thời gian thực' },
  all_vouchers: { title: 'Tất Cả Voucher', subtitle: 'Kho dữ liệu voucher đầy đủ kèm bộ lọc đa chiều thông minh' },
  new_vouchers: { title: 'Voucher Mới Phát Hiện (24H)', subtitle: 'Các mã giảm giá mới vừa được hệ thống tự động khám phá' },
  deep_discount: { title: 'Voucher Giảm Sâu & Giá Trị Cao', subtitle: 'Các voucher có tỷ lệ giảm ≥ 20% hoặc giá trị ≥ 100.000Đ' },
  expiring_soon: { title: 'Voucher Sắp Hết Hạn', subtitle: 'Cảnh báo khẩn cấp các voucher hết hạn trong vòng 24 giờ tới' },
  verified: { title: 'Voucher Đã Xác Minh', subtitle: 'Các mã có bằng chứng áp dụng trực tiếp từ Shopee Mall & đối tác' },
  unverified: { title: 'Voucher Chưa Xác Minh', subtitle: 'Mã thu thập từ nguồn cộng đồng và đối chiếu chéo' },
  categories: { title: 'Voucher Theo Ngành Hàng', subtitle: 'Phân loại tự động theo Điện tử, Thời trang, Sắc đẹp, Mẹ & bé,...' },
  archive: { title: 'Kho Lưu Trữ & Hết Hạn', subtitle: 'Lưu trữ lịch sử voucher đã hết hạn phục vụ thống kê đối soát' },
  sources: { title: 'Quản Lý Nguồn (Multi-Source Connectors)', subtitle: 'Trạng thái và cấu hình kết nối các luồng dữ liệu' },
  history: { title: 'Lịch Sử Các Phiên Quét', subtitle: 'Nhật ký kiểm toán chi tiết từng lần thu thập' },
  notifications: { title: 'Trung Tâm Thông Báo', subtitle: 'Lịch sử cảnh báo và cấu hình thông báo Telegram' },
  reports: { title: 'Báo Cáo & Xuất Dữ Liệu', subtitle: 'Phân tích chỉ số tăng trưởng và xuất file CSV / JSON' },
  rules: { title: 'Trung Tâm Quy Tắc Tự Động (Rules)', subtitle: 'Tạo quy tắc tự động gắn thẻ, chấm điểm và thông báo' },
  settings: { title: 'Cài Đặt Hệ Thống & Trọng Số', subtitle: 'Hiệu chỉnh thuật toán xếp hạng và tham số vận hành' },
  health: { title: 'Tình Trạng & Hiệu Năng Hệ Thống', subtitle: 'Theo dõi tài nguyên CPU, RAM, SQLite WAL và dung lượng' },
  about: { title: 'Giới Thiệu & Bản Quyền', subtitle: 'TUẤN ANH STUDIO — Nền tảng tự động hóa săn voucher cao cấp' },
};

export const Header: React.FC = () => {
  const { activeTab, isDark, toggleTheme, unreadCount, hunterStatus, triggerScan } = useApp();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const pageInfo = TAB_TITLES[activeTab] || { title: 'Voucher Hunter', subtitle: 'TUẤN ANH STUDIO' };

  return (
    <header className="h-16 px-6 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
      {/* Title & Status */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2.5">
          <span>{pageInfo.title}</span>
          {hunterStatus?.is_scanning_now && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1.5"></span>
              ĐANG SĂN MÃ NỀN
            </span>
          )}
        </h2>
        <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xl">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Public Online Link Badge */}
        <PublicLinkBadge />

        {/* Instant Scan Button */}
        <button
          onClick={triggerScan}
          disabled={hunterStatus?.is_scanning_now}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all duration-150 ${
            hunterStatus?.is_scanning_now
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/30 border border-indigo-400/30 active:scale-95'
          }`}
          title="Kích hoạt quét toàn bộ connector ngay lập tức"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${hunterStatus?.is_scanning_now ? 'animate-spin' : ''}`} />
          <span>{hunterStatus?.is_scanning_now ? 'Đang săn mã...' : 'Quét Ngay'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
          title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {isDark ? <Sun className="w-4 h-4 text-cyan-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors relative"
            title="Xem thông báo hệ thống"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black flex items-center justify-center animate-bounce ring-2 ring-slate-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>
      </div>
    </header>
  );
};
