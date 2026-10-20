import React, { useState, useEffect } from 'react';
import { Globe, Copy, Check, ExternalLink, QrCode, Power, Shield, Smartphone } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const PublicLinkBadge: React.FC = () => {
  const { showToast } = useApp();
  const [tunnel, setTunnel] = useState<{
    is_running: boolean;
    url: string | null;
    error: string | null;
  }>({
    is_running: false,
    url: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.getTunnelStatus();
      setTunnel(res);
    } catch {
      // Ignore network hiccup
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tunnel.url) {
      navigator.clipboard.writeText(tunnel.url);
      setCopied(true);
      showToast('📋 Đã sao chép Link Online công khai vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (tunnel.is_running) {
        await api.stopTunnel();
        showToast('Đã dừng chia sẻ Link Online.');
      } else {
        showToast('Đang kết nối Cloudflare tạo link online...');
        const res = await api.startTunnel();
        if (res.url) {
          showToast(`🟢 Link online đã sẵn sàng: ${res.url}`);
        }
      }
      await fetchStatus();
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top Header Pill */}
      <div className="flex items-center">
        {tunnel.is_running && tunnel.url ? (
          <div
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer transition-all shadow-sm shadow-emerald-950/40 group"
            title="Bấm để xem chi tiết Link Online và mã QR trên điện thoại"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-0.5"></span>
            <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden md:inline font-mono text-[11px] truncate max-w-[170px] text-emerald-200">
              {tunnel.url.replace('https://', '')}
            </span>
            <span className="md:hidden">Online</span>

            <button
              onClick={handleCopy}
              className="p-1 hover:bg-emerald-500/30 rounded-md transition-colors text-emerald-300"
              title="Sao chép link"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggle}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="Khởi tạo link HTTPS công khai để truy cập từ điện thoại hoặc mạng ngoài"
          >
            <Globe className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{loading ? 'Đang tạo link...' : 'Bật Link Online'}</span>
          </button>
        )}
      </div>

      {/* Modal / Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Đường Truyền Online Công Khai</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    Bảo mật Cloudflare HTTPS Toàn Cầu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* URL Display Box */}
            <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  LINK TRUY CẬP TỪ MỌI NƠI (ĐIỆN THOẠI / 4G / NGOÀI ĐƯỜNG):
                </span>
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  🟢 Hoạt động
                </span>
              </div>
              <div className="font-mono text-xs text-white break-all p-2 bg-slate-900/90 rounded-xl border border-slate-800 select-all">
                {tunnel.url}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleCopy()}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/50"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép link' : 'Sao chép link gửi điện thoại'}</span>
                </button>
                {tunnel.url && (
                  <a
                    href={tunnel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    title="Mở tab mới"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Guide to use on phone */}
            <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex items-start space-x-3 text-xs text-slate-300">
              <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-white text-xs">Mở trên điện thoại:</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gửi link này qua Zalo / Messenger cho bản thân, hoặc mở trên Safari / Chrome trên điện thoại. Bạn có thể theo dõi và săn voucher Shopee mọi lúc mọi nơi mà không cần ngồi trước máy tính!
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleToggle}
                disabled={loading}
                className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Dừng chia sẻ link</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
