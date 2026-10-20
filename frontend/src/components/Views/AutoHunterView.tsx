import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  RefreshCw,
  Play,
  Pause,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Connector } from '../../types';

export const AutoHunterView: React.FC = () => {
  const { hunterStatus, refreshHunterStatus, triggerScan, showToast } = useApp();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Khởi tạo Autonomous Hunter Engine Ultra...`,
    `[${new Date().toLocaleTimeString()}] Sẵn sàng quét tự động đa luồng (Shopee VN, Freeship Xtra, Categories, Deal Aggregators, Partner Banks).`,
  ]);

  useEffect(() => {
    api.getConnectors().then(setConnectors).catch(() => {});
  }, []);

  const handlePauseResume = async () => {
    try {
      if (hunterStatus?.is_paused) {
        await api.resumeHunter();
        showToast('Đã tiếp tục tiến trình tự động quét định kỳ');
      } else {
        await api.pauseHunter();
        showToast('Đã tạm dừng tiến trình tự động quét');
      }
      refreshHunterStatus();
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    }
  };

  const handleManualScan = async () => {
    addLog('Người dùng yêu cầu kích hoạt phiên quét toàn diện...');
    addLog('Đang kết nối 5 connectors song song (Bounded Workers = 4)...');
    await triggerScan();
    addLog('Phiên quét hoàn tất! Dữ liệu đã được chuẩn hóa và cập nhật vào cơ sở dữ liệu.');
    api.getConnectors().then(setConnectors).catch(() => {});
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 50)]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Control Cockpit Hero */}
      <div className="p-6 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-xl space-y-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
              <Crosshair className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Auto Hunter Execution Cockpit
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    hunterStatus?.is_scanning_now
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : hunterStatus?.scheduler_running && !hunterStatus?.is_paused
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {hunterStatus?.is_scanning_now
                    ? 'ĐANG QUÉT NỀN'
                    : hunterStatus?.is_paused
                    ? 'TẠM DỪNG'
                    : 'TỰ ĐỘNG CHẠY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chu kỳ quét tự động mỗi {hunterStatus?.interval_minutes || 15} phút. Tự phục hồi sau khởi động lại.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePauseResume}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                hunterStatus?.is_paused
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {hunterStatus?.is_paused ? <Play className="w-4 h-4 fill-emerald-400" /> : <Pause className="w-4 h-4" />}
              <span>{hunterStatus?.is_paused ? 'Tiếp tục tự động' : 'Tạm dừng lịch'}</span>
            </button>

            <button
              onClick={handleManualScan}
              disabled={hunterStatus?.is_scanning_now}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all active:scale-95 ${
                hunterStatus?.is_scanning_now
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-950/60 border border-indigo-400/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${hunterStatus?.is_scanning_now ? 'animate-spin' : ''}`} />
              <span>{hunterStatus?.is_scanning_now ? 'Đang săn mã...' : 'KÍCH HOẠT QUÉT NGAY'}</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Lần quét gần nhất:</span>
            <span className="text-white font-mono font-semibold">
              {hunterStatus?.last_scan_time
                ? new Date(hunterStatus.last_scan_time).toLocaleTimeString('vi-VN')
                : 'Chưa có'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Lần quét tiếp theo:</span>
            <span className="text-cyan-400 font-mono font-semibold">
              {hunterStatus?.next_scan_time
                ? new Date(hunterStatus.next_scan_time).toLocaleTimeString('vi-VN')
                : 'Theo lịch'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Worker Concurrency:</span>
            <span className="text-emerald-400 font-mono font-semibold">4 Workers Bounded</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Khóa chống quét trùng:</span>
            <span className="text-white font-mono font-semibold">ACTIVE (Lock Active)</span>
          </div>
        </div>
      </div>

      {/* Connectors Live Table & Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connectors Status */}
        <div className="lg:col-span-7 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tình Trạng Các Đầu Thu Thập (Connectors)
            </h3>
          </div>

          <div className="space-y-3">
            {connectors.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white truncate">{c.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {c.connector_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-3">
                    <span>Tổng: <strong className="text-white font-mono">{c.total_found}</strong></span>
                    <span>Mới: <strong className="text-emerald-400 font-mono">{c.new_records}</strong></span>
                    <span>Trùng: <strong className="text-slate-400 font-mono">{c.duplicates_count}</strong></span>
                    <span>Độ trễ: <strong className="text-slate-300 font-mono">{c.avg_duration_ms}ms</strong></span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Terminal Log */}
        <div className="lg:col-span-5 p-5 bg-slate-950 border border-slate-800 rounded-3xl shadow-xl space-y-3 flex flex-col font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-200">
                Live Activity Log
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LISTENING</span>
            </span>
          </div>

          <div className="flex-1 max-h-80 overflow-y-auto space-y-2 text-slate-400 text-[11px] pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
