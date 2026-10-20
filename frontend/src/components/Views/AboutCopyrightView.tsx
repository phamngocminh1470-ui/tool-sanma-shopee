import React from 'react';
import { ShieldCheck, Award, Code2, CheckCircle, Sparkles, Terminal } from 'lucide-react';
import { BrandLogo } from '../Common/BrandLogo';

export const AboutCopyrightView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Brand Hero Card with Official Typographic Identity */}
      <div className="p-8 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <BrandLogo size="xl" showSubtitle={true} />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                ULTRA EDITION v1.0.0
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl pt-1">
            Hệ thống độc lập tự động tìm kiếm, chuẩn hóa, phân loại, đánh giá, xếp hạng, theo dõi và quản lý voucher Shopee Việt Nam.
            Giải pháp triệt tiêu 100% các thao tác nhập tay, tìm nguồn phân tán, sao chép bảng tính và lọc thủ công.
          </p>

          <div className="pt-2 flex items-center space-x-2 text-xs font-mono text-cyan-300 font-bold">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>TUẤN ANH STUDIO — AUTOMATE THE SEARCH. ORGANIZE THE VALUE.</span>
          </div>
        </div>

        {/* Ambient Decorative Background Glows */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Principles & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase">
            <CheckCircle className="w-4 h-4" />
            <span>Tự Động Hóa Thực Tế</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Thu thập đa nguồn qua kiến trúc connector, tự deduplicate fingerprint và xếp hạng thuật toán không cần người dùng nhập liệu.
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Minh Bạch & An Toàn</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tuyệt đối không yêu cầu mật khẩu, OTP, không vượt CAPTCHA trái phép và không tạo số liệu giả để làm đẹp giao diện.
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase">
            <Award className="w-4 h-4" />
            <span>Xếp Hạng 5 Chiều</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Điểm chất lượng từ 0-100 đánh giá chuẩn xác mức tiết kiệm thực tế, độ tin cậy, phạm vi áp dụng, độ gấp thời hạn và xác minh.
          </p>
        </div>
      </div>

      {/* Copyright & Legal Statement */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 text-xs text-slate-400 leading-relaxed">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Thông Tin Bản Quyền & Tuyên Bố Thương Hiệu</span>
        </h3>

        <div className="space-y-2.5">
          <p>
            <strong>Bản quyền sở hữu trí tuệ:</strong> Phần mềm <em>TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA</em> thuộc quyền sở hữu của <strong>TUẤN ANH STUDIO</strong>. Mọi quyền được bảo lưu (All Rights Reserved).
          </p>
          <p>
            <strong>Tuyên bố thương hiệu:</strong> Logo, biểu tượng chữ và giao diện hệ thống được thiết kế độc quyền cho thương hiệu <strong>TUẤN ANH STUDIO</strong>. Mọi nhãn hiệu bên thứ ba (Shopee, các ngân hàng đối tác) thuộc về chủ sở hữu tương ứng.
          </p>
          <p>
            <strong>Kiến trúc kỹ thuật:</strong> Python FastAPI, SQLAlchemy 2.0 WAL SQLite, APScheduler, React 19, TypeScript, Vite, Tailwind CSS. Tối ưu hóa 100% cho máy tính cá nhân chạy Windows 10 và Windows 11.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Phát triển & Thiết kế độc quyền bởi <strong>TUẤN ANH STUDIO</strong></span>
          <span className="font-mono text-cyan-400">Phiên bản: 1.0.0-ULTRA (Build 2026)</span>
        </div>
      </div>
    </div>
  );
};
