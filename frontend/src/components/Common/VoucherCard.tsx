import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Bookmark,
  Clock,
} from 'lucide-react';
import { Voucher } from '../../types';
import { ScoreBadge } from './ScoreBadge';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

interface Props {
  voucher: Voucher;
  onSelect?: (voucher: Voucher) => void;
  onSaveToggle?: (voucherId: number, isSaved: boolean) => void;
}

export const VoucherCard: React.FC<Props> = ({ voucher, onSelect, onSaveToggle }) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(voucher.is_saved_to_account);

  const tags: string[] = voucher.tags ? JSON.parse(voucher.tags) : [];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    showToast(`📋 Đã sao chép mã '${voucher.code}' vào bộ nhớ tạm!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleAccountSave(voucher.id);
      setIsSaved(res.is_saved_to_account);
      showToast(res.message);
      if (onSaveToggle) onSaveToggle(voucher.id, res.is_saved_to_account);
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const isBannerClaim =
    ['LƯU BANNER', 'SĂN KHUNG GIỜ', 'MÃ LIVE', 'MÃ VIDEO', 'MÃ SẴN VÍ', 'LƯU TRÊN APP', 'SHOPEE_LIVE', 'SHOPEE_SALE', 'LƯU FREESHIP', 'LƯU HOÀN XU'].includes(voucher.code) ||
    voucher.code.startsWith('LƯU') ||
    voucher.code.startsWith('MÃ') ||
    voucher.code.startsWith('SĂN');

  const handleOpenShopee = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isBannerClaim) {
      navigator.clipboard.writeText(voucher.code);
      showToast(`📋 Đã chép mã '${voucher.code}'! Đang mở Shopee... Hãy dán mã tại bước Thanh Toán!`);
    } else {
      showToast(`🎟️ Đang mở Shopee... Hãy bấm nút 'Lưu voucher' trên banner để đưa vào ví!`);
    }
    window.open(voucher.claim_url || voucher.source_url || 'https://shopee.vn', '_blank');
  };

  // Format discount badge text & gradient color
  let discountLabel = '';
  let badgeGradient = 'from-indigo-600 to-violet-600';

  if (voucher.discount_type === 'FREESHIP') {
    discountLabel = 'FREESHIP';
    badgeGradient = 'from-emerald-600 to-teal-600';
  } else if (voucher.discount_unit === '%') {
    discountLabel = `-${voucher.discount_value}%`;
    badgeGradient = 'from-indigo-600 to-violet-600';
  } else if (voucher.discount_unit === 'COIN') {
    discountLabel = `+${voucher.discount_value}% XU`;
    badgeGradient = 'from-amber-600 to-yellow-600';
  } else {
    discountLabel = `-${(voucher.discount_value / 1000).toLocaleString('vi-VN')}K`;
    badgeGradient = 'from-blue-600 to-cyan-600';
  }

  // Format expiry string
  const formatExpiry = (dtStr?: string) => {
    if (!dtStr) return 'Không giới hạn';
    const d = new Date(dtStr);
    const now = new Date();
    const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 3600));

    if (diffHours < 0) return 'Đã hết hạn';
    if (diffHours <= 24) return `Còn ${diffHours} giờ`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div
      onClick={() => onSelect && onSelect(voucher)}
      className="ticket-edge relative bg-slate-900/90 hover:bg-slate-900/95 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl p-4.5 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/40 cursor-pointer flex flex-col justify-between group overflow-hidden"
    >
      {/* Top row: Discount magnitude & Score */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider bg-gradient-to-r ${badgeGradient} text-white shadow-sm shadow-indigo-950/40`}>
              {discountLabel}
            </span>
            <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/60 truncate max-w-[125px]">
              {voucher.category}
            </span>
          </div>
          <ScoreBadge voucher={voucher} />
        </div>

        {/* Voucher Title & Description */}
        <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
          {voucher.program_name}
        </h3>
        {voucher.description && (
          <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {voucher.description}
          </p>
        )}

        {/* Voucher Code Box */}
        {isBannerClaim ? (
          <div className="mt-3.5 p-2 bg-cyan-950/30 border border-dashed border-cyan-800/70 rounded-xl flex items-center justify-between group-hover:border-cyan-500/60 transition-colors">
            <div className="flex items-center space-x-2 truncate">
              <span className="text-[10px] text-cyan-300 font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/60 font-mono">
                {voucher.code}
              </span>
              <span className="text-[11px] text-cyan-200/90 font-medium truncate">
                Lưu trên Shopee
              </span>
            </div>
            <button
              onClick={handleOpenShopee}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/40 transition-all shrink-0 active:scale-95"
              title="Mở banner Shopee để lưu voucher vào ví"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lưu mã</span>
            </button>
          </div>
        ) : (
          <div className="mt-3.5 p-2 bg-slate-950/80 border border-dashed border-indigo-500/40 rounded-xl flex items-center justify-between group-hover:border-indigo-400/60 transition-colors">
            <div className="flex items-center space-x-2 truncate">
              <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono px-1 py-0.5 rounded bg-indigo-950 border border-indigo-800/50">MÃ NHẬP TAY:</span>
              <span className="font-mono font-bold text-indigo-300 tracking-wider text-sm select-all">
                {voucher.code}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40'
              }`}
              title="Sao chép mã voucher"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>
        )}

        {/* Helpful Tip / Terms */}
        {voucher.terms && (
          <div className="mt-2 text-[10px] text-cyan-300/80 line-clamp-1 bg-cyan-950/20 px-2 py-0.5 rounded-md border border-cyan-800/30 flex items-center gap-1">
            <span className="shrink-0">💡</span>
            <span className="truncate">{voucher.terms}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-slate-500 py-0.5">+{tags.length - 3}</span>
          )}
        </div>
      </div>

      {/* Conditions, Expiration & Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Đơn tối thiểu:</span>
          <span className="font-semibold text-slate-200">
            {voucher.min_spend === 0 ? '0Đ (Không giới hạn)' : `${voucher.min_spend.toLocaleString('vi-VN')}Đ`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center space-x-1 text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Hạn dùng:</span>
          </span>
          <span className={`font-medium ${voucher.verification_status === 'EXPIRING_SOON' ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
            {formatExpiry(voucher.expires_at)}
          </span>
        </div>

        {/* Action Row */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={handleOpenShopee}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-700 hover:from-indigo-500 hover:to-cyan-600 text-white font-bold text-xs transition-all shadow-md shadow-indigo-950/60 border border-indigo-400/20 active:scale-95"
          >
            <span>{isBannerClaim ? 'Mở & Lưu Banner' : 'Chép mã & Đến Shopee'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleSave}
            className={`p-2.5 rounded-xl border transition-colors ${
              isSaved
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/80'
            }`}
            title={isSaved ? 'Đã lưu trong ví theo dõi' : 'Lưu vào ví theo dõi'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
