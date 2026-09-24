/** Décor hippique : piste + poteau d'arrivée — purement décoratif. */
export function RacingScene() {
  return (
    <div className="racing-scene" aria-hidden="true">
      <svg
        className="racing-svg"
        viewBox="0 0 880 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8e4dc" />
            <stop offset="55%" stopColor="#e8efe6" />
            <stop offset="100%" stopColor="#f3f0e8" />
          </linearGradient>
          <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f5a3d" />
            <stop offset="100%" stopColor="#1a3a2a" />
          </linearGradient>
          <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c4b8a4" stopOpacity="0" />
            <stop offset="20%" stopColor="#c4b8a4" />
            <stop offset="80%" stopColor="#c4b8a4" />
            <stop offset="100%" stopColor="#c4b8a4" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="880" height="160" fill="url(#sky)" />

        <ellipse cx="120" cy="95" rx="90" ry="18" fill="#c5d4c8" opacity="0.5" />
        <ellipse cx="720" cy="88" rx="110" ry="22" fill="#c5d4c8" opacity="0.45" />

        <path
          d="M0 118 C180 108 320 112 440 112 C600 112 720 108 880 118 L880 160 L0 160 Z"
          fill="url(#turf)"
        />
        <path
          className="track-line"
          d="M0 128 C200 120 340 124 440 124 C580 124 720 120 880 128"
          stroke="#f0ebe3"
          strokeWidth="1.5"
          strokeDasharray="10 8"
          opacity="0.35"
        />

        <rect x="40" y="112" width="800" height="3" fill="url(#rail)" opacity="0.7" />

        <g transform="translate(180,78) scale(0.95)">
          <g className="horse-run">
            <path
              d="M8 42 C12 28 22 18 38 16 C48 8 58 6 68 10 C78 4 92 8 98 18 C108 20 118 28 120 38 C122 46 118 52 110 54 L108 62 C100 58 92 56 84 58 L78 66 C70 60 58 58 48 60 L42 68 C34 62 24 58 14 56 C6 52 4 46 8 42 Z"
              fill="#1a3a2a"
              opacity="0.55"
            />
            <path
              d="M52 10 C56 2 66 0 72 6 L70 14 C64 10 56 10 52 10 Z"
              fill="#1a3a2a"
              opacity="0.55"
            />
            <path
              d="M28 54 L24 72 M40 56 L38 74 M78 56 L82 74 M92 54 L98 72"
              stroke="#1a3a2a"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.45"
            />
          </g>
        </g>

        <g transform="translate(320,86) scale(0.7)">
          <g className="horse-run horse-run-delay">
            <path
              d="M8 42 C12 28 22 18 38 16 C48 8 58 6 68 10 C78 4 92 8 98 18 C108 20 118 28 120 38 C122 46 118 52 110 54 L108 62 C100 58 92 56 84 58 L78 66 C70 60 58 58 48 60 L42 68 C34 62 24 58 14 56 C6 52 4 46 8 42 Z"
              fill="#1a3a2a"
              opacity="0.35"
            />
            <path
              d="M28 54 L24 72 M40 56 L38 74 M78 56 L82 74 M92 54 L98 72"
              stroke="#1a3a2a"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.3"
            />
          </g>
        </g>

        <g transform="translate(620,28)">
          <g className="finish-post">
            <rect x="28" y="8" width="8" height="100" fill="#1c1b19" />
            <rect x="8" y="8" width="48" height="6" fill="#1c1b19" />
            <g>
              {[0, 1, 2, 3, 4, 5].map((row) =>
                [0, 1, 2, 3].map((col) => (
                  <rect
                    key={`${row}-${col}`}
                    x={10 + col * 10}
                    y={16 + row * 10}
                    width="10"
                    height="10"
                    fill={(row + col) % 2 === 0 ? "#1c1b19" : "#f7f5f1"}
                  />
                ))
              )}
            </g>
            <rect
              x="20"
              y="108"
              width="24"
              height="6"
              rx="1"
              fill="#1c1b19"
              opacity="0.85"
            />
          </g>
        </g>

        <g transform="translate(656,20)">
          <g className="pennant">
            <path d="M0 0 L22 8 L0 16 Z" fill="#8b1e1e" opacity="0.85" />
          </g>
        </g>
      </svg>
    </div>
  );
}
