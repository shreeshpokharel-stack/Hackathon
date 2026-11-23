import type { RefObject } from 'react';
import type { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  toastMessage: string | null;
  muted: boolean;
  energyBarRef: RefObject<HTMLDivElement | null>;
  energyTextRef: RefObject<HTMLSpanElement | null>;
  onToggleMute: () => void;
  onReset: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
}

export function GameHud({
  hud,
  toastMessage,
  muted,
  energyBarRef,
  energyTextRef,
  onToggleMute,
  onReset,
  onPause,
  onToggleFullscreen
}: GameHudProps) {
  const isPast = hud.anchor === 'past';

  return (
    <div
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-10"
      aria-label="Game Heads-Up Display"
    >
      {/* Top Perimeter Clusters */}
      <div className="relative flex items-start justify-between gap-4">
        {/* Top-Left: Chapter & Live Objective */}
        <div
          className="px-3.5 py-2 rounded-lg border border-amber-500/30 max-w-xs sm:max-w-sm"
          style={{
            backgroundColor: 'rgba(7, 11, 20, 0.88)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="font-display text-[11px] font-bold tracking-[0.12em] text-amber-300">
            {hud.levelName}
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-100 mt-0.5 leading-snug">
            {hud.objective}
          </div>
        </div>

        {/* Top-Center: Active Timeline Anchor Readout (centered over temporal seam) */}
        <div
          className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-0 px-4 py-1.5 rounded-md border items-center gap-2.5"
          style={{
            backgroundColor: 'rgba(7, 11, 20, 0.9)',
            borderColor: isPast ? 'rgba(251, 191, 36, 0.45)' : 'rgba(56, 189, 248, 0.45)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke={isPast ? '#fbbf24' : '#38bdf8'}
              strokeWidth="2"
            />
            <path
              d="M12 7 V12 L15 14"
              stroke="#f8fafc"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-mono-num text-xs font-bold tracking-wider text-slate-100 whitespace-nowrap">
            {hud.freezeTimer > 0
              ? `FROZEN ${hud.freezeTimer.toFixed(1)}s`
              : isPast
                ? 'ANCHOR · PAST 2089'
                : 'ANCHOR · FUTURE 2189'}
          </span>
        </div>

        {/* Top-Right: Compact Square Utility Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            title="Mute [M]"
            className="w-9 h-9 rounded-md border border-slate-600/60 bg-[#070b14]/90 hover:border-amber-400 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleFullscreen();
            }}
            aria-label="Toggle fullscreen"
            title="Fullscreen"
            className="w-9 h-9 rounded-md border border-slate-600/60 bg-[#070b14]/90 hover:border-amber-400 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onReset();
            }}
            aria-label="Restart level"
            title="Reset Level [R]"
            className="w-9 h-9 rounded-md border border-slate-600/60 bg-[#070b14]/90 hover:border-amber-400 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pause game"
            title="Pause [Esc / P]"
            className="w-9 h-9 rounded-md border border-slate-600/60 bg-[#070b14]/90 hover:border-amber-400 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Transient World Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="self-center px-4 py-1.5 rounded-md border border-amber-400/70 text-amber-100 text-xs sm:text-sm font-semibold tracking-wide"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.94)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Bottom Perimeter Clusters */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Chrono Core Energy Meter */}
        <div
          className="px-3.5 py-2 rounded-lg border border-sky-400/30 w-52"
          style={{
            backgroundColor: 'rgba(7, 11, 20, 0.88)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-sky-300">
            <span>CHRONO CORE</span>
            <span ref={energyTextRef} className="font-mono-num text-slate-100">
              {Math.round(hud.energy)} / {hud.maxEnergy}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-1.5">
            <div
              ref={energyBarRef}
              className="h-full origin-left bg-sky-400"
              style={{ transform: `scaleX(${Math.max(0, Math.min(1, hud.energy / hud.maxEnergy))})` }}
            />
          </div>
        </div>

        {/* Bottom-Center: Flat Borderless Controls Hint */}
        <div
          className="hidden md:block text-xs text-slate-200/90 tracking-wide whitespace-nowrap"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
        >
          A/D Move · Space Jump · E Interact · Q Chrono Shift · F Freeze · R Reset
        </div>

        {/* Bottom-Right: Fragments, Butterfly & Score */}
        <div
          className="px-3.5 py-2 rounded-lg border border-amber-500/30 text-right"
          style={{
            backgroundColor: 'rgba(7, 11, 20, 0.88)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="text-[11px] font-semibold tracking-wider text-amber-300">
            ARTIFACTS & SCORE
          </div>
          <div className="font-mono-num text-sm font-bold text-slate-100 flex items-center justify-end gap-3 mt-0.5">
            <span className="inline-flex items-center gap-1" title="Chrono Fragments">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.5">
                <polygon points="12 2 22 12 12 22 2 12" />
              </svg>
              {hud.fragmentsCollected}/{hud.fragmentsTotal}
            </span>
            <span className="inline-flex items-center gap-1" title="Butterfly Effect">
              <svg width="14" height="14" viewBox="0 0 24 24" fill={hud.butterfly ? '#fbbf24' : '#475569'}>
                <ellipse cx="8" cy="12" rx="5" ry="7" transform="rotate(-20 8 12)" />
                <ellipse cx="16" cy="12" rx="5" ry="7" transform="rotate(20 16 12)" />
              </svg>
              {hud.butterfly ? '1/1' : '0/1'}
            </span>
            <span data-testid="hud-score">{Math.round(hud.score)} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
