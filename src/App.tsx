import { useCallback, useEffect, useRef, useState } from 'react';
import { glassAudio } from './audio/glassAudio';
import { ChallengeResultModal } from './components/ChallengeResultModal';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { RageRoomEngine } from './three/RageRoomEngine';
import {
  BOTTLE_ORDER,
  BottleKind,
  ChallengeResult,
  EnvironmentLocation,
  GameMode,
  GamePhase,
  HudSnapshot,
  Language,
  LightingMode,
  WallStyle,
  WeatherMode,
} from './types/game';

const INITIAL_HUD: HudSnapshot = {
  bottlesSmashed: 0,
  shardsCreated: 0,
  comboCount: 0,
  lastImpactForce: 0,
  maxImpactForce: 0,
  chargeRatio: 0,
  isCharging: false,
  aimScreenX: 0.5,
  aimScreenY: 0.45,
  activeShardsInRoom: 0,
  sessionSeconds: 0,
  gameMode: 'free',
  score: 0,
  challengeProgress: 0,
  challengeGoal: 0,
  challengeTimeLeft: 0,
  lastEventText: '',
};

export function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RageRoomEngine | null>(null);

  const [lang, setLang] = useState<Language>('en');
  const [phase, setPhase] = useState<GamePhase>('title');
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [bottleKind, setBottleKind] = useState<BottleKind>('beer');
  const [wallStyle, setWallStyle] = useState<WallStyle>('brick');
  const [location, setLocation] = useState<EnvironmentLocation>('indoor');
  const [lighting, setLighting] = useState<LightingMode>('night');
  const [weather, setWeather] = useState<WeatherMode>('clear');
  const [stressTag, setStressTag] = useState<string>('DEADLINE');
  const [slowMo, setSlowMo] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [dockOpen, setDockOpen] = useState<boolean>(true);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);

  const phaseRef = useRef<GamePhase>(phase);
  const bottleRef = useRef<BottleKind>(bottleKind);
  phaseRef.current = phase;
  bottleRef.current = bottleKind;

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new RageRoomEngine(
      mount,
      (snapshot) => {
        setHud(snapshot);
      },
      (result) => {
        setChallengeResult(result);
        setPhase('challenge_result');
      },
    );
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartMode = useCallback((mode: GameMode) => {
    glassAudio.unlock();
    setChallengeResult(null);
    setGameMode(mode);
    setPhase('playing');
    engineRef.current?.startGameMode(mode);
  }, []);

  const handlePause = useCallback(() => {
    setPhase('paused');
    engineRef.current?.setPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    glassAudio.unlock();
    setPhase('playing');
    engineRef.current?.setPhase('playing');
  }, []);

  const handleReturnTitle = useCallback(() => {
    setChallengeResult(null);
    setPhase('title');
    engineRef.current?.setPhase('title');
  }, []);

  const handleSelectBottle = useCallback((kind: BottleKind) => {
    setBottleKind(kind);
    engineRef.current?.setBottleKind(kind);
  }, []);

  const handleSelectWall = useCallback((style: WallStyle) => {
    setWallStyle(style);
    engineRef.current?.setWallStyle(style);
  }, []);

  const handleChangeEnvironment = useCallback(
    (loc: EnvironmentLocation, light: LightingMode, wth: WeatherMode) => {
      setLocation(loc);
      setLighting(light);
      setWeather(wth);
      engineRef.current?.setEnvironment(loc, light, wth);
    },
    [],
  );

  const handleChangeStressTag = useCallback((tag: string) => {
    setStressTag(tag);
    engineRef.current?.setStressTag(tag);
  }, []);

  const handleToggleSlowMo = useCallback(() => {
    setSlowMo((prev) => {
      const next = !prev;
      engineRef.current?.setSlowMo(next);
      return next;
    });
  }, []);

  const handleCleanRoom = useCallback(() => {
    engineRef.current?.cleanRoom();
  }, []);

  const handleRestart = useCallback(() => {
    setChallengeResult(null);
    engineRef.current?.resetSession();
    setPhase('playing');
    engineRef.current?.setPhase('playing');
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      glassAudio.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'vi' : 'en'));
  }, []);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.code === 'Escape') {
        e.preventDefault();
        if (phaseRef.current === 'playing') {
          handlePause();
        } else if (phaseRef.current === 'paused') {
          handleResume();
        }
        return;
      }

      if (phaseRef.current === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartMode('free');
        }
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (phaseRef.current !== 'playing') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          engineRef.current?.startSpaceCharge();
        }
      } else if (e.code === 'KeyH') {
        setDockOpen((prev) => !prev);
      } else if (e.code === 'KeyR') {
        const idx = BOTTLE_ORDER.indexOf(bottleRef.current);
        const nextKind = BOTTLE_ORDER[(idx + 1) % BOTTLE_ORDER.length];
        handleSelectBottle(nextKind);
      } else if (e.key >= '1' && e.key <= '7') {
        const idx = Number(e.key) - 1;
        if (BOTTLE_ORDER[idx]) {
          handleSelectBottle(BOTTLE_ORDER[idx]);
        }
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!e.repeat) {
          handleToggleSlowMo();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Space' && phaseRef.current === 'playing') {
        e.preventDefault();
        engineRef.current?.releaseSpaceCharge();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    handlePause,
    handleResume,
    handleSelectBottle,
    handleStartMode,
    handleToggleMute,
    handleToggleSlowMo,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0e1015]">
      <div
        ref={canvasMountRef}
        className={`absolute inset-0 w-full h-full ${
          phase === 'playing' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      />

      {phase === 'title' && (
        <TitleScreen
          lang={lang}
          onToggleLang={handleToggleLang}
          onStartMode={handleStartMode}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {phase === 'playing' && (
        <GameHUD
          lang={lang}
          onToggleLang={handleToggleLang}
          hud={hud}
          gameMode={gameMode}
          bottleKind={bottleKind}
          wallStyle={wallStyle}
          location={location}
          lighting={lighting}
          weather={weather}
          stressTag={stressTag}
          slowMo={slowMo}
          muted={muted}
          dockOpen={dockOpen}
          onToggleDock={() => setDockOpen((prev) => !prev)}
          onSelectBottle={handleSelectBottle}
          onSelectWall={handleSelectWall}
          onChangeEnvironment={handleChangeEnvironment}
          onStartMode={handleStartMode}
          onChangeStressTag={handleChangeStressTag}
          onToggleSlowMo={handleToggleSlowMo}
          onCleanRoom={handleCleanRoom}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
        />
      )}

      {phase === 'paused' && (
        <PauseModal
          lang={lang}
          hud={hud}
          onResume={handleResume}
          onCleanRoom={handleCleanRoom}
          onRestart={handleRestart}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {phase === 'challenge_result' && challengeResult && (
        <ChallengeResultModal
          lang={lang}
          result={challengeResult}
          onRetry={() => handleStartMode(challengeResult.mode)}
          onNextChallenge={(next) => handleStartMode(next)}
          onFreeMode={() => handleStartMode('free')}
        />
      )}
    </main>
  );
}

export default App;
