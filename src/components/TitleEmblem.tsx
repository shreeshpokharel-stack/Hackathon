export function TitleEmblem() {
  return (
    <div className="flex flex-col items-center text-center select-none">
      <svg
        width="360"
        height="76"
        viewBox="0 0 360 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="mb-1"
      >
        {/* Outer Persian Astrolabe & Sandglass Crest */}
        <line x1="24" y1="38" x2="132" y2="38" stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="1" />
        <line x1="228" y1="38" x2="336" y2="38" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="1" />

        {/* Central Temporal Astrolabe Emblem */}
        <circle cx="180" cy="38" r="28" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.85" />
        <circle cx="180" cy="38" r="22" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.8" />
        {/* Hourglass / Chrono Diamond */}
        <path
          d="M169 22 H191 L180 38 L191 54 H169 L180 38 Z"
          fill="#0f172a"
          stroke="#fde047"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="180" cy="38" r="3.5" fill="#38bdf8" />
        {/* Cardinal Stars */}
        <circle cx="144" cy="38" r="2.2" fill="#fbbf24" />
        <circle cx="216" cy="38" r="2.2" fill="#38bdf8" />
      </svg>

      <h1
        className="font-display text-3xl sm:text-4xl font-extrabold tracking-[0.14em] text-[#fef3c7]"
        style={{ textShadow: '0 2px 16px rgba(0,0,0,0.85)', textWrap: 'balance' }}
      >
        ECHOES OF TOMORROW
      </h1>
      <p className="mt-1.5 text-sm text-slate-300 tracking-wide">
        Every act in 2089 reshapes the ruins of 2189
      </p>
    </div>
  );
}
