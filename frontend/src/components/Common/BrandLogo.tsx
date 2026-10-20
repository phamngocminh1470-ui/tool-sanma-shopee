import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* High-Tech Custom Monogram SVG Emblem (TAS - Tuấn Anh Studio) */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-teal-400 opacity-60 blur-md group-hover:opacity-100 transition-opacity" />
        
        {/* Emblem Frame */}
        <div className="relative w-full h-full rounded-xl bg-slate-950/90 border border-indigo-500/40 p-1.5 flex items-center justify-center shadow-lg shadow-indigo-950/50">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="tasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="tasAccent" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <filter id="tasGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Futuristic Hexagonal Shield Contour */}
            <path
              d="M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z"
              stroke="url(#tasGradient)"
              strokeWidth="5"
              strokeLinejoin="round"
              fill="rgba(15, 23, 42, 0.4)"
            />

            {/* Stylized 'T' Top Bar with Sharp Wings */}
            <path
              d="M26 28 L74 28 L66 38 L34 38 Z"
              fill="url(#tasGradient)"
              filter="url(#tasGlow)"
            />

            {/* Stylized 'T' Central Stem & 'A' Apex */}
            <path
              d="M45 38 L55 38 L53 72 L47 72 Z"
              fill="url(#tasAccent)"
            />

            {/* Stylized Winged 'A' Lateral Struts */}
            <path
              d="M32 46 L43 46 L38 68 L28 68 Z"
              fill="url(#tasGradient)"
              opacity="0.9"
            />
            <path
              d="M68 46 L57 46 L62 68 L72 68 Z"
              fill="url(#tasGradient)"
              opacity="0.9"
            />

            {/* Stylized 'S' Cyber Dynamic Accent Ribbon */}
            <path
              d="M30 64 C42 62, 58 60, 70 76"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#tasGlow)"
            />

            {/* Central Core Spark Node */}
            <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* Typographic Wordmark: TUẤN ANH STUDIO */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center space-x-1.5">
          <span className={`font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 ${titleSizes[size]}`}>
            TUẤN ANH
          </span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[9px] border border-indigo-500/30 tracking-tight">
            STUDIO
          </span>
        </div>
        {showSubtitle && (
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className={`text-slate-400 tracking-wider uppercase font-semibold ${subtitleSizes[size]}`}>
              VOUCHER INTELLIGENCE ULTRA
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
