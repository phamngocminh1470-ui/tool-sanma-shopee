import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  Ticket,
  ArrowRight,
  Layers,
  Radio,
  Award,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { DashboardSummary, Voucher } from '../../types';
import { VoucherCard } from '../Common/VoucherCard';
import { VoucherDetailModal } from '../Common/VoucherDetailModal';
import { BrandLogo } from '../Common/BrandLogo';

export const DashboardView: React.FC = () => {
  const { setActiveTab, hunterStatus, triggerScan } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topVouchers, setTopVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const fetchData = async () => {
    try {
      const sum = await api.getDashboardSummary();
      setSummary(sum);
      const res = await api.getVouchers({ page_size: 6, sort_by: 'overall_score', order: 'desc' });
      setTopVouchers(res.items);
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Trigger */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 text-white shadow-2xl shadow-indigo-950/50">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold border border-indigo-500/30 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>AUTONOMOUS VOUCHER INTELLIGENCE PLATFORM</span>
            </span>
          </div>

          <div className="pt-1">
            <BrandLogo size="lg" showSubtitle={false} />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
            Nền Tảng Tự Động Săn & Giám Sát Voucher Shopee Việt Nam
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Tự động phát hiện theo thời gian thực từ 5 luồng sự kiện chính thức và cộng đồng săn deal. Phân loại chuẩn xác giữa mã nhập tay và voucher lưu banner khung giờ.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={triggerScan}
              disabled={hunterStatus?.is_scanning_now}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-950/60 border border-indigo-400/30 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${hunterStatus?.is_scanning_now ? 'animate-spin' : ''}`} />
              <span>{hunterStatus?.is_scanning_now ? 'Đang săn mã...' : 'Khởi động Quét Đa Nguồn'}</span>
            </button>
            <button
              onClick={() => setActiveTab('all_vouchers')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-bold border border-slate-700/80 backdrop-blur-md transition-all active:scale-95"
            >
              <span>Xem Kho Voucher ({summary?.total_vouchers || 0})</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Vouchers */}
        <div
          onClick={() => setActiveTab('all_vouchers')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:scale-102 shadow-lg hover:shadow-indigo-950/30"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Tổng Voucher</span>
            <Ticket className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{summary?.total_vouchers || 0}</div>
          <div className="text-[10px] text-cyan-400 font-semibold mt-1">Đang hoạt động</div>
        </div>

        {/* New 24h */}
        <div
          onClick={() => setActiveTab('new_vouchers')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:scale-102 shadow-lg hover:shadow-indigo-950/30"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Mới Trong 24H</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{summary?.new_24h || 0}</div>
          <div className="text-[10px] text-cyan-400 font-semibold mt-1">Khám phá tự động</div>
        </div>

        {/* Deep Discount */}
        <div
          onClick={() => setActiveTab('deep_discount')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:scale-102 shadow-lg hover:shadow-indigo-950/30"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Giảm Sâu</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary?.tiers.find(t => t.tier.includes('≥ 100K'))?.count || 0}
          </div>
          <div className="text-[10px] text-purple-400 font-semibold mt-1">Tiết kiệm lớn</div>
        </div>

        {/* Expiring Soon */}
        <div
          onClick={() => setActiveTab('expiring_soon')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:scale-102 shadow-lg hover:shadow-indigo-950/30"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Sắp Hết Hạn</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{summary?.expiring_soon_count || 0}</div>
          <div className="text-[10px] text-rose-400 font-semibold mt-1">Khẩn cấp &lt;24H</div>
        </div>

        {/* Quality Score */}
        <div
          onClick={() => setActiveTab('settings')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:scale-102 shadow-lg hover:shadow-indigo-950/30"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Điểm Chất Lượng</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {summary?.avg_voucher_score || 0}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Thuật toán 5 chiều</div>
        </div>

        {/* Connectors */}
        <div
          onClick={() => setActiveTab('sources')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all hover:scale-102 shadow-lg hover:shadow-indigo-950/30"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase">Nguồn Kết Nối</span>
            <Radio className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary?.active_connectors || 0}/{summary?.total_connectors || 5}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">100% Hoạt động</div>
        </div>
      </div>

      {/* Middle Section: Connectors Health & Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Phân Bố Voucher Theo Ngành Hàng
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Chi tiết →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary?.categories.map((c) => (
              <div
                key={c.category}
                onClick={() => setActiveTab('categories')}
                className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all"
              >
                <span className="text-xs text-slate-300 font-semibold truncate block">{c.category}</span>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="text-lg font-black text-white font-mono">{c.count}</span>
                  <span className="text-[10px] text-indigo-300 font-mono font-medium">{c.avg_score}đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connector Status Box */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Trạng Thái Nguồn (Sources)
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('sources')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Cấu hình →
            </button>
          </div>

          <div className="space-y-2.5">
            {summary?.connectors.map((conn) => (
              <div
                key={conn.id}
                className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="truncate mr-2">
                  <span className="font-semibold text-slate-200 block truncate">{conn.name}</span>
                  <span className="text-[10px] text-slate-400">Đã thu thập: {conn.total_found} mã</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Ranked Vouchers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Voucher Nổi Bật Được Xếp Hạng Cao Nhất
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('all_vouchers')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Xem tất cả voucher</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Voucher Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topVouchers.map((v) => (
            <VoucherCard
              key={v.id}
              voucher={v}
              onSelect={(item) => setSelectedVoucher(item)}
            />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <VoucherDetailModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
