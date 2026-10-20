import React, { useEffect, useState } from 'react';
import { Settings, Sliders, Zap, Save, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { SystemSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const { showToast } = useApp();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Weights
  const [wValue, setWValue] = useState(30);
  const [wRel, setWRel] = useState(25);
  const [wApp, setWApp] = useState(20);
  const [wUrg, setWUrg] = useState(15);
  const [wConf, setWConf] = useState(10);

  // General Params
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [maxWorkers, setMaxWorkers] = useState(3);
  const [requestTimeout, setRequestTimeout] = useState(15);
  const [minAlertScore, setMinAlertScore] = useState(80);

  useEffect(() => {
    api
      .getSettings()
      .then((res) => {
        setSettings(res);
        setWValue(Math.round(res.weight_value * 100));
        setWRel(Math.round(res.weight_reliability * 100));
        setWApp(Math.round(res.weight_applicability * 100));
        setWUrg(Math.round(res.weight_urgency * 100));
        setWConf(Math.round(res.weight_confidence * 100));
        setIntervalMinutes(res.scan_interval_minutes);
        setMaxWorkers(res.max_concurrent_workers);
        setRequestTimeout(res.request_timeout_seconds);
        setMinAlertScore(Math.round(res.min_score_for_alert));
      })
      .catch((err) => showToast(`Lỗi tải cài đặt: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  const totalWeight = wValue + wRel + wApp + wUrg + wConf;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (totalWeight !== 100) {
      showToast(`⚠️ Tổng 5 trọng số phải bằng 100% (Hiện tại: ${totalWeight}%)`);
      return;
    }

    setSaving(true);
    try {
      await api.updateSettings({
        weight_value: wValue / 100.0,
        weight_reliability: wRel / 100.0,
        weight_applicability: wApp / 100.0,
        weight_urgency: wUrg / 100.0,
        weight_confidence: wConf / 100.0,
        scan_interval_minutes: intervalMinutes,
        max_concurrent_workers: maxWorkers,
        request_timeout_seconds: requestTimeout,
        min_score_for_alert: minAlertScore,
      });
      showToast('Đã lưu cấu hình thuật toán và tham số vận hành!');
    } catch (err: any) {
      showToast(`Lỗi lưu cấu hình: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Đang tải cấu hình hệ thống...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cài Đặt Hệ Thống & Trọng Số Thuật Toán
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hiệu chỉnh trọng số thuật toán xếp hạng 5 chiều và các tham số giới hạn an toàn.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 border border-indigo-400/30 transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ranking Algorithm Weights */}
        <div className="lg:col-span-7 p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Thuật Toán Xếp Hạng Voucher (5 Trọng Số)
              </h3>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                totalWeight === 100
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              Tổng: {totalWeight}%
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Điểm xếp hạng tổng hợp (0-100) được tính dựa trên tổ hợp tuyến tính 5 chỉ số chất lượng:
          </p>

          <div className="space-y-4 pt-1">
            {/* Weight 1: Value */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-white">1. Mức tiết kiệm thực tế (Value Score):</span>
                <span className="text-cyan-300 font-mono font-bold">{wValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wValue}
                onChange={(e) => setWValue(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Đánh giá số tiền tiết kiệm và tỷ lệ giảm giá so với đơn tối thiểu.</span>
            </div>

            {/* Weight 2: Reliability */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-white">2. Độ tin cậy nguồn (Reliability Score):</span>
                <span className="text-cyan-300 font-mono font-bold">{wRel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wRel}
                onChange={(e) => setWRel(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Ưu tiên nguồn chiến dịch chính thức của Shopee và đối tác ngân hàng.</span>
            </div>

            {/* Weight 3: Applicability */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-white">3. Phạm vi áp dụng (Applicability Score):</span>
                <span className="text-cyan-300 font-mono font-bold">{wApp}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wApp}
                onChange={(e) => setWApp(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Voucher toàn sàn hoặc đơn từ 0Đ được điểm cao hơn mã giới hạn shop.</span>
            </div>

            {/* Weight 4: Urgency */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-white">4. Độ khẩn cấp thời hạn (Urgency Score):</span>
                <span className="text-cyan-300 font-mono font-bold">{wUrg}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wUrg}
                onChange={(e) => setWUrg(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Mã sắp hết hạn trong 12-24h được đẩy lên ưu tiên sử dụng trước.</span>
            </div>

            {/* Weight 5: Confidence */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-white">5. Mức độ xác minh (Confidence Score):</span>
                <span className="text-cyan-300 font-mono font-bold">{wConf}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wConf}
                onChange={(e) => setWConf(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Mã có bằng chứng áp dụng thực tế được ưu tiên so với mã cộng đồng.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Limits & Safety Parameters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Tham Số Vận Hành An Toàn
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Chu kỳ quét tự động nền:
                </label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                >
                  <option value={10}>Mỗi 10 phút</option>
                  <option value={15}>Mỗi 15 phút (Khuyên dùng)</option>
                  <option value={30}>Mỗi 30 phút</option>
                  <option value={60}>Mỗi 60 phút (Tiết kiệm tài nguyên)</option>
                  <option value={120}>Mỗi 2 giờ</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Số worker chạy song song (Concurrency Pool):
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={maxWorkers}
                  onChange={(e) => setMaxWorkers(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-mono"
                />
                <span className="text-[10px] text-slate-400">Giới hạn tối đa 4 worker để tránh nghẽn CPU và mạng.</span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Thời gian timeout kết nối (Giây):
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={requestTimeout}
                  onChange={(e) => setRequestTimeout(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Ngưỡng điểm phát cảnh báo (Alert Score Threshold):
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={minAlertScore}
                  onChange={(e) => setMinAlertScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-mono"
                />
                <span className="text-[10px] text-slate-400">Voucher có điểm ≥ ngưỡng này sẽ gửi thông báo khẩn & Telegram.</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
