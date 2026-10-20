import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, CheckCircle2, XCircle, Power, Play, AlertCircle, Settings, Globe } from 'lucide-react';
import { Connector } from '../../types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const SourceManagerView: React.FC = () => {
  const { showToast } = useApp();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      const data = await api.getConnectors();
      setConnectors(data);
    } catch (e: any) {
      showToast(`Lỗi tải nguồn: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleToggle = async (c: Connector) => {
    try {
      const res = await api.updateConnector(c.id, { is_enabled: !c.is_enabled });
      showToast(`${res.name} đã được ${res.is_enabled ? 'BẬT' : 'TẮT'}`);
      fetchConnectors();
    } catch (e: any) {
      showToast(`Lỗi cập nhật: ${e.message}`);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testConnector(id);
      if (res.success) {
        showToast(`✅ [${id}] Kết nối thành công! Tìm thấy ${res.records_found} bản ghi (${res.duration_ms}ms)`);
      } else {
        showToast(`❌ [${id}] Thất bại: ${res.message}`);
      }
      fetchConnectors();
    } catch (e: any) {
      showToast(`Lỗi test: ${e.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      const res = await api.runConnector(id);
      if (res.success) {
        showToast(`⚡ Quét xong nguồn: ${res.new_records} mới, ${res.total_found} bản ghi.`);
      } else {
        showToast(`⚠️ Không thể quét: ${res.error}`);
      }
      fetchConnectors();
    } catch (e: any) {
      showToast(`Lỗi quét: ${e.message}`);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Quản Lý Nguồn Thu Thập (Multi-Source Connectors)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kiến trúc Plugin Connector thu thập dữ liệu độc lập, tự động cô lập lỗi và phục hồi.
            </p>
          </div>
        </div>
        <button
          onClick={fetchConnectors}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Tải lại danh sách nguồn"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectors.map((c) => (
          <div
            key={c.id}
            className={`p-5 rounded-3xl border transition-all shadow-xl bg-slate-900/90 flex flex-col justify-between ${
              c.is_enabled ? 'border-slate-800 hover:border-cyan-500/40' : 'border-slate-800/60 opacity-60'
            }`}
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{c.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      {c.connector_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {c.description || 'Nguồn thu thập voucher Shopee'}
                  </p>
                </div>

                <button
                  onClick={() => handleToggle(c)}
                  className={`p-2 rounded-xl transition-colors ${
                    c.is_enabled
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                  title={c.is_enabled ? 'Đang BẬT - Nhấn để TẮT' : 'Đang TẮT - Nhấn để BẬT'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              {/* Endpoint display */}
              <div className="mt-3 p-2 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-400 font-mono truncate">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{c.endpoint_url}</span>
              </div>

              {/* Statistics Ribbon */}
              <div className="grid grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-slate-800/80 text-center">
                <div className="p-2 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Tổng quét</span>
                  <span className="font-mono font-bold text-white text-xs">{c.total_found}</span>
                </div>
                <div className="p-2 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Mới</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">{c.new_records}</span>
                </div>
                <div className="p-2 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Trùng</span>
                  <span className="font-mono font-bold text-slate-400 text-xs">{c.duplicates_count}</span>
                </div>
                <div className="p-2 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Độ trễ</span>
                  <span className="font-mono font-bold text-slate-300 text-xs">{c.avg_duration_ms}ms</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-400">
                Chạy gần nhất:{' '}
                <strong className="text-slate-300">
                  {c.last_run_at ? new Date(c.last_run_at).toLocaleTimeString('vi-VN') : 'Chưa có'}
                </strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTest(c.id)}
                  disabled={testingId === c.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${testingId === c.id ? 'animate-spin' : ''}`} />
                  <span>Test kết nối</span>
                </button>

                <button
                  onClick={() => handleRun(c.id)}
                  disabled={runningId === c.id || !c.is_enabled}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-950/40 flex items-center space-x-1"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Quét ngay</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
