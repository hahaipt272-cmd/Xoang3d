import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Gauge,
  Sun,
  Moon,
  CloudRain,
  CloudSun,
  Trophy,
  Layers,
  MapPin,
  Wine,
  Clock,
  Flame,
} from 'lucide-react';
import {
  BOTTLE_ORDER,
  BOTTLE_SPECS,
  BottleKind,
  CHALLENGE_SPECS,
  EnvironmentLocation,
  GameMode,
  HudSnapshot,
  Language,
  LightingMode,
  LOCATION_SPECS,
  STRESS_TAG_PRESETS,
  SURFACE_SPECS,
  WallStyle,
  WeatherMode,
} from '../types/game';

type DockTab = 'bottles' | 'surfaces' | 'environment' | 'challenges';

interface GameHUDProps {
  lang: Language;
  onToggleLang: () => void;
  hud: HudSnapshot;
  gameMode: GameMode;
  bottleKind: BottleKind;
  wallStyle: WallStyle;
  location: EnvironmentLocation;
  lighting: LightingMode;
  weather: WeatherMode;
  stressTag: string;
  slowMo: boolean;
  muted: boolean;
  dockOpen: boolean;
  onToggleDock: () => void;
  onSelectBottle: (kind: BottleKind) => void;
  onSelectWall: (style: WallStyle) => void;
  onChangeEnvironment: (
    loc: EnvironmentLocation,
    light: LightingMode,
    weather: WeatherMode,
  ) => void;
  onStartMode: (mode: GameMode) => void;
  onChangeStressTag: (tag: string) => void;
  onToggleSlowMo: () => void;
  onCleanRoom: () => void;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  lang,
  onToggleLang,
  hud,
  gameMode,
  bottleKind,
  wallStyle,
  location,
  lighting,
  weather,
  stressTag,
  slowMo,
  muted,
  dockOpen,
  onToggleDock,
  onSelectBottle,
  onSelectWall,
  onChangeEnvironment,
  onStartMode,
  onChangeStressTag,
  onToggleSlowMo,
  onCleanRoom,
  onToggleMute,
  onPause,
}) => {
  const isVi = lang === 'vi';
  const [activeTab, setActiveTab] = useState<DockTab>('bottles');
  const [customInput, setCustomInput] = useState('');
  const [editingCustom, setEditingCustom] = useState(false);

  const chargePct = Math.round(hud.chargeRatio * 100);
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - hud.chargeRatio);

  const activeBottle = BOTTLE_SPECS[bottleKind];
  const activeSurface = SURFACE_SPECS.find((s) => s.id === wallStyle)!;
  const activeLocation = LOCATION_SPECS.find((l) => l.id === location)!;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customInput.trim();
    if (cleaned) {
      onChangeStressTag(cleaned.slice(0, 14));
    }
    setEditingCustom(false);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* Dynamic Aiming Reticle */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${hud.aimScreenX * 100}%`,
          top: `${hud.aimScreenY * 100}%`,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" className="overflow-visible">
          {hud.isCharging && (
            <>
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="3"
              />
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke={hud.chargeRatio > 0.82 ? '#ef4444' : '#f59e0b'}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 32 32)"
              />
            </>
          )}
          <circle
            cx="32"
            cy="32"
            r="3"
            fill={hud.isCharging ? '#fbbf24' : 'rgba(255,255,255,0.85)'}
          />
          <line x1="20" y1="32" x2="26" y2="32" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
          <line x1="38" y1="32" x2="44" y2="32" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
          <line x1="32" y1="20" x2="32" y2="26" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
          <line x1="32" y1="38" x2="32" y2="44" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
        </svg>
        {hud.isCharging && (
          <div className="text-center -mt-1 font-mono text-[11px] font-bold text-amber-300 tabular-nums drop-shadow">
            {chargePct}%
          </div>
        )}
      </div>

      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {gameMode === 'free' ? (
            <>
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#14171f]/90 border border-stone-700/80">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400 fill-current" aria-hidden="true">
                  <path d="M9 2h6v2l1.8 3.2c.8 1.4 1.2 3 1.2 4.6V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8.2c0-1.6.4-3.2 1.2-4.6L9 4V2z" />
                </svg>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold leading-none mb-0.5">
                    {isVi ? 'Đã đập vỡ' : 'Smashed'}
                  </div>
                  <div className="text-lg font-black text-stone-100 tabular-nums leading-none">
                    {hud.bottlesSmashed}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#14171f]/90 border border-stone-700/80">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold leading-none mb-0.5">
                    {isVi ? 'Lực va đập' : 'Impact Force'}
                  </div>
                  <div className="text-sm font-bold text-stone-100 tabular-nums leading-none">
                    {hud.lastImpactForce > 0 ? `${hud.lastImpactForce} N` : '—'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Challenge Mode Top HUD */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#14171f]/92 border border-amber-500/60">
                <Trophy className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold leading-none mb-0.5">
                    {isVi ? 'Mục tiêu' : 'Goal'}
                  </div>
                  <div className="text-lg font-black text-stone-100 tabular-nums leading-none">
                    {hud.challengeProgress}/{hud.challengeGoal}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
                  hud.challengeTimeLeft <= 10
                    ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
                    : 'bg-[#14171f]/92 border-stone-700/80 text-stone-100'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold leading-none mb-0.5">
                    {isVi ? 'Thời gian' : 'Time Left'}
                  </div>
                  <div className="text-lg font-black tabular-nums leading-none">
                    {hud.challengeTimeLeft.toFixed(1)}s
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#14171f]/90 border border-stone-700/80">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold leading-none mb-0.5">
                    {isVi ? 'Điểm' : 'Score'}
                  </div>
                  <div className="text-base font-black text-emerald-400 tabular-nums leading-none">
                    {hud.score}
                  </div>
                </div>
              </div>
            </>
          )}

          {hud.comboCount >= 2 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/95 text-[#111318] font-black text-sm tabular-nums">
              <Sparkles className="w-4 h-4" />
              <span>x{hud.comboCount}</span>
            </div>
          )}

          {hud.lastEventText && (
            <div className="px-3 py-1.5 rounded-lg bg-[#14171f]/95 border border-amber-400/70 text-amber-300 font-mono text-xs font-bold">
              {hud.lastEventText}
            </div>
          )}
        </div>

        {/* Top-Right Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleLang}
            className="px-2.5 h-10 rounded-xl bg-[#14171f]/90 border border-stone-700/80 text-stone-300 hover:border-amber-500/60 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            {isVi ? 'VI' : 'EN'}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#14171f]/90 border border-stone-700/80 text-stone-200 hover:bg-[#1e2330] hover:border-amber-500/60 transition-colors cursor-pointer"
            title={muted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-[#14171f]/90 border border-stone-700/80 text-stone-200 hover:bg-[#1e2330] hover:border-amber-500/60 transition-colors text-xs font-semibold cursor-pointer"
            title="Pause (Esc)"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isVi ? 'Tạm dừng' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Unified Bottom-Center Control Dock */}
      <div
        className="fixed bottom-3 left-1/2 w-[min(940px,96vw)] flex flex-col items-center pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: dockOpen
            ? 'translate(-50%, 0)'
            : 'translate(-50%, calc(100% - 34px))',
        }}
      >
        {/* Collapse/Expand Drawer Handle */}
        <button
          type="button"
          onClick={onToggleDock}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-t-xl bg-[#14171f]/95 border border-b-0 border-stone-700/80 text-stone-300 hover:text-amber-400 text-[11px] font-semibold tracking-wide cursor-pointer"
        >
          {dockOpen ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{isVi ? 'Ẩn bảng điều khiển (H)' : 'Hide Controls (H)'}</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{isVi ? 'Mở bảng điều khiển (H)' : 'Show Controls (H)'}</span>
            </>
          )}
        </button>

        {/* Main Tabbed Dock */}
        <div className="pointer-events-auto w-full rounded-2xl bg-[#14171f]/96 border border-stone-700/85 shadow-2xl p-3 flex flex-col gap-2.5">
          {/* Tab Header Bar + Utility Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-800">
            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { id: 'bottles', icon: Wine, en: 'Bottles (7)', vi: 'Loại Chai (7)' },
                  { id: 'surfaces', icon: Layers, en: 'Surfaces (4)', vi: 'Bề Mặt (4)' },
                  { id: 'environment', icon: MapPin, en: 'Environment', vi: 'Môi Trường' },
                  { id: 'challenges', icon: Trophy, en: 'Challenges', vi: 'Thử Thách' },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-[#111318]'
                        : 'bg-[#1b1f2a] text-stone-300 hover:text-white border border-stone-700/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{isVi ? tab.vi : tab.en}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={onToggleSlowMo}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  slowMo
                    ? 'bg-sky-500 text-[#0c1118] border-sky-400'
                    : 'bg-[#1c202b] text-stone-200 border-stone-700/80 hover:border-stone-500'
                }`}
              >
                {slowMo
                  ? isVi
                    ? 'Quay chậm: BẬT'
                    : 'Slow-Mo: ON'
                  : isVi
                    ? 'Quay chậm (Shift)'
                    : 'Slow-Mo (Shift)'}
              </button>

              <button
                type="button"
                onClick={onCleanRoom}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1c202b] hover:bg-[#272c3a] border border-stone-700/80 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                <span>{isVi ? 'Dọn sạch' : 'Sweep'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: BOTTLES & STRESS TAG */}
          {activeTab === 'bottles' && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {BOTTLE_ORDER.map((kind, idx) => {
                  const spec = BOTTLE_SPECS[kind];
                  const active = bottleKind === kind;
                  const hexColor = `#${spec.glassColorHex.toString(16).padStart(6, '0')}`;
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => onSelectBottle(kind)}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500/20 border-amber-400 text-stone-100'
                          : 'bg-[#1b1f2a] border-stone-700/70 text-stone-300 hover:border-stone-500'
                      }`}
                      title={`${isVi ? spec.nameVi : spec.nameEn} (${idx + 1})`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-sm border border-white/30"
                          style={{ backgroundColor: hexColor }}
                        />
                        <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                          {spec.massKg.toFixed(2)}kg
                        </span>
                      </div>
                      <div className="text-xs font-bold leading-tight truncate w-full">
                        {isVi ? spec.shortVi : spec.shortEn}
                      </div>
                      <div className="text-[10px] font-mono text-amber-300/90 mt-0.5">
                        {spec.fragility}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active bottle description + Stress Tag row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <span className="text-stone-400 text-[11px]">
                  <strong className="text-stone-200">
                    {isVi ? activeBottle.nameVi : activeBottle.nameEn}:
                  </strong>{' '}
                  {isVi ? activeBottle.descVi : activeBottle.descEn}
                </span>

                <div className="flex items-center gap-1 flex-wrap">
                  {STRESS_TAG_PRESETS.map((tag) => (
                    <button
                      key={tag || 'none'}
                      type="button"
                      onClick={() => {
                        setEditingCustom(false);
                        onChangeStressTag(tag);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        stressTag === tag
                          ? 'bg-rose-500/90 text-white border-rose-400'
                          : 'bg-[#1c202b] text-stone-300 border-stone-700/70 hover:border-stone-500'
                      }`}
                    >
                      {tag || (isVi ? 'Không nhãn' : 'Classic')}
                    </button>
                  ))}

                  {editingCustom ? (
                    <form onSubmit={handleCustomSubmit} className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        maxLength={14}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder={isVi ? 'Viết nhãn...' : 'Custom tag...'}
                        autoFocus
                        className="w-24 px-2 py-0.5 rounded bg-[#0e1015] border border-amber-500 text-[11px] text-stone-100 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-2 py-0.5 rounded bg-amber-500 text-[#111318] text-[11px] font-bold cursor-pointer"
                      >
                        OK
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomInput(STRESS_TAG_PRESETS.includes(stressTag) ? '' : stressTag);
                        setEditingCustom(true);
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold border border-dashed border-amber-500/50 text-amber-300 hover:border-amber-400 cursor-pointer"
                    >
                      {!STRESS_TAG_PRESETS.includes(stressTag) && stressTag
                        ? `"${stressTag}"`
                        : isVi
                          ? '+ Tự viết'
                          : '+ Custom'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TARGET SURFACES */}
          {activeTab === 'surfaces' && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SURFACE_SPECS.map((s) => {
                  const active = wallStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelectWall(s.id)}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-stone-100 text-[#111318] border-white'
                          : 'bg-[#1b1f2a] text-stone-200 border-stone-700/80 hover:border-stone-500'
                      }`}
                    >
                      <div className="text-xs font-extrabold mb-0.5">
                        {isVi ? s.nameVi : s.nameEn}
                      </div>
                      <div
                        className={`text-[11px] leading-snug ${
                          active ? 'text-stone-700' : 'text-stone-400'
                        }`}
                      >
                        {isVi ? s.descVi : s.descEn}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-stone-400">
                <strong className="text-amber-300">
                  {isVi ? 'Âm thanh & Phá huỷ:' : 'Audio & Destruction:'}
                </strong>{' '}
                {isVi ? activeSurface.descVi : activeSurface.descEn}
              </div>
            </div>
          )}

          {/* TAB 3: ENVIRONMENT CUSTOMIZER (Location + Lighting + Weather + Visual Description) */}
          {activeTab === 'environment' && (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Locations */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono uppercase text-stone-400 mr-1">
                    {isVi ? 'Địa điểm:' : 'Location:'}
                  </span>
                  {LOCATION_SPECS.map((loc) => {
                    const active = location === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => onChangeEnvironment(loc.id, lighting, weather)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-500 text-[#111318] border-amber-400'
                            : 'bg-[#1b1f2a] text-stone-200 border-stone-700/80 hover:border-stone-500'
                        }`}
                      >
                        {isVi ? loc.nameVi : loc.nameEn}
                      </button>
                    );
                  })}
                </div>

                {/* Lighting & Weather toggles */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center rounded-lg bg-[#1b1f2a] border border-stone-700/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => onChangeEnvironment(location, 'day', weather)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        lighting === 'day'
                          ? 'bg-amber-400 text-[#111318]'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Ban Ngày' : 'Day'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeEnvironment(location, 'night', weather)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        lighting === 'night'
                          ? 'bg-indigo-500 text-white'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Ban Đêm' : 'Night'}</span>
                    </button>
                  </div>

                  <div className="flex items-center rounded-lg bg-[#1b1f2a] border border-stone-700/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => onChangeEnvironment(location, lighting, 'clear')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        weather === 'clear'
                          ? 'bg-stone-100 text-[#111318]'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <CloudSun className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Quang Đãng' : 'Clear'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeEnvironment(location, lighting, 'rainy')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        weather === 'rainy'
                          ? 'bg-sky-500 text-[#0c1118]'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <CloudRain className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Trời Mưa' : 'Rainy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Visual Description Box */}
              <div className="px-3 py-2 rounded-xl bg-[#0e1015] border border-stone-800 text-[11px] text-stone-300 leading-relaxed">
                <span className="font-mono uppercase text-amber-400 font-bold mr-1.5">
                  {isVi ? 'Mô tả không gian:' : 'Visual Scene:'}
                </span>
                {isVi ? activeLocation.descVi : activeLocation.descEn}{' '}
                {lighting === 'day'
                  ? isVi
                    ? 'Ánh sáng ban ngày rõ nét làm nổi bật kết cấu tường và mảnh kính lấp lánh.'
                    : 'Crisp daylight illuminates surface textures and sparkling glass edges.'
                  : isVi
                    ? 'Ánh đèn đêm ấm tương phản nền trời tối tạo chiều sâu kịch tính.'
                    : 'Warm practical lamps cut through moody night shadows for dramatic reflections.'}{' '}
                {weather === 'rainy'
                  ? isVi
                    ? 'Mưa rơi cùng mặt sàn ướt phản chiếu ánh đèn và tiếng mưa rì rào.'
                    : 'Active rain streaks, wet reflective puddles on the ground, and gentle rain ambience.'
                  : isVi
                    ? 'Không khí khô ráo với bụi va chạm bay lên khi chai vỡ.'
                    : 'Dry air with crisp masonry dust bursts on impact.'}
              </div>
            </div>
          )}

          {/* TAB 4: CHALLENGE MODE & FREE SMASH */}
          {activeTab === 'challenges' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onStartMode('free')}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  gameMode === 'free'
                    ? 'bg-amber-500 text-[#111318] border-amber-400'
                    : 'bg-[#1b1f2a] text-stone-200 border-stone-700/80 hover:border-stone-500'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Xả Stress Tự Do' : 'Free Smash'}</span>
                </div>
                <div
                  className={`text-[11px] leading-snug ${
                    gameMode === 'free' ? 'text-[#111318]/80' : 'text-stone-400'
                  }`}
                >
                  {isVi
                    ? 'Không giới hạn thời gian. Ném thoả thích để giải toả cảm xúc.'
                    : 'No timers or rules. Smash bottles freely at your own pace.'}
                </div>
              </button>

              {CHALLENGE_SPECS.map((ch) => {
                const active = gameMode === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onStartMode(ch.id)}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-[#0c1118] border-emerald-400'
                        : 'bg-[#1b1f2a] text-stone-200 border-stone-700/80 hover:border-amber-500/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-extrabold truncate">
                        {isVi ? ch.nameVi : ch.nameEn}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          active ? 'text-[#0c1118]' : 'text-amber-400'
                        }`}
                      >
                        {ch.timeLimitSec}s
                      </span>
                    </div>
                    <div
                      className={`text-[11px] leading-snug ${
                        active ? 'text-[#0c1118]/85' : 'text-stone-400'
                      }`}
                    >
                      {isVi ? ch.descVi : ch.descEn}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
