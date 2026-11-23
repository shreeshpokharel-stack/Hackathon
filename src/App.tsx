import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { GameModals, type ActiveModal } from './components/GameModals';
import { buildLevel } from './game/levels';
import {
  applyInteraction,
  calculateLevelScore,
  computeChronoShift,
  createInitialPlayer,
  findNearestInteractable,
  stepSimulation
} from './game/physics';
import { SaveManager } from './game/saveManager';
import { SFX } from './game/soundEngine';
import {
  LOGICAL_H,
  LOGICAL_W,
  type CompletionSnapshot,
  type GameMode,
  type HudSnapshot,
  type LevelData,
  type PlayerState,
  type SaveData,
  type Timeline
} from './game/types';
import { createAmbientMotes, ParticlePool, renderSplitWorld } from './game/worldRenderer';

interface SimState {
  mode: GameMode;
  levelNum: 1 | 2 | 3;
  level: LevelData;
  anchor: Timeline;
  energy: number;
  maxEnergy: number;
  freezeTimer: number;
  shiftFlash: number;
  shakeTimer: number;
  hitstopTimer: number;
  score: number;
  elapsed: number;
  idleHintTimer: number;
  hintShown: boolean;
  checkpoint: { x: number; y: number };
  player: PlayerState;
  particles: ParticlePool;
  ambientPast: ReturnType<typeof createAmbientMotes>;
  ambientFuture: ReturnType<typeof createAmbientMotes>;
  toastTimer: number;
}

function createHudFromSim(sim: SimState): HudSnapshot {
  return {
    levelNum: sim.levelNum,
    levelName: sim.level.name,
    objective: sim.level.objective,
    anchor: sim.anchor,
    energy: sim.energy,
    maxEnergy: sim.maxEnergy,
    freezeTimer: sim.freezeTimer,
    fragmentsCollected: sim.level.fragments.filter((f) => f.collected).length,
    fragmentsTotal: sim.level.fragments.length,
    butterfly: sim.level.state.butterfly,
    score: sim.score,
    elapsed: sim.elapsed
  };
}

export default function App() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const energyBarRef = useRef<HTMLDivElement | null>(null);
  const energyTextRef = useRef<HTMLSpanElement | null>(null);

  const initialLevel = buildLevel(1);
  const simRef = useRef<SimState>({
    mode: 'title',
    levelNum: 1,
    level: initialLevel,
    anchor: 'past',
    energy: 100,
    maxEnergy: 100,
    freezeTimer: 0,
    shiftFlash: 0,
    shakeTimer: 0,
    hitstopTimer: 0,
    score: 0,
    elapsed: 0,
    idleHintTimer: 0,
    hintShown: false,
    checkpoint: { ...initialLevel.spawn },
    player: createInitialPlayer(initialLevel.spawn),
    particles: new ParticlePool(180),
    ambientPast: createAmbientMotes(36, 12, 34),
    ambientFuture: createAmbientMotes(36, 18, 48),
    toastTimer: 0
  });

  const keysHeldRef = useRef<Set<string>>(new Set());
  const jumpJustReleasedRef = useRef(false);

  const [mode, setMode] = useState<GameMode>('title');
  const [activeModal, setActiveModal] = useState<ActiveModal>('title');
  const [saveData, setSaveData] = useState<SaveData>(() => SaveManager.load());
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionSnapshot | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(() => createHudFromSim(simRef.current));

  const syncBodyState = useCallback((nextMode: GameMode) => {
    document.body.dataset.state = nextMode;
  }, []);

  const showToast = useCallback((msg: string, duration = 3.0) => {
    simRef.current.toastTimer = duration;
    setToastMessage(msg);
  }, []);

  const syncDiscreteHud = useCallback(() => {
    const sim = simRef.current;
    setHud((prev) => {
      const frags = sim.level.fragments.filter((f) => f.collected).length;
      const freezeRounded = Math.round(sim.freezeTimer * 10);
      const prevFreezeRounded = Math.round(prev.freezeTimer * 10);
      if (
        prev.levelNum === sim.levelNum &&
        prev.objective === sim.level.objective &&
        prev.anchor === sim.anchor &&
        prev.fragmentsCollected === frags &&
        prev.butterfly === sim.level.state.butterfly &&
        prev.score === sim.score &&
        prevFreezeRounded === freezeRounded
      ) {
        return prev;
      }
      return createHudFromSim(sim);
    });
  }, []);

  const startLevel = useCallback(
    (num: 1 | 2 | 3, fromUserGesture = true) => {
      if (fromUserGesture) SFX.init();
      const sim = simRef.current;
      const lv = buildLevel(num);
      sim.levelNum = num;
      sim.level = lv;
      sim.anchor = 'past';
      sim.energy = 100;
      sim.freezeTimer = 0;
      sim.shiftFlash = 0.45;
      sim.shakeTimer = 0;
      sim.hitstopTimer = 0;
      sim.score = 0;
      sim.elapsed = 0;
      sim.idleHintTimer = 0;
      sim.hintShown = false;
      sim.checkpoint = { ...lv.spawn };
      sim.player = createInitialPlayer(lv.spawn);
      sim.particles.clear();
      sim.mode = 'playing';

      keysHeldRef.current.clear();
      jumpJustReleasedRef.current = false;

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      syncBodyState('playing');
      setMode('playing');
      setActiveModal('none');
      setCompletion(null);
      setHud(createHudFromSim(sim));
      showToast(lv.name, 2.4);
    },
    [showToast, syncBodyState]
  );

  const handleToggleMute = useCallback(() => {
    SFX.muted = !SFX.muted;
    setMuted(SFX.muted);
  }, []);

  const handlePause = useCallback(() => {
    const sim = simRef.current;
    if (sim.mode === 'playing') {
      sim.mode = 'paused';
      keysHeldRef.current.clear();
      syncBodyState('paused');
      setMode('paused');
      setActiveModal('pause');
    } else if (sim.mode === 'paused') {
      sim.mode = 'playing';
      syncBodyState('playing');
      setMode('playing');
      setActiveModal('none');
    }
  }, [syncBodyState]);

  const handleQuitToTitle = useCallback(() => {
    const sim = simRef.current;
    const lv = buildLevel(1);
    sim.mode = 'title';
    sim.levelNum = 1;
    sim.level = lv;
    sim.anchor = 'past';
    sim.player = createInitialPlayer(lv.spawn);
    sim.particles.clear();
    keysHeldRef.current.clear();
    syncBodyState('title');
    setMode('title');
    setActiveModal('title');
    setToastMessage(null);
    setSaveData(SaveManager.load());
  }, [syncBodyState]);

  const handleToggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const triggerChronoShift = useCallback(() => {
    const sim = simRef.current;
    if (sim.mode !== 'playing') return;
    const res = computeChronoShift(sim.level, sim.player, sim.anchor, sim.energy);
    if (!res.ok) {
      if (res.reason === 'low_energy') {
        showToast('Not enough Chrono Energy!', 1.8);
      } else {
        SFX.hazard();
        sim.shakeTimer = 0.2;
        showToast('Timeline obstructed: move clear of solid structure!', 2.2);
      }
      return;
    }
    if (res.liftY !== null) sim.player.y = res.liftY;
    sim.anchor = res.targetAnchor;
    sim.energy = res.newEnergy;
    sim.shiftFlash = 0.55;
    sim.idleHintTimer = 0;
    SFX.shift(res.targetAnchor === 'future');
    sim.particles.spawn(
      sim.player.x + sim.player.w / 2,
      sim.player.y + sim.player.h / 2,
      res.targetAnchor === 'future' ? '#38bdf8' : '#fbbf24',
      20
    );
    syncDiscreteHud();
  }, [showToast, syncDiscreteHud]);

  const triggerFreeze = useCallback(() => {
    const sim = simRef.current;
    if (sim.mode !== 'playing' || sim.freezeTimer > 0) return;
    if (sim.energy < 25) {
      showToast('Need 25 Chrono Energy for Temporal Freeze!', 1.8);
      return;
    }
    sim.energy -= 25;
    sim.freezeTimer = 5.0;
    SFX.freeze();
    showToast('Temporal Freeze active (5s)', 2.0);
    syncDiscreteHud();
  }, [showToast, syncDiscreteHud]);

  const triggerInteract = useCallback(() => {
    const sim = simRef.current;
    if (sim.mode !== 'playing') return;
    const obj = findNearestInteractable(sim.level, sim.player, sim.anchor);
    if (!obj) return;
    const outcome = applyInteraction(sim.level, obj);
    SFX.interact();
    if (!outcome.executed) {
      showToast(outcome.toast, 2.2);
      return;
    }
    sim.player.interactAnim = 0.35;
    sim.idleHintTimer = 0;
    sim.score += outcome.scoreDelta;
    sim.energy = Math.min(sim.maxEnergy, sim.energy + outcome.energyDelta);
    sim.shakeTimer = Math.max(sim.shakeTimer, outcome.shake);
    if (outcome.shake >= 0.25) sim.hitstopTimer = 0.045;
    sim.particles.spawn(
      outcome.particleX,
      outcome.particleY,
      outcome.particleColor,
      outcome.particleCount,
      outcome.particleTimeline
    );
    showToast(outcome.toast, 3.3);
    syncDiscreteHud();
  }, [showToast, syncDiscreteHud]);

  // ?autostart=1 support on mount
  useEffect(() => {
    syncBodyState('title');
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startLevel(1, false);
    }
  }, [startLevel, syncBodyState]);

  // Unified Keyboard & Focus-Loss Hygiene
  useEffect(() => {
    const onPointerDown = () => {
      SFX.init();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      SFX.init();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      const sim = simRef.current;
      if (sim.mode === 'title' && activeModal === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        if (!e.repeat) startLevel(1);
        return;
      }

      if (!keysHeldRef.current.has(e.code)) {
        keysHeldRef.current.add(e.code);
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          if (sim.mode === 'playing') sim.player.jumpBuffer = 0.12;
        } else if (e.code === 'KeyQ') {
          triggerChronoShift();
        } else if (e.code === 'KeyE') {
          triggerInteract();
        } else if (e.code === 'KeyF') {
          triggerFreeze();
        } else if (e.code === 'KeyM') {
          handleToggleMute();
        } else if (e.code === 'KeyR' && sim.mode === 'playing') {
          startLevel(sim.levelNum);
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
          if (sim.mode === 'playing' || sim.mode === 'paused') {
            handlePause();
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        jumpJustReleasedRef.current = true;
      }
    };

    const clearInputs = () => {
      keysHeldRef.current.clear();
      jumpJustReleasedRef.current = false;
    };

    const onVisibilityChange = () => {
      if (document.hidden) clearInputs();
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    activeModal,
    handlePause,
    handleToggleMute,
    startLevel,
    triggerChronoShift,
    triggerFreeze,
    triggerInteract
  ]);

  // Isolated 60Hz Simulation & Canvas Rendering Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const sim = simRef.current;

      if (sim.toastTimer > 0) {
        sim.toastTimer -= dt;
        if (sim.toastTimer <= 0) setToastMessage(null);
      }
      if (sim.shiftFlash > 0) sim.shiftFlash = Math.max(0, sim.shiftFlash - dt * 2.2);
      if (sim.shakeTimer > 0) sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);

      sim.particles.update(dt);

      if (sim.mode === 'playing') {
        if (sim.hitstopTimer > 0) {
          sim.hitstopTimer = Math.max(0, sim.hitstopTimer - dt);
        } else {
          sim.elapsed += dt;
          sim.idleHintTimer += dt;
          if (sim.idleHintTimer > 16 && !sim.hintShown) {
            sim.hintShown = true;
            showToast('Hint: ' + sim.level.hint, 5.0);
          }
          if (sim.freezeTimer > 0) sim.freezeTimer = Math.max(0, sim.freezeTimer - dt);
          if (sim.player.interactAnim > 0) {
            sim.player.interactAnim = Math.max(0, sim.player.interactAnim - dt);
          }

          sim.energy = Math.min(sim.maxEnergy, sim.energy + dt * 6.5);

          let moveDir: -1 | 0 | 1 = 0;
          if (keysHeldRef.current.has('ArrowLeft') || keysHeldRef.current.has('KeyA')) moveDir -= 1;
          if (keysHeldRef.current.has('ArrowRight') || keysHeldRef.current.has('KeyD')) moveDir += 1;

          const jumpHeld =
            keysHeldRef.current.has('Space') ||
            keysHeldRef.current.has('ArrowUp') ||
            keysHeldRef.current.has('KeyW');

          const events = stepSimulation(
            sim.level,
            sim.player,
            sim.anchor,
            sim.checkpoint,
            sim.freezeTimer,
            {
              moveDir: moveDir as -1 | 0 | 1,
              jumpHeld,
              jumpJustReleased: jumpJustReleasedRef.current
            },
            dt
          );
          jumpJustReleasedRef.current = false;

          if (events.jumped) {
            SFX.jump();
            sim.particles.spawn(sim.player.x + sim.player.w / 2, sim.player.y + sim.player.h, '#cbd5e1', 6);
          }
          if (events.landed) {
            SFX.land();
            sim.particles.spawn(sim.player.x + sim.player.w / 2, sim.player.y + sim.player.h, '#d6d3d1', 5);
          }
          if (events.pitFall) {
            SFX.hazard();
            sim.shakeTimer = 0.25;
            showToast('Returned to last stable temporal anchor', 2.0);
          }
          if (events.hazardHit) {
            SFX.hazard();
            sim.shakeTimer = 0.3;
            sim.hitstopTimer = 0.05;
            showToast('Hit by Sentinel Drone! Press [F] to freeze it.', 2.5);
          }
          if (events.fragmentCollected) {
            sim.score += 200;
            sim.energy = Math.min(sim.maxEnergy, sim.energy + 35);
            SFX.collect();
            sim.particles.spawn(events.fragmentCollected.x, events.fragmentCollected.y, '#38bdf8', 22);
            showToast('Chrono Fragment collected (+200 pts)', 2.2);
          }
          if (events.portalReached) {
            sim.mode = 'gameover';
            SFX.victory();
            const lv = sim.level;
            const finalScore = calculateLevelScore(sim.score, sim.elapsed);
            const frags = lv.fragments.filter((f) => f.collected).length;
            SaveManager.recordLevelWin(lv.num, finalScore, frags, lv.state.butterfly);
            setSaveData(SaveManager.load());
            setCompletion({
              levelNum: lv.num,
              score: finalScore,
              elapsed: sim.elapsed,
              fragmentsCollected: frags,
              fragmentsTotal: lv.fragments.length,
              butterfly: lv.state.butterfly,
              isFinalChapter: lv.num === 3
            });
            syncBodyState('gameover');
            setMode('gameover');
            setActiveModal('complete');
          }

          SFX.updateAmbient(dt, sim.anchor);

          // Update Chrono Core energy DOM only when integer value changes
          const roundedEnergy = Math.round(sim.energy);
          if (energyBarRef.current) {
            const pct = Math.max(0, Math.min(1, sim.energy / sim.maxEnergy));
            const nextScale = `scaleX(${pct.toFixed(3)})`;
            if (energyBarRef.current.style.transform !== nextScale) {
              energyBarRef.current.style.transform = nextScale;
            }
          }
          if (energyTextRef.current) {
            const nextText = `${roundedEnergy} / ${sim.maxEnergy}`;
            if (energyTextRef.current.textContent !== nextText) {
              energyTextRef.current.textContent = nextText;
            }
          }

          syncDiscreteHud();
        }
      } else if (sim.mode === 'title') {
        sim.player.scarfPhase += dt * 4.5;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        renderSplitWorld(
          ctx,
          {
            level: sim.level,
            player: sim.player,
            anchor: sim.anchor,
            freezeTimer: sim.freezeTimer,
            shiftFlash: sim.shiftFlash,
            shakeTimer: sim.shakeTimer,
            particles: sim.particles,
            ambientPast: sim.ambientPast,
            ambientFuture: sim.ambientFuture,
            isTitleTour: sim.mode === 'title'
          },
          now
        );
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [showToast, syncBodyState, syncDiscreteHud]);

  return (
    <main className="w-screen h-screen bg-[#03060c] flex items-center justify-center overflow-hidden">
      <div
        ref={shellRef}
        className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] bg-[#070b14] overflow-hidden border border-white/10"
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}
      >
        <canvas
          ref={canvasRef}
          width={LOGICAL_W}
          height={LOGICAL_H}
          data-testid="game-canvas"
          className="w-full h-full block"
        />

        {mode !== 'title' && (
          <GameHud
            hud={hud}
            toastMessage={toastMessage}
            muted={muted}
            energyBarRef={energyBarRef}
            energyTextRef={energyTextRef}
            onToggleMute={handleToggleMute}
            onReset={() => startLevel(simRef.current.levelNum)}
            onPause={handlePause}
            onToggleFullscreen={handleToggleFullscreen}
          />
        )}

        <GameModals
          activeModal={activeModal}
          saveData={saveData}
          muted={muted}
          volume={volume}
          completion={completion}
          onStartLevel={startLevel}
          onContinue={() => startLevel(Math.min(3, Math.max(1, saveData.unlockedLevel)) as 1 | 2 | 3)}
          onOpenModal={setActiveModal}
          onResume={handlePause}
          onRestartLevel={() => startLevel(simRef.current.levelNum)}
          onQuitToTitle={handleQuitToTitle}
          onToggleMute={handleToggleMute}
          onVolumeChange={(val) => {
            SFX.volume = val;
            setVolume(val);
          }}
          onClearSave={() => {
            SaveManager.clear();
            setSaveData(SaveManager.load());
            showToast('Saved progress cleared', 2.0);
          }}
        />
      </div>
    </main>
  );
}
