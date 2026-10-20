import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  ShieldCheck,
  History,
  FileCode,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { Voucher, VoucherHistory } from '../../types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

interface Props {
  voucher: Voucher | null;
  onClose: () => void;
}

export const VoucherDetailModal: React.FC<Props> = ({ voucher, onClose }) => {
  const { showToast } = useApp();
  const [history, setHistory] = useState<VoucherHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(voucher?.is_saved_to_account || false);

  useEffect(() => {
    if (voucher) {
      setIsSaved(voucher.is_saved_to_account);
      setLoadingHistory(true);
      api
        .getVoucherDetail(voucher.id)
        .then((res) => {
          setHistory(res.history || []);
        })
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [voucher]);

  if (!voucher) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    showToast(`Đã sao chép mã '${voucher.code}'!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenShopee = () => {
    window.open(voucher.claim_url || voucher.source_url || 'https://shopee.vn', '_blank');
  };

  const handleToggleSave = async () => {
    try {
      const res = await api.toggleAccountSave(voucher.id);
      setIsSaved(res.is_saved_to_account);
      showToast(res.message);
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    }
  };

  const tags: string[] = voucher.tags ? JSON.parse(voucher.tags) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-950/40">
              {voucher.discount_type}
            </span>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Điểm chất lượng: {voucher.overall_score}/100
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Main Title & Description */}
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
              {voucher.program_name}
            </h2>
            {voucher.description && (
              <p className="text-slate-400 mt-1.5 leading-relaxed text-xs">
                {voucher.description}
              </p>
            )}
          </div>

          {/* Voucher Code Box */}
          {(() => {
            const isBannerClaim =
              ['LƯU BANNER', 'SĂN KHUNG GIỜ', 'MÃ LIVE', 'MÃ VIDEO', 'MÃ SẴN VÍ', 'LƯU TRÊN APP', 'SHOPEE_LIVE', 'SHOPEE_SALE', 'LƯU FREESHIP', 'LƯU HOÀN XU'].includes(voucher.code) ||
              voucher.code.startsWith('LƯU') ||
              voucher.code.startsWith('MÃ') ||
              voucher.code.startsWith('SĂN');

            if (isBannerClaim) {
              return (
                <div className="space-y-3">
                  <div className="p-4 bg-cyan-950/40 border border-dashed border-cyan-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                        HÌNH THỨC SỬ DỤNG VOUCHER:
                      </span>
                      <div className="text-base font-bold text-cyan-200 mt-0.5 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-900/80 border border-cyan-600/60 text-cyan-300 font-mono text-sm">
                          {voucher.code}
                        </span>
                        <span>Lưu trực tiếp trên Shopee</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Voucher này áp dụng qua banner sự kiện hoặc link khuyến mãi, không cần nhập mã ký tự thủ công.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenShopee}
                      className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/30 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Mở trang & Lưu Banner</span>
                    </button>
                  </div>

                  {/* Step-by-step banner guide */}
                  <div className="p-3 bg-slate-950/70 border border-cyan-900/40 rounded-xl space-y-1 text-[11px] text-cyan-200/90">
                    <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Tại sao bấm vô có lúc không thấy voucher?</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px] pl-1">
                      <li><strong>Mã lưu banner:</strong> Bạn phải bấm nút <em>"Lưu"</em> trên banner Shopee thì voucher mới nạp vào Ví của bạn.</li>
                      <li><strong>Mã khung giờ vàng:</strong> Chỉ xuất hiện đúng các khung giờ (0h, 9h, 12h, 15h, 18h, 21h). Ngoài giờ đó Shopee có thể ẩn hoặc báo hết lượt.</li>
                    </ul>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950/80 border border-dashed border-indigo-500/40 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">MÃ NHẬP TAY SHOPEE:</span>
                    <div className="text-xl font-mono font-black text-indigo-300 select-all tracking-wider">
                      {voucher.code}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        copied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-950/50'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
                    </button>
                    <button
                      onClick={handleOpenShopee}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 shadow-md transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Xem sản phẩm áp dụng</span>
                    </button>
                  </div>
                </div>

                {/* Step-by-step code guide */}
                <div className="p-3 bg-slate-950/70 border border-indigo-900/40 rounded-xl space-y-1 text-[11px]">
                  <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Cách dùng mã nhập tay thành công 100%:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[11px] pl-1">
                    <li>Bấm nút <strong>"Sao chép mã"</strong> ở trên để lưu mã vào bộ nhớ tạm.</li>
                    <li>Bấm <strong>"Xem sản phẩm áp dụng"</strong> để chọn món hàng phù hợp với điều kiện voucher.</li>
                    <li>Tại bước <strong>Thanh toán (Checkout)</strong> trên Shopee, dán mã vào ô <em>"Shopee Voucher"</em> để áp dụng giảm giá ngay.</li>
                  </ol>
                </div>
              </div>
            );
          })()}

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Mức giảm:</span>
              <span className="text-white font-bold text-sm">
                {voucher.discount_unit === '%' ? `${voucher.discount_value}%` : `${voucher.discount_value.toLocaleString('vi-VN')} ${voucher.discount_unit}`}
              </span>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Đơn tối thiểu:</span>
              <span className="text-white font-bold text-sm">
                {voucher.min_spend === 0 ? '0Đ (Không giới hạn)' : `${voucher.min_spend.toLocaleString('vi-VN')}Đ`}
              </span>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Giảm tối đa:</span>
              <span className="text-white font-bold text-sm">
                {voucher.max_discount ? `${voucher.max_discount.toLocaleString('vi-VN')}Đ` : 'Không giới hạn'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Ngành hàng:</span>
              <span className="text-white font-semibold truncate block">{voucher.category}</span>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Phạm vi:</span>
              <span className="text-white font-semibold">{voucher.usage_scope}</span>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Nguồn thu thập:</span>
              <span className="text-cyan-400 font-semibold truncate block">{voucher.connector_name}</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Nhãn phân loại tự động:
            </span>
            <div className="flex flex-wrap gap-2">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Terms & Conditions */}
          {voucher.terms && (
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 block mb-1">
                Điều kiện sử dụng:
              </span>
              <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line">
                {voucher.terms}
              </p>
            </div>
          )}

          {/* Audit Trail & Change History */}
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nhật ký biến động dữ liệu (Audit Trail):</span>
            </div>
            {loadingHistory ? (
              <div className="text-center py-4 text-slate-400">Đang tải lịch sử...</div>
            ) : history.length === 0 ? (
              <div className="p-3 bg-slate-950/40 rounded-xl text-slate-400 text-center text-xs">
                Chưa có thay đổi điều kiện sau lần phát hiện đầu tiên.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {history.map((h) => (
                  <div key={h.id} className="p-2.5 bg-slate-950/40 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-cyan-400 mr-2">{h.change_type}</span>
                      <span className="text-slate-300">
                        {h.field_name}: <span className="line-through text-slate-400">{h.old_value || 'None'}</span> → <span className="text-emerald-400">{h.new_value}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(h.changed_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Fingerprint */}
          <div className="text-[10px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 truncate">
            SHA256 Fingerprint: {voucher.fingerprint}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={handleToggleSave}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              isSaved
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
            <span>{isSaved ? 'Đã lưu trong ví' : 'Lưu vào ví theo dõi'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(voucher.code);
                showToast(`Đã sao chép '${voucher.code}'! Đang mở Shopee...`);
                window.open(voucher.claim_url || voucher.source_url || 'https://shopee.vn', '_blank');
              }}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 border border-indigo-400/30 transition-all active:scale-95"
            >
              <span>Mở Shopee & Áp Dụng Ngay</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
