import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Archive,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SystemHealth } from '../../types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const SystemHealthView: React.FC = () => {
  const { showToast } = useApp();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const [healthData, backupsData, logsData] = await Promise.all([
        api.getSystemHealth(),
        api.getBackups(),
        api.getAuditLogs(30),
      ]);
      setHealth(healthData);
      setBackups(backupsData);
      setAuditLogs(logsData);
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await api.createBackup();
      showToast(`✅ Đã tạo sao lưu thành công: ${res.filename} (${res.size_mb} MB)`);
      fetchHealthData();
    } catch (e: any) {
      showToast(`Lỗi sao lưu: ${e.message}`);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn phục hồi dữ liệu từ bản sao lưu '${filename}'? Bản sao lưu hiện tại sẽ được lưu an toàn trước khi khôi phục.`)) {
      return;
    }
    try {
      const res = await api.restoreBackup(filename);
      showToast(`🎉 ${res.message}`);
      fetchHealthData();
    } catch (e: any) {
      showToast(`Lỗi phục hồi: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Tình Trạng & Sức Khỏe Hệ Thống (System Health)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Giám sát mức tiêu hao phần cứng, kiến trúc SQLite WAL và quản lý bản sao lưu an toàn.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealthData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Làm mới trạng thái"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hardware Resource Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">CPU Sử Dụng</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {health?.cpu_percent || 0}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, health?.cpu_percent || 0)}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-slate-400 block pt-1">{health?.platform}</span>
        </div>

        {/* Process RAM */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">RAM Tiến Trình (RSS)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {health?.process_memory_mb || 0}
            <span className="text-sm font-normal text-slate-400 ml-1">MB</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((health?.process_memory_mb || 50) / 500) * 100)}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-slate-400 block pt-1">
            Hệ thống: {health?.system_memory_used_percent}% / {health?.system_memory_total_gb} GB
          </span>
        </div>

        {/* SQLite Database */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Database SQLite WAL</span>
            <Database className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {health?.db_size_mb || 0}
            <span className="text-sm font-normal text-slate-400 ml-1">MB</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>WAL Mode High-Concurrency</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Đọc/ghi không bị khóa</span>
        </div>

        {/* Disk Free */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Ổ Đĩa Khả Dụng</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {health?.disk_free_gb || 0}
            <span className="text-sm font-normal text-slate-400 ml-1">GB</span>
          </div>
          <span className="text-[10px] text-slate-400 block pt-3">Đủ cho lưu trữ dữ liệu lâu dài</span>
        </div>
      </div>

      {/* Database Backup & Restore Section */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Archive className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Quản Lý Sao Lưu & Phục Hồi (Backup & Restore)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tạo bản sao lưu dữ liệu toàn vẹn định kỳ, đảm bảo không mất dữ liệu khi nâng cấp.
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 transition-all active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{creatingBackup ? 'Đang tạo...' : 'Tạo Bản Sao Lưu (.bak)'}</span>
          </button>
        </div>

        {/* Backups List */}
        <div className="space-y-2">
          {backups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl">
              Chưa có tệp sao lưu nào. Hãy bấm "Tạo Bản Sao Lưu (.bak)" để tạo điểm phục hồi an toàn.
            </div>
          ) : (
            backups.map((b) => (
              <div
                key={b.filename}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-mono font-semibold text-white">{b.filename}</span>
                    <span className="text-[11px] text-slate-400 block">
                      Kích thước: {b.size_mb} MB • Tạo lúc: {new Date(b.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRestore(b.filename)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Phục hồi</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Logs Viewer */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)</span>
        </h3>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-2xl">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-950/50 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-cyan-400 font-bold mr-2">[{log.action}]</span>
                <span className="text-slate-300">{log.details}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-4">
                {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
