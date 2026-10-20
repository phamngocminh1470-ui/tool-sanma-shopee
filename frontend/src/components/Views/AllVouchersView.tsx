import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Voucher, VoucherListResponse } from '../../types';
import { api } from '../../api/client';
import { FilterBar } from '../Common/FilterBar';
import { VoucherCard } from '../Common/VoucherCard';
import { VoucherDetailModal } from '../Common/VoucherDetailModal';

export const AllVouchersView: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [discountType, setDiscountType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('overall_score');
  const [minScore, setMinScore] = useState(0);

  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getVouchers({
        search,
        category,
        discount_type: discountType,
        status,
        sort_by: sortBy,
        order: 'desc',
        min_score: minScore > 0 ? minScore : undefined,
        page,
        page_size: pageSize,
      });
      setVouchers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      // Backend maybe loading
    } finally {
      setLoading(false);
    }
  }, [search, category, discountType, status, sortBy, minScore, page, pageSize]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setDiscountType('all');
    setStatus('all');
    setSortBy('overall_score');
    setMinScore(0);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Filter Bar */}
      <FilterBar
        search={search}
        setSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        category={category}
        setCategory={(val) => {
          setCategory(val);
          setPage(1);
        }}
        discountType={discountType}
        setDiscountType={(val) => {
          setDiscountType(val);
          setPage(1);
        }}
        status={status}
        setStatus={(val) => {
          setStatus(val);
          setPage(1);
        }}
        sortBy={sortBy}
        setSortBy={(val) => {
          setSortBy(val);
          setPage(1);
        }}
        minScore={minScore}
        setMinScore={(val) => {
          setMinScore(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          Hiển thị <span className="font-bold text-white font-mono">{vouchers.length}</span> /{' '}
          <span className="font-bold text-white font-mono">{total}</span> voucher tìm thấy
        </div>
      </div>

      {/* Voucher Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Không tìm thấy voucher phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy thử điều chỉnh lại bộ lọc hoặc bấm "Quét Ngay" để hệ thống tự động tìm thêm voucher mới từ Shopee.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold border border-indigo-500/40 transition-colors"
          >
            Đặt lại bộ lọc
          </button>
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

      {/* Pagination Controls */}
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

      {/* Detail Modal */}
      <VoucherDetailModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
