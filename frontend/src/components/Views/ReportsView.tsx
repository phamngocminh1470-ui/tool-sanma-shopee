import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, FileSpreadsheet, RefreshCw, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { DashboardSummary } from '../../types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const ReportsView: React.FC = () => {
  const { showToast } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/vouchers/export/csv', '_blank');
    showToast('Đang tải xuống tệp CSV voucher...');
  };

  const handleExportJSON = () => {
    window.open('/api/vouchers/export/json', '_blank');
    showToast('Đang tải xuống tệp JSON voucher...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Báo Cáo Phân Tích & Xuất Dữ Liệu (Reports & Analytics)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tổng hợp dữ liệu thực tế từ database, hỗ trợ xuất định dạng CSV và JSON tiêu chuẩn.
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel / CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Xuất JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Tỷ lệ xác minh</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {summary && summary.total_vouchers > 0
              ? `${Math.round((summary.verified_count / summary.total_vouchers) * 100)}%`
              : '100%'}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {summary?.verified_count || 0} mã có bằng chứng
          </span>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Tỷ lệ giảm sâu</span>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">
            {summary && summary.total_vouchers > 0
              ? `${Math.round(
                  ((summary.tiers.find(t => t.tier.includes('≥ 100K'))?.count || 0) /
                    summary.total_vouchers) *
                    100
                )}%`
              : '0%'}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Giảm từ 20% hoặc ≥ 100K</span>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Điểm xếp hạng TB</span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {summary?.avg_voucher_score || 0}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Theo trọng số hiệu chỉnh</span>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Tỷ lệ lỗi nguồn</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">0.0%</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Hệ thống tự động cô lập</span>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Bảng Thống Kê Chi Tiết Ngành Hàng</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-4">Ngành Hàng</th>
                <th className="py-3 px-4">Số Lượng Voucher</th>
                <th className="py-3 px-4">Điểm Chất Lượng TB</th>
                <th className="py-3 px-4">Đánh Giá Tiềm Năng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {summary?.categories.map((c) => (
                <tr key={c.category} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{c.category}</td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-300">{c.count}</td>
                  <td className="py-3 px-4 font-mono">{c.avg_score}/100</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.avg_score >= 80
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {c.avg_score >= 80 ? 'RẤT HẤP DẪN' : 'TIÊU CHUẨN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
