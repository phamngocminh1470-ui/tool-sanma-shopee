import React, { useState, useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { Voucher } from '../../types';
import { api } from '../../api/client';
import { VoucherCard } from '../Common/VoucherCard';
import { VoucherDetailModal } from '../Common/VoucherDetailModal';

const CATEGORIES = [
  'Toàn sàn',
  'Điện Tử & Công Nghệ',
  'Thời Trang & Làm Đẹp',
  'Sức Khỏe & Sắc Đẹp',
  'Nhà Cửa & Đời Sống',
  'Mẹ & Bé',
  'Vận Chuyển Freeship',
  'Thanh Toán & Ví',
];

export const CategoryVouchersView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Toàn sàn');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getVouchers({ category: activeCategory, page, page_size: 24 })
      .then((res) => {
        setVouchers(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Category Pills Header */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3 backdrop-blur-xl">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Chọn Ngành Hàng Shopee:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-950/60 scale-102 border border-indigo-400/30'
                  : 'bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          Ngành hàng <strong className="text-cyan-300 font-bold">{activeCategory}</strong>:{' '}
          <span className="font-bold text-white font-mono">{total}</span> voucher tìm thấy
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
          <h3 className="text-base font-bold text-white">Chưa có voucher trong ngành hàng này</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bộ quét đang tiếp tục phân tích dữ liệu Shopee. Hãy thử chuyển sang ngành hàng khác.
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
