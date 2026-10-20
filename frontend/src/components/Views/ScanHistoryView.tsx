import React, { useState, useEffect } from 'react';
import { History, RefreshCw, CheckCircle2, AlertTriangle, Clock, Terminal } from 'lucide-react';
import { ScanRunLog } from '../../types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const ScanHistoryView: React.FC = () => {
  const { showToast } = useApp();
  const [runs, setRuns] = useState<ScanRunLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getScanHistory(50);
      setRuns(data);
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Lịch Sử Các Phiên Quét (Scan Audit Logs)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Toàn bộ lịch sử thu thập dữ liệu tự động và thủ công kèm thống kê chi tiết.
            </p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Tải lại lịch sử"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Phiên quét (Scan ID)</th>
                <th className="py-3.5 px-4">Hình thức</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Tìm thấy</th>
                <th className="py-3.5 px-4">Mới</th>
                <th className="py-3.5 px-4">Trùng</th>
                <th className="py-3.5 px-4">Thời gian xử lý</th>
                <th className="py-3.5 px-4">Tóm tắt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chưa có lịch sử phiên quét nào. Hãy nhấn "Quét Ngay" để khởi tạo phiên đầu tiên!
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-medium">
                      {new Date(r.started_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400">
                      {r.scan_id.substring(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                        {r.trigger_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{r.total_found}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">+{r.new_records}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{r.duplicates}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{r.duration_ms}ms</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {r.summary || 'Hoàn tất'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
