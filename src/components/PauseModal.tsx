import React from 'react';
import { Play, RotateCcw, Home, Trash2 } from 'lucide-react';
import { HudSnapshot, Language } from '../types/game';

interface PauseModalProps {
  lang: Language;
  hud: HudSnapshot;
  onResume: () => void;
  onCleanRoom: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

function formatDuration(sec: number): string {
  const total = Math.floor(sec);
  const mins = Math.floor(total / 60);
  const rem = total % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  lang,
  hud,
  onResume,
  onCleanRoom,
  onRestart,
  onReturnTitle,
}) => {
  const isVi = lang === 'vi';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#090b0f]/82 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#161922] border border-stone-700/90 shadow-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 mb-1">
              {isVi ? 'Tạm nghỉ xả hơi' : 'Session Paused'}
            </div>
            <h2 className="text-2xl font-black text-stone-100">
              {isVi ? 'Tổng Kết Xả Stress' : 'Smash Summary'}
            </h2>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-stone-800 text-stone-300 font-mono text-xs tabular-nums">
            {formatDuration(hud.sessionSeconds)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Số chai đã đập' : 'Bottles Smashed'}
            </div>
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              {hud.bottlesSmashed}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Mảnh vỡ tung bay' : 'Shards Created'}
            </div>
            <div className="text-2xl font-black text-emerald-400 tabular-nums">
              {hud.shardsCreated}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Lực ném cực đại' : 'Peak Impact Force'}
            </div>
            <div className="text-xl font-bold text-stone-100 tabular-nums">
              {hud.maxImpactForce > 0 ? `${hud.maxImpactForce} N` : '—'}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#10131a] border border-stone-800">
            <div className="text-xs text-stone-400 mb-1">
              {isVi ? 'Mảnh đang trên sàn' : 'Shards on Floor'}
            </div>
            <div className="text-xl font-bold text-stone-100 tabular-nums">
              {hud.activeShardsInRoom}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#111318] font-extrabold text-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isVi ? 'TIẾP TỤC NÉM CHAI (ESC)' : 'RESUME SMASHING (ESC)'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onCleanRoom();
                onResume();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#202430] hover:bg-[#2a3040] border border-stone-700 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-400" />
              <span>{isVi ? 'Dọn sạch phòng' : 'Sweep Room'}</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#202430] hover:bg-[#2a3040] border border-stone-700 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>{isVi ? 'Đặt lại từ đầu' : 'Restart'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-transparent hover:bg-stone-800/70 text-stone-400 hover:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isVi ? 'Về màn hình chính' : 'Main Title'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
