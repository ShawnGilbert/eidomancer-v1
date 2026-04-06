import React from "react";

const FRAME_THEMES = {
  signal: {
    accent: "rgba(168, 85, 247, 0.75)", // purple
    glow: "rgba(168, 85, 247, 0.18)",
    wash: "from-violet-500/12 via-fuchsia-500/6 to-cyan-400/10",
    rootStyle: "neural",
  },
  tension: {
    accent: "rgba(251, 146, 60, 0.78)", // orange
    glow: "rgba(251, 146, 60, 0.2)",
    wash: "from-orange-500/14 via-rose-500/8 to-yellow-400/10",
    rootStyle: "lightning",
  },
  pattern: {
    accent: "rgba(96, 165, 250, 0.78)", // blue
    glow: "rgba(96, 165, 250, 0.18)",
    wash: "from-sky-500/12 via-cyan-500/6 to-indigo-400/10",
    rootStyle: "geometric",
  },
  echo: {
    accent: "rgba(232, 121, 249, 0.76)", // fuchsia
    glow: "rgba(232, 121, 249, 0.18)",
    wash: "from-fuchsia-500/12 via-pink-500/8 to-violet-400/10",
    rootStyle: "flow",
  },
  action: {
    accent: "rgba(74, 222, 128, 0.76)", // green
    glow: "rgba(74, 222, 128, 0.18)",
    wash: "from-emerald-500/14 via-lime-500/8 to-cyan-400/10",
    rootStyle: "branch",
  },
  default: {
    accent: "rgba(192, 197, 206, 0.5)",
    glow: "rgba(255, 255, 255, 0.08)",
    wash: "from-slate-200/8 via-white/4 to-slate-400/8",
    rootStyle: "geometric",
  },
};

function buildRootPath(style = "geometric") {
  switch (style) {
    case "lightning":
      return `
        M 18 280
        C 60 245, 80 215, 122 190
        C 170 162, 175 125, 220 105
        C 260 87, 292 75, 330 40
      `;
    case "flow":
      return `
        M 18 280
        C 55 252, 84 232, 120 220
        C 162 205, 182 175, 214 156
        C 252 132, 282 104, 330 40
      `;
    case "branch":
      return `
        M 18 280
        C 65 260, 92 230, 128 205
        C 156 185, 190 165, 220 140
        C 260 108, 298 86, 330 40
      `;
    case "neural":
      return `
        M 18 280
        C 52 258, 86 238, 124 210
        C 164 180, 188 155, 224 128
        C 266 96, 302 76, 330 40
      `;
    case "geometric":
    default:
      return `
        M 18 280
        C 58 252, 88 228, 130 202
        C 170 176, 204 146, 242 112
        C 276 84, 304 66, 330 40
      `;
  }
}

function CornerRoots({ accent, glow, rootStyle, flipX = false, flipY = false }) {
  const mainPath = buildRootPath(rootStyle);

  return (
    <svg
      viewBox="0 0 360 300"
      className="absolute inset-0 h-full w-full pointer-events-none"
      preserveAspectRatio="none"
      style={{
        transform: `${flipX ? "scaleX(-1)" : ""} ${flipY ? "scaleY(-1)" : ""}`.trim() || undefined,
        filter: `drop-shadow(0 0 8px ${glow})`,
      }}
    >
      <defs>
        <linearGradient id={`root-gradient-${flipX ? "x" : "n"}-${flipY ? "y" : "n"}-${accent.length}`}>
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      <path
        d={mainPath}
        fill="none"
        stroke={`url(#root-gradient-${flipX ? "x" : "n"}-${flipY ? "y" : "n"}-${accent.length})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <path
        d="M 70 240 C 104 220, 120 206, 140 182"
        fill="none"
        stroke={accent}
        strokeOpacity="0.42"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M 108 214 C 145 198, 168 174, 188 148"
        fill="none"
        stroke={accent}
        strokeOpacity="0.28"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M 160 170 C 188 150, 204 126, 228 102"
        fill="none"
        stroke={accent}
        strokeOpacity="0.22"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      <circle cx="18" cy="280" r="3.4" fill={accent} fillOpacity="0.85" />
      <circle cx="122" cy="190" r="1.6" fill={accent} fillOpacity="0.5" />
      <circle cx="220" cy="105" r="1.3" fill={accent} fillOpacity="0.38" />
      <circle cx="330" cy="40" r="1.2" fill={accent} fillOpacity="0.28" />
    </svg>
  );
}

function GhostGeometry({ accent }) {
  return (
    <svg
      viewBox="0 0 1000 1400"
      className="absolute inset-0 h-full w-full pointer-events-none opacity-40"
      preserveAspectRatio="none"
    >
      <path
        d="M 120 180 L 500 70 L 870 180 L 930 700 L 870 1220 L 500 1330 L 120 1220 L 70 700 Z"
        fill="none"
        stroke={accent}
        strokeOpacity="0.07"
        strokeWidth="1"
      />
      <path
        d="M 210 240 L 500 150 L 790 240 L 838 700 L 790 1160 L 500 1250 L 210 1160 L 162 700 Z"
        fill="none"
        stroke={accent}
        strokeOpacity="0.05"
        strokeWidth="0.8"
      />
      <line x1="500" y1="70" x2="500" y2="1330" stroke={accent} strokeOpacity="0.04" strokeWidth="0.8" />
      <line x1="70" y1="700" x2="930" y2="700" stroke={accent} strokeOpacity="0.04" strokeWidth="0.8" />
    </svg>
  );
}

export default function CardFrame({
  children,
  dominantType = "signal",
  className = "",
}) {
  const theme = FRAME_THEMES[dominantType] || FRAME_THEMES.default;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[2rem] border",
        "bg-slate-950/92 text-slate-100 shadow-2xl",
        "backdrop-blur-md",
        className,
      ].join(" ")}
      style={{
        borderColor: theme.accent.replace(/0\.\d+\)/, "0.32)"),
        boxShadow: `
          inset 0 0 0 1px rgba(255,255,255,0.04),
          0 0 0 1px rgba(255,255,255,0.03),
          0 18px 60px rgba(0,0,0,0.45),
          0 0 28px ${theme.glow}
        `,
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.wash}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_16%,transparent_84%,rgba(255,255,255,0.02))]" />

      <GhostGeometry accent={theme.accent} />

      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-[28%] w-[34%]">
          <CornerRoots accent={theme.accent} glow={theme.glow} rootStyle={theme.rootStyle} />
        </div>
        <div className="absolute right-0 top-0 h-[28%] w-[34%]">
          <CornerRoots accent={theme.accent} glow={theme.glow} rootStyle={theme.rootStyle} flipX />
        </div>
        <div className="absolute left-0 bottom-0 h-[28%] w-[34%]">
          <CornerRoots accent={theme.accent} glow={theme.glow} rootStyle={theme.rootStyle} flipY />
        </div>
        <div className="absolute right-0 bottom-0 h-[28%] w-[34%]">
          <CornerRoots accent={theme.accent} glow={theme.glow} rootStyle={theme.rootStyle} flipX flipY />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-[5.5%] rounded-[1.5rem] border border-white/6" />
      <div className="pointer-events-none absolute inset-x-[8%] top-[5.5%] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="pointer-events-none absolute inset-x-[8%] bottom-[5.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}