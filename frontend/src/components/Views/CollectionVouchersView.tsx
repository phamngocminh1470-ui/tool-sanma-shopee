import React, { useState, useEffect } from 'react';
import { Ticket, Sparkles, Flame, Clock, CheckCircle2, HelpCircle, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { Voucher } from '../../types';
import { api } from '../../api/client';
import { VoucherCard } from '../Common/VoucherCard';
import { VoucherDetailModal } from '../Common/VoucherDetailModal';

interface Props {
  collectionName: 'new-24h' | 'deep-discount' | 'expiring-soon' | 'verified' | 'unverified' | 'archived';
  title: string;
  subtitle: string;
  icon: 'sparkles' | 'flame' | 'clock' | 'check' | 'help' | 'archive';
}

export const CollectionVouchersView: React.FC<Props> = ({
  collectionName,
  title,
  subtitle,
  icon,
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getCollection(collectionName, page, 24)
      .then((res) => {
        setVouchers(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [collectionName, page]);

  const renderIcon = () => {
    switch (icon) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'check':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'help':
        return <HelpCircle className="w-5 h-5 text-blue-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            {renderIcon()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-white font-mono">{total}</span>
          <span className="text-xs text-slate-400 block">Voucher tìm thấy</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Chưa có voucher trong danh mục này</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hệ thống đang quét liên tục từ Shopee VN. Các voucher phù hợp điều kiện sẽ tự động xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((v) => (
            <VoucherCard
              key={v.id}
              voucher={v}
              onSelect={(item) => setSelectedVoucher(item)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 px-3">
            Trang <strong className="text-white font-mono">{page}</strong> /{' '}
            <strong className="text-white font-mono">{totalPages}</strong>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <VoucherDetailModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
