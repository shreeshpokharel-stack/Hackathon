import { LEVEL_META } from '../game/levels';
import type { CompletionSnapshot, SaveData } from '../game/types';
import { TitleEmblem } from './TitleEmblem';

export type ActiveModal =
  | 'none'
  | 'title'
  | 'levels'
  | 'howto'
  | 'settings'
  | 'credits'
  | 'pause'
  | 'complete';

interface GameModalsProps {
  activeModal: ActiveModal;
  saveData: SaveData;
  muted: boolean;
  volume: number;
  completion: CompletionSnapshot | null;
  onStartLevel: (num: 1 | 2 | 3) => void;
  onContinue: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onResume: () => void;
  onRestartLevel: () => void;
  onQuitToTitle: () => void;
  onToggleMute: () => void;
  onVolumeChange: (val: number) => void;
  onClearSave: () => void;
}

export function GameModals({
  activeModal,
  saveData,
  muted,
  volume,
  completion,
  onStartLevel,
  onContinue,
  onOpenModal,
  onResume,
  onRestartLevel,
  onQuitToTitle,
  onToggleMute,
  onVolumeChange,
  onClearSave
}: GameModalsProps) {
  if (activeModal === 'none') return null;

  const canContinue = saveData.unlockedLevel > 1 || Boolean(saveData.levels[1]);

  if (activeModal === 'title') {
    return (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-between py-8 px-6"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(7, 11, 20, 0.56), rgba(4, 7, 15, 0.88))'
        }}
      >
        <div className="h-2" />

        <div
          className="w-full max-w-md rounded-xl border border-amber-500/35 px-7 py-7 text-center"
          style={{
            backgroundColor: 'rgba(8, 13, 24, 0.9)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)'
          }}
        >
          <TitleEmblem />

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={() => onStartLevel(1)}
              className="w-full py-3 px-5 rounded-lg font-bold text-sm tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Play Game
            </button>

            {canContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="w-full py-2.5 px-5 rounded-lg font-semibold text-sm text-slate-100 border border-sky-400/40 bg-sky-950/50 hover:bg-sky-900/60 transition-colors cursor-pointer"
              >
                Continue (Level {saveData.unlockedLevel})
              </button>
            )}

            <div className="grid grid-cols-2 gap-2.5 mt-1">
              <button
                type="button"
                onClick={() => onOpenModal('levels')}
                className="py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-200 border border-slate-700 bg-slate-900/70 hover:border-amber-400/60 transition-colors cursor-pointer"
              >
                Chapters
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('howto')}
                className="py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-200 border border-slate-700 bg-slate-900/70 hover:border-amber-400/60 transition-colors cursor-pointer"
              >
                How to Play
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('settings')}
                className="py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-200 border border-slate-700 bg-slate-900/70 hover:border-amber-400/60 transition-colors cursor-pointer"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('credits')}
                className="py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-200 border border-slate-700 bg-slate-900/70 hover:border-amber-400/60 transition-colors cursor-pointer"
              >
                Story & Credits
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/90 flex items-center justify-center gap-4 text-xs">
              <a
                href="/downloads/index.html"
                download="index.html"
                className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200 underline underline-offset-4 whitespace-nowrap"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download index.html
              </a>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <a
                href="/downloads/echoes-of-tomorrow-source.zip"
                download="echoes-of-tomorrow-source.zip"
                className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 underline underline-offset-4 whitespace-nowrap"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Repo (.zip)
              </a>
            </div>
          </div>
        </div>

        <p
          className="text-xs text-slate-300 tracking-wide text-center"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
        >
          A/D Move · Space Jump · E Interact · Q Chrono Shift · F Freeze · Enter to Start
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(4, 7, 15, 0.82)' }}
    >
      {activeModal === 'levels' && (
        <div
          className="w-full max-w-2xl rounded-xl border border-amber-500/35 p-6 sm:p-7"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.96)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)'
          }}
        >
          <h2 className="font-display text-2xl font-bold text-amber-200 text-center">
            Select Timeline Chapter
          </h2>
          <p className="text-xs text-slate-400 text-center mt-1 mb-5">
            Restore 2189 across three interconnected eras
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {LEVEL_META.map((m) => {
              const unlocked = m.num <= saveData.unlockedLevel;
              const rec = saveData.levels[m.num];
              return (
                <button
                  key={m.num}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onStartLevel(m.num)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    unlocked
                      ? 'border-slate-600 bg-slate-900/70 hover:border-amber-400 cursor-pointer'
                      : 'border-slate-800 bg-slate-950/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    {m.subtitle} {unlocked ? '' : '· Locked'}
                  </div>
                  <div className="font-semibold text-sm text-slate-100 mt-1">{m.title}</div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{m.description}</p>
                  <div className="font-mono-num text-xs text-sky-300 mt-3">
                    {rec ? `Best: ${rec.bestScore} pts` : unlocked ? 'Ready' : 'Locked'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => onOpenModal('title')}
              className="py-2.5 px-6 rounded-lg text-sm font-semibold text-slate-200 border border-slate-600 hover:border-slate-400 cursor-pointer"
            >
              Back to Title
            </button>
          </div>
        </div>
      )}

      {activeModal === 'howto' && (
        <div
          className="w-full max-w-2xl rounded-xl border border-amber-500/35 p-6 sm:p-7"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.96)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)'
          }}
        >
          <h2 className="font-display text-2xl font-bold text-amber-200 text-center mb-4">
            How to Play
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300 mb-6">
            <div className="p-3.5 rounded-lg border border-slate-700/70 bg-slate-900/60">
              <div className="font-semibold text-amber-300 mb-1">1. Dual-Timeline Split Screen</div>
              Left shows <strong className="text-slate-100">Past (2089)</strong>; right shows{' '}
              <strong className="text-slate-100">Future (2189)</strong>. Your explorer moves in sync across both worlds.
            </div>
            <div className="p-3.5 rounded-lg border border-slate-700/70 bg-slate-900/60">
              <div className="font-semibold text-sky-300 mb-1">2. Chrono Shift [Q]</div>
              Press <strong className="text-slate-100">Q</strong> to switch your physical anchor between Past and Future to cross chasms or bypass ruins.
            </div>
            <div className="p-3.5 rounded-lg border border-slate-700/70 bg-slate-900/60">
              <div className="font-semibold text-emerald-300 mb-1">3. Cause & Effect [E]</div>
              Plant seeds, collapse supports, or repair turbines in 2089 to reshape 2189—or send power backward from the future.
            </div>
            <div className="p-3.5 rounded-lg border border-slate-700/70 bg-slate-900/60">
              <div className="font-semibold text-amber-300 mb-1">4. Temporal Freeze [F]</div>
              Press <strong className="text-slate-100">F</strong> to freeze Future sentinel drones for 5 seconds, and help nature in 2089 to spark Butterfly Effects.
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => onOpenModal('title')}
              className="py-2.5 px-7 rounded-lg text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {activeModal === 'settings' && (
        <div
          className="w-full max-w-md rounded-xl border border-amber-500/35 p-6"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.96)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)'
          }}
        >
          <h2 className="font-display text-2xl font-bold text-amber-200 text-center mb-4">
            Settings
          </h2>
          <div className="divide-y divide-slate-800 text-sm">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-200">Master Audio</span>
              <button
                type="button"
                onClick={onToggleMute}
                className="px-3.5 py-1.5 rounded-md border border-slate-600 text-xs font-semibold text-slate-100 hover:border-amber-400 cursor-pointer"
              >
                {muted ? 'Muted' : 'Enabled'}
              </button>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <label htmlFor="volume-slider" className="text-slate-200">
                Volume
              </label>
              <input
                id="volume-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                className="accent-amber-400"
              />
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-200">Saved Progress</span>
              <button
                type="button"
                onClick={onClearSave}
                className="px-3.5 py-1.5 rounded-md border border-rose-500/50 text-xs font-semibold text-rose-300 hover:bg-rose-950/50 cursor-pointer"
              >
                Reset Data
              </button>
            </div>
            <div className="py-3 flex items-center justify-between gap-3">
              <span className="text-slate-200">Export for Repo</span>
              <div className="flex items-center gap-3 text-xs">
                <a
                  href="/downloads/index.html"
                  download="index.html"
                  className="text-sky-300 hover:text-sky-200 underline underline-offset-4 whitespace-nowrap"
                >
                  index.html
                </a>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <a
                  href="/downloads/echoes-of-tomorrow-source.zip"
                  download="echoes-of-tomorrow-source.zip"
                  className="text-amber-300 hover:text-amber-200 underline underline-offset-4 whitespace-nowrap"
                >
                  Source (.zip)
                </a>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => onOpenModal('title')}
              className="py-2.5 px-7 rounded-lg text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer"
            >
              Save & Back
            </button>
          </div>
        </div>
      )}

      {activeModal === 'credits' && (
        <div
          className="w-full max-w-md rounded-xl border border-amber-500/35 p-6 text-center"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.96)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)'
          }}
        >
          <h2 className="font-display text-2xl font-bold text-amber-200 mb-3">
            Story & Credits
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            In 2189, humanity vanished beneath a fractured sky. Bearing the ancient Chrono Core,
            you traverse a century of living stone and shattered towers—proving that small acts of
            preservation in 2089 bloom into a living tomorrow.
          </p>
          <button
            type="button"
            onClick={() => onOpenModal('title')}
            className="py-2.5 px-6 rounded-lg text-sm font-semibold text-slate-200 border border-slate-600 hover:border-slate-400 cursor-pointer"
          >
            Back to Title
          </button>
        </div>
      )}

      {activeModal === 'pause' && (
        <div
          className="w-full max-w-sm rounded-xl border border-amber-500/35 p-6 text-center"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.96)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)'
          }}
        >
          <h2 className="font-display text-2xl font-bold text-amber-200 mb-5">
            Timeline Paused
          </h2>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="py-2.5 px-5 rounded-lg text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onRestartLevel}
              className="py-2.5 px-5 rounded-lg text-sm font-semibold text-slate-100 border border-slate-600 hover:border-amber-400 cursor-pointer"
            >
              Restart Level
            </button>
            <button
              type="button"
              onClick={onQuitToTitle}
              className="py-2.5 px-5 rounded-lg text-sm font-semibold text-slate-300 border border-slate-700 hover:border-slate-500 cursor-pointer"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      {activeModal === 'complete' && completion && (
        <div
          className="w-full max-w-md rounded-xl border border-amber-500/40 p-6 sm:p-7 text-center"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.96)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)'
          }}
        >
          <h2 className="font-display text-2xl font-bold text-amber-200">
            {completion.isFinalChapter
              ? 'Future Restored'
              : `Sector ${completion.levelNum} Synchronized`}
          </h2>
          <p className="text-xs text-slate-300 mt-1 mb-5">
            {completion.isFinalChapter
              ? 'Past and Future merge into a radiant tomorrow.'
              : 'Timeline anomalies stabilized. Proceed to the next sector.'}
          </p>

          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="p-3 rounded-lg border border-slate-700/80 bg-slate-900/70">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Score</div>
              <div className="font-mono-num text-lg font-bold text-amber-300 mt-0.5">
                {completion.score}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-700/80 bg-slate-900/70">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Time</div>
              <div className="font-mono-num text-lg font-bold text-slate-100 mt-0.5">
                {Math.round(completion.elapsed)}s
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-700/80 bg-slate-900/70">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Butterfly</div>
              <div className="font-mono-num text-lg font-bold text-emerald-300 mt-0.5">
                {completion.butterfly ? 'Healed' : `${completion.fragmentsCollected}/${completion.fragmentsTotal}`}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {!completion.isFinalChapter ? (
              <button
                type="button"
                data-start="true"
                onClick={() => onStartLevel((completion.levelNum + 1) as 1 | 2 | 3)}
                className="py-2.5 px-5 rounded-lg text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer"
              >
                Next Sector
              </button>
            ) : (
              <button
                type="button"
                data-start="true"
                onClick={() => onStartLevel(1)}
                className="py-2.5 px-5 rounded-lg text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer"
              >
                Play Again
              </button>
            )}
            <button
              type="button"
              onClick={onQuitToTitle}
              className="py-2.5 px-5 rounded-lg text-sm font-semibold text-slate-300 border border-slate-700 hover:border-slate-500 cursor-pointer"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
