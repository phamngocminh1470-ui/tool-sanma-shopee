import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface FilterProps {
  search: string;
  setSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  discountType: string;
  setDiscountType: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  minScore: number;
  setMinScore: (val: number) => void;
  onReset: () => void;
  categoriesList?: string[];
}

export const FilterBar: React.FC<FilterProps> = ({
  search,
  setSearch,
  category,
  setCategory,
  discountType,
  setDiscountType,
  status,
  setStatus,
  sortBy,
  setSortBy,
  minScore,
  setMinScore,
  onReset,
  categoriesList = [],
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 backdrop-blur-xl">
      {/* Top search & quick sorts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="relative md:col-span-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã voucher, ngành hàng, tên chiến dịch..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          />
        </div>

        {/* Category filter */}
        <div className="md:col-span-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          >
            <option value="all">Tất cả ngành hàng</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Toàn sàn">Toàn sàn</option>
            <option value="Điện Tử & Công Nghệ">Điện Tử & Công Nghệ</option>
            <option value="Thời Trang & Làm Đẹp">Thời Trang & Làm Đẹp</option>
            <option value="Sức Khỏe & Sắc Đẹp">Sức Khỏe & Sắc Đẹp</option>
            <option value="Nhà Cửa & Đời Sống">Nhà Cửa & Đời Sống</option>
            <option value="Mẹ & Bé">Mẹ & Bé</option>
            <option value="Vận Chuyển Freeship">Vận Chuyển Freeship</option>
            <option value="Thanh Toán & Ví">Thanh Toán & Ví</option>
          </select>
        </div>

        {/* Discount Type filter */}
        <div className="md:col-span-2">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          >
            <option value="all">Mọi loại ưu đãi</option>
            <option value="FIXED_AMOUNT">Giảm tiền (VND)</option>
            <option value="PERCENTAGE">Giảm theo %</option>
            <option value="FREESHIP">Miễn phí ship</option>
            <option value="COIN_CASHBACK">Hoàn xu Shopee</option>
          </select>
        </div>

        {/* Sort by */}
        <div className="md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          >
            <option value="overall_score">Điểm cao nhất</option>
            <option value="discount_value">Mức giảm lớn nhất</option>
            <option value="min_spend">Đơn tối thiểu thấp</option>
            <option value="detected_at">Mới phát hiện</option>
            <option value="expires_at">Sắp hết hạn</option>
          </select>
        </div>
      </div>

      {/* Bottom secondary filters: Min Score & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center space-x-4">
          {/* Status chips */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-medium">Trạng thái:</span>
            {[
              { val: 'all', label: 'Tất cả' },
              { val: 'VERIFIED', label: 'Đã xác minh' },
              { val: 'UNVERIFIED', label: 'Chưa xác minh' },
              { val: 'EXPIRING_SOON', label: 'Sắp hết hạn' },
            ].map((chip) => (
              <button
                key={chip.val}
                onClick={() => setStatus(chip.val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  status === chip.val
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-sm shadow-indigo-950/50 border border-indigo-400/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Min score selector */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-slate-400">Điểm tối thiểu:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="accent-indigo-500 w-24 cursor-pointer"
            />
            <span className="font-mono text-cyan-300 font-bold">{minScore}+</span>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="flex items-center space-x-1 text-slate-400 hover:text-cyan-400 text-xs py-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại bộ lọc</span>
        </button>
      </div>
    </div>
  );
};
