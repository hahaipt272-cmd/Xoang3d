import React from 'react';
import { Volume2, VolumeX, Trophy, Flame } from 'lucide-react';
import { CHALLENGE_SPECS, GameMode, Language } from '../types/game';

interface TitleScreenProps {
  lang: Language;
  onToggleLang: () => void;
  onStartMode: (mode: GameMode) => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  lang,
  onToggleLang,
  onStartMode,
  muted,
  onToggleMute,
}) => {
  const isVi = lang === 'vi';

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none p-5 sm:p-8 md:p-10">
      {/* Top Bar: Language + Sound */}
      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          onClick={onToggleLang}
          className="pointer-events-auto px-3 py-2 rounded-lg bg-[#14171f]/90 border border-stone-700/80 text-stone-200 hover:border-amber-500/60 text-xs font-mono font-bold transition-colors cursor-pointer"
        >
          {isVi ? 'VI / EN' : 'EN / VI'}
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14171f]/90 border border-stone-700/80 text-stone-200 hover:bg-[#1e222e] hover:border-amber-500/60 transition-colors text-xs font-medium cursor-pointer"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400" />
          )}
          <span>
            {muted
              ? isVi
                ? 'Đang tắt tiếng'
                : 'Audio Muted'
              : isVi
                ? 'Âm thanh vỡ thực tế'
                : 'Realistic Shatter Audio'}
          </span>
        </button>
      </div>

      {/* Main Hero + Mode Selector over calm negative space */}
      <div className="max-w-3xl my-auto">
        <div className="pointer-events-auto inline-flex flex-col items-start">
          {/* Bespoke inline SVG Title Lockup */}
          <svg
            viewBox="0 0 490 132"
            className="w-[300px] sm:w-[400px] md:w-[460px] h-auto mb-2 overflow-visible"
            role="img"
            aria-label={isVi ? 'XOẢNG! 3D' : 'SHATTER! 3D'}
          >
            <g stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="1.5" fill="none">
              <polyline points="8,24 52,14 78,42 120,12" />
              <polyline points="320,18 368,8 402,38 460,22" />
              <polygon
                points="395,12 420,4 432,26"
                fill="#34d399"
                fillOpacity="0.18"
                stroke="#34d399"
                strokeOpacity="0.5"
              />
              <polygon
                points="18,98 44,88 32,116"
                fill="#f59e0b"
                fillOpacity="0.2"
                stroke="#f59e0b"
                strokeOpacity="0.55"
              />
            </g>

            <text
              x="6"
              y="88"
              fill="#f5f5f4"
              fontSize="74"
              fontWeight="900"
              letterSpacing="-2"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {isVi ? 'XOẢNG!' : 'SHATTER!'}
            </text>

            <rect x="372" y="34" width="66" height="34" rx="6" fill="#d97706" />
            <text
              x="405"
              y="58"
              textAnchor="middle"
              fill="#111318"
              fontSize="21"
              fontWeight="900"
              fontFamily="monospace"
            >
              3D
            </text>

            <text
              x="10"
              y="118"
              fill="#d6d3d1"
              fontSize="14.5"
              fontWeight="600"
              letterSpacing="3"
              fontFamily="monospace"
            >
              {isVi
                ? 'PHÒNG XẢ STRESS · NÉM CHAI THUỶ TINH'
                : 'STRESS-RELIEF GLASS SMASH SIMULATOR'}
            </text>
          </svg>

          <p className="text-stone-300 text-xs sm:text-sm max-w-lg mb-5 leading-relaxed bg-[#111318]/82 px-3.5 py-2.5 rounded-lg border border-stone-800/80">
            {isVi
              ? 'Tuỳ chỉnh phòng kín, hẻm phố hoặc công trường; chọn 7 loại chai thuỷ tinh với độ nặng & độ giòn khác nhau và xả stress tự do hoặc chinh phục Thử Thách.'
              : 'Customize indoor bays, urban alleys, or construction sites with day/night rain. Hurl 7 distinct glass bottles against 4 destructible surfaces or test your aim in Challenge Mode.'}
          </p>

          {/* Primary Start CTA + Challenge Mode Cards */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => onStartMode('free')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-[#111318] font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
            >
              <Flame className="w-5 h-5" />
              <span>{isVi ? 'XẢ STRESS TỰ DO' : 'FREE SMASH MODE'}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111318]/15">
                ENTER
              </span>
            </button>
          </div>

          {/* Challenge Mode Quick Launchers */}
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-400 mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>{isVi ? 'Chế Độ Thử Thách' : 'Challenge Mode Scenarios'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CHALLENGE_SPECS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onStartMode(ch.id)}
                  className="text-left p-3 rounded-xl bg-[#14171f]/90 hover:bg-[#1c212d] border border-stone-700/80 hover:border-amber-500/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      {isVi ? ch.typeLabelVi : ch.typeLabelEn}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {ch.timeLimitSec}s
                    </span>
                  </div>
                  <div className="text-sm font-bold text-stone-100 mb-1">
                    {isVi ? ch.nameVi : ch.nameEn}
                  </div>
                  <div className="text-[11px] text-stone-400 leading-snug">
                    {isVi ? ch.descVi : ch.descEn}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Single flat control-hint line */}
      <div className="flex justify-center">
        <div className="px-4 py-2 rounded-lg bg-[#111318]/90 border border-stone-800 text-stone-300 text-xs font-mono tracking-wide text-center">
          {isVi
            ? 'Giữ chuột hoặc Space để lấy đà · Thả để ném · R đổi chai · Shift quay chậm · H ẩn/mở bảng · Esc tạm dừng'
            : 'Hold Click or Space to Charge · Release to Throw · R Cycle Bottle · Shift Slow-Mo · H Toggle Dock · Esc Pause'}
        </div>
      </div>
    </div>
  );
};
