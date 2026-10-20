import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Trash2, Power, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { AutomationRule } from '../../types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const AutomationRulesView: React.FC = () => {
  const { showToast } = useApp();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleConditionType, setNewRuleConditionType] = useState('MIN_SCORE');
  const [newRuleConditionVal, setNewRuleConditionVal] = useState('80.0');
  const [newRuleActionType, setNewRuleActionType] = useState('ADD_TAG');
  const [newRuleActionPayload, setNewRuleActionPayload] = useState('VOUCHER SIÊU HOT');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await api.getRules();
      setRules(data);
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (r: AutomationRule) => {
    try {
      await api.updateRule(r.id, { is_active: !r.is_active });
      showToast(`Quy tắc '${r.name}' đã được ${!r.is_active ? 'BẬT' : 'TẮT'}`);
      fetchRules();
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteRule(id);
      showToast('Đã xóa quy tắc thành công');
      fetchRules();
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) {
      showToast('Vui lòng nhập tên quy tắc');
      return;
    }
    try {
      await api.createRule({
        name: newRuleName.trim(),
        description: newRuleDesc.trim(),
        condition_type: newRuleConditionType,
        condition_value: newRuleConditionVal.trim(),
        action_type: newRuleActionType,
        action_payload: newRuleActionPayload.trim(),
        is_active: true,
        priority: 5,
        trigger_event: 'ON_DISCOVERY',
      });
      showToast('Đã tạo quy tắc tự động hóa mới thành công!');
      setIsModalOpen(false);
      setNewRuleName('');
      setNewRuleDesc('');
      fetchRules();
    } catch (e: any) {
      showToast(`Lỗi tạo: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Trung Tâm Quy Tắc Tự Động Hóa (Rule-Based Automation Center)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động hóa hành vi xử lý khi phát hiện voucher mới: Gắn thẻ HOT, phát cảnh báo, xác minh nguồn.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 border border-indigo-400/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Quy Tắc Mới</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((r) => (
          <div
            key={r.id}
            className={`p-5 rounded-3xl border transition-all shadow-xl bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              r.is_active ? 'border-slate-800 hover:border-indigo-500/40' : 'border-slate-800/60 opacity-60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="font-bold text-sm text-white">{r.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.is_active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {r.is_active ? 'ĐANG CHẠY' : 'TẠM DỪNG'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Đã kích hoạt: <strong className="text-cyan-400">{r.execution_count}</strong> lần
                </span>
              </div>

              {r.description && <p className="text-xs text-slate-400">{r.description}</p>}

              {/* Logic chips */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                  ĐIỀU KIỆN: <strong>{r.condition_type}</strong> = <strong className="text-cyan-300">{r.condition_value}</strong>
                </span>
                <span className="text-slate-400">➔</span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                  HÀNH ĐỘNG: <strong>{r.action_type}</strong> ({r.action_payload || 'Mặc định'})
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => handleToggle(r)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  r.is_active
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
                title={r.is_active ? 'Tắt quy tắc' : 'Bật quy tắc'}
              >
                <Power className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(r.id)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                title="Xóa quy tắc"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Tạo Quy Tắc Tự Động Mới</h3>

            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tên quy tắc:</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ví dụ: Tự gắn thẻ Deal Hời..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Mô tả mục đích:</label>
                <input
                  type="text"
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="Mô tả hành động của quy tắc..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Loại điều kiện:</label>
                  <select
                    value={newRuleConditionType}
                    onChange={(e) => setNewRuleConditionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                  >
                    <option value="MIN_SCORE">Điểm xếp hạng ≥</option>
                    <option value="MIN_DISCOUNT_PERCENT">Tỷ lệ giảm (%) ≥</option>
                    <option value="MAX_MIN_SPEND">Đơn tối thiểu ≤</option>
                    <option value="CATEGORY_EQUALS">Tên ngành hàng chứa</option>
                    <option value="CODE_CONTAINS">Mã voucher chứa</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Giá trị so sánh:</label>
                  <input
                    type="text"
                    required
                    value={newRuleConditionVal}
                    onChange={(e) => setNewRuleConditionVal(e.target.value)}
                    placeholder="80.0 hoặc 0 hoặc Điện tử..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Hành động thực thi:</label>
                  <select
                    value={newRuleActionType}
                    onChange={(e) => setNewRuleActionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                  >
                    <option value="ADD_TAG">Gắn thẻ phân loại (Tag)</option>
                    <option value="SEND_NOTIFICATION">Gửi thông báo ưu tiên</option>
                    <option value="MARK_VERIFIED">Đánh dấu Đã xác minh</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nội dung hành động:</label>
                  <input
                    type="text"
                    value={newRuleActionPayload}
                    onChange={(e) => setNewRuleActionPayload(e.target.value)}
                    placeholder="Tên thẻ hoặc thông điệp..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold shadow-md shadow-indigo-950/60 border border-indigo-400/30"
                >
                  Lưu & Áp Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
