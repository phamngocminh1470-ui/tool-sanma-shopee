import React, { useState } from 'react';
import { Award, Info } from 'lucide-react';
import { Voucher } from '../../types';

interface Props {
  voucher: Voucher;
}

export const ScoreBadge: React.FC<Props> = ({ voucher }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const score = voucher.overall_score;

  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  let pillGlow = '';

  if (score >= 85) {
    badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    pillGlow = 'shadow-sm shadow-emerald-500/20';
  } else if (score >= 70) {
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    pillGlow = 'shadow-sm shadow-amber-500/20';
  } else if (score >= 50) {
    badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  } else {
    badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer select-none transition-transform hover:scale-105 ${badgeColor} ${pillGlow}`}
      >
        <Award className="w-3.5 h-3.5" />
        <span>{score.toFixed(1)}/100</span>
      </div>

      {/* Tooltip Breakdown */}
      {showTooltip && (
        <div className="absolute right-0 top-8 w-64 p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl z-50 text-[11px] space-y-2 backdrop-blur-xl animate-in fade-in duration-100">
          <div className="font-bold text-white flex items-center justify-between pb-1 border-b border-slate-800">
            <span>ĐIỂM CHẤT LƯỢNG VOUCHER</span>
            <span className="text-cyan-400 font-mono">{score}/100</span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center">
              <span>Mức tiết kiệm thực tế (Value):</span>
              <span className="font-mono text-white">{voucher.value_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Độ tin cậy nguồn (Reliability):</span>
              <span className="font-mono text-white">{voucher.reliability_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Phạm vi áp dụng (Applicability):</span>
              <span className="font-mono text-white">{voucher.applicability_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Thời hạn khẩn cấp (Urgency):</span>
              <span className="font-mono text-white">{voucher.urgency_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Mức độ xác minh (Confidence):</span>
              <span className="font-mono text-white">{voucher.confidence_score}</span>
            </div>
          </div>

          {voucher.ranking_reason && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-cyan-300/90 italic">
              💡 {voucher.ranking_reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
