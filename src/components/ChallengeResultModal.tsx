import React from 'react';
import { RotateCcw, ArrowRight, Flame, Star } from 'lucide-react';
import {
  CHALLENGE_SPECS,
  ChallengeResult,
  GameMode,
  Language,
} from '../types/game';

interface ChallengeResultModalProps {
  lang: Language;
  result: ChallengeResult;
  onRetry: () => void;
  onNextChallenge: (nextMode: Exclude<GameMode, 'free'>) => void;
  onFreeMode: () => void;
}

export const ChallengeResultModal: React.FC<ChallengeResultModalProps> = ({
  lang,
  result,
  onRetry,
  onNextChallenge,
  onFreeMode,
}) => {
  const isVi = lang === 'vi';
  const spec = CHALLENGE_SPECS.find((c) => c.id === result.mode)!;
  const currentIdx = CHALLENGE_SPECS.findIndex((c) => c.id === result.mode);
  const nextSpec = CHALLENGE_SPECS[(currentIdx + 1) % CHALLENGE_SPECS.length];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#090b0f]/85 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#161922] border border-stone-700/90 shadow-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase ${
              result.won
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {result.won
              ? isVi
                ? 'Hoàn Thành Thử Thách'
                : 'Challenge Complete'
              : isVi
                ? 'Hết Thời Gian'
                : 'Time Up'}
          </span>

          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= result.stars
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-stone-700'
                }`}
              />
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-black text-stone-100 mb-1">
          {isVi ? spec.nameVi : spec.nameEn}
        </h2>
        <p className="text-xs text-stone-400 mb-5">
          {result.won
            ? isVi
              ? 'Phản xạ xuất sắc! Mọi căng thẳng đã vỡ tan cùng mục tiêu.'
              : 'Sharp aim and relentless momentum—targets demolished!'
            : isVi
              ? 'Chỉ còn một chút nữa thôi. Thử lại để phá kỷ lục nhé!'
              : 'Close run! Give it another throw to beat the clock.'}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Điểm số' : 'Score'}
            </div>
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              {result.score}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Tiến độ' : 'Progress'}
            </div>
            <div className="text-2xl font-black text-emerald-400 tabular-nums">
              {result.progress}/{result.goal}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Thời gian còn' : 'Time Left'}
            </div>
            <div className="text-xl font-bold text-stone-100 tabular-nums">
              {result.timeRemaining.toFixed(1)}s
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Số chai đã ném' : 'Bottles Thrown'}
            </div>
            <div className="text-xl font-bold text-stone-100 tabular-nums">
              {result.bottlesThrown}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#111318] font-extrabold text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVi ? 'CHƠI LẠI THỬ THÁCH' : 'RETRY CHALLENGE'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNextChallenge(nextSpec.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#202430] hover:bg-[#2a3040] border border-stone-700 text-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>
              {isVi
                ? `Thử thách tiếp: ${nextSpec.nameVi}`
                : `Next: ${nextSpec.nameEn}`}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onFreeMode}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-transparent hover:bg-stone-800/70 text-stone-400 hover:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isVi ? 'Chuyển sang Xả Stress Tự Do' : 'Switch to Free Smash Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
