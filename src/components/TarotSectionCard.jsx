const PALETTES = {
  blue: {
    stroke: "rgba(120, 220, 255, 0.38)",
    faint: "rgba(120, 220, 255, 0.14)",
    node: "rgba(170, 240, 255, 0.52)",
    glowColor: "rgba(80, 180, 255, 0.10)",
    crown: "⊚",
    anchor: "◌",
    shell:
      "border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(80,180,255,0.12),transparent_30%),linear-gradient(180deg,rgba(5,18,45,0.98),rgba(2,9,28,0.98))]",
    glow: "shadow-[0_20px_60px_rgba(40,120,220,0.18)]",
    line: "bg-cyan-200/22",
    title: "text-cyan-100/82",
    text: "text-cyan-50/92",
    sigil: "text-cyan-200/80",
  },
  ember: {
    stroke: "rgba(255, 174, 94, 0.38)",
    faint: "rgba(255, 174, 94, 0.14)",
    node: "rgba(255, 208, 140, 0.52)",
    glowColor: "rgba(255, 140, 80, 0.10)",
    crown: "✦",
    anchor: "⟁",
    shell:
      "border-orange-300/20 bg-[radial-gradient(circle_at_top,rgba(255,150,70,0.12),transparent_30%),linear-gradient(180deg,rgba(22,10,30,0.98),rgba(10,7,24,0.98))]",
    glow: "shadow-[0_20px_60px_rgba(220,110,40,0.16)]",
    line: "bg-orange-200/22",
    title: "text-orange-100/82",
    text: "text-orange-50/92",
    sigil: "text-orange-200/80",
  },
  violet: {
    stroke: "rgba(196, 167, 255, 0.38)",
    faint: "rgba(196, 167, 255, 0.14)",
    node: "rgba(220, 196, 255, 0.50)",
    glowColor: "rgba(150, 110, 255, 0.10)",
    crown: "◈",
    anchor: "≈",
    shell:
      "border-violet-300/20 bg-[radial-gradient(circle_at_top,rgba(170,120,255,0.12),transparent_30%),linear-gradient(180deg,rgba(20,16,58,0.98),rgba(8,8,32,0.98))]",
    glow: "shadow-[0_20px_60px_rgba(120,90,220,0.18)]",
    line: "bg-violet-200/22",
    title: "text-violet-100/82",
    text: "text-violet-50/92",
    sigil: "text-violet-200/80",
  },
  teal: {
    stroke: "rgba(112, 255, 224, 0.38)",
    faint: "rgba(112, 255, 224, 0.14)",
    node: "rgba(180, 255, 236, 0.50)",
    glowColor: "rgba(70, 220, 190, 0.10)",
    crown: "🜃",
    anchor: "⊙",
    shell:
      "border-teal-300/20 bg-[radial-gradient(circle_at_top,rgba(70,220,190,0.12),transparent_30%),linear-gradient(180deg,rgba(8,36,44,0.98),rgba(4,16,28,0.98))]",
    glow: "shadow-[0_20px_60px_rgba(30,160,140,0.18)]",
    line: "bg-teal-200/22",
    title: "text-teal-100/82",
    text: "text-teal-50/92",
    sigil: "text-teal-200/80",
  },
};

function getPalette(tone) {
  return PALETTES[tone] || PALETTES.violet;
}

function normalizeBody(body) {
  if (typeof body === "string") return body.trim();
  if (body == null) return "";
  return String(body).trim();
}

function getBodyClasses(content, isPortrait) {
  const length = content.length;

  if (isPortrait) {
    if (length < 90) return "max-w-[22ch] text-[18px] leading-10";
    if (length < 180) return "max-w-[20ch] text-[16px] leading-9";
    return "max-w-[18ch] text-[15px] leading-8";
  }

  if (length < 120) return "max-w-[48ch] text-[18px] leading-10";
  if (length < 260) return "max-w-[42ch] text-[16px] leading-9";
  return "max-w-[38ch] text-[15px] leading-8";
}

function FiligreeOverlay({ tone = "violet", orientation = "portrait" }) {
  const palette = getPalette(tone);
  const isPortrait = orientation === "portrait";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]"
    >
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ filter: `drop-shadow(0 0 6px ${palette.glowColor})` }}
      >
        <path d="M 20 74 C 34 52, 54 36, 82 26" fill="none" stroke={palette.stroke} strokeWidth="0.98" strokeLinecap="round" />
        <path d="M 58 22 C 92 16, 124 20, 160 34" fill="none" stroke={palette.stroke} strokeWidth="0.92" strokeLinecap="round" />
        <path d="M 128 30 C 156 38, 184 50, 214 72" fill="none" stroke={palette.faint} strokeWidth="0.78" strokeLinecap="round" />
        <path d="M 26 116 C 46 98, 70 84, 98 78" fill="none" stroke={palette.faint} strokeWidth="0.72" strokeLinecap="round" />
        <path d="M 88 62 C 94 88, 98 112, 98 136" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 154 44 C 164 66, 172 86, 176 108" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 200 72 C 222 86, 242 102, 262 124" fill="none" stroke={palette.faint} strokeWidth="0.66" strokeLinecap="round" />

        <path d="M 980 74 C 966 52, 946 36, 918 26" fill="none" stroke={palette.stroke} strokeWidth="0.98" strokeLinecap="round" />
        <path d="M 942 22 C 908 16, 876 20, 840 34" fill="none" stroke={palette.stroke} strokeWidth="0.92" strokeLinecap="round" />
        <path d="M 872 30 C 844 38, 816 50, 786 72" fill="none" stroke={palette.faint} strokeWidth="0.78" strokeLinecap="round" />
        <path d="M 974 116 C 954 98, 930 84, 902 78" fill="none" stroke={palette.faint} strokeWidth="0.72" strokeLinecap="round" />
        <path d="M 912 62 C 906 88, 902 112, 902 136" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 846 44 C 836 66, 828 86, 824 108" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 800 72 C 778 86, 758 102, 738 124" fill="none" stroke={palette.faint} strokeWidth="0.66" strokeLinecap="round" />

        <path d="M 20 626 C 34 648, 54 664, 82 674" fill="none" stroke={palette.stroke} strokeWidth="0.98" strokeLinecap="round" />
        <path d="M 58 678 C 92 684, 124 680, 160 666" fill="none" stroke={palette.stroke} strokeWidth="0.92" strokeLinecap="round" />
        <path d="M 128 670 C 156 662, 184 650, 214 628" fill="none" stroke={palette.faint} strokeWidth="0.78" strokeLinecap="round" />
        <path d="M 26 584 C 46 602, 70 616, 98 622" fill="none" stroke={palette.faint} strokeWidth="0.72" strokeLinecap="round" />
        <path d="M 88 638 C 94 612, 98 588, 98 564" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 154 656 C 164 634, 172 614, 176 592" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 200 628 C 222 614, 242 598, 262 576" fill="none" stroke={palette.faint} strokeWidth="0.66" strokeLinecap="round" />

        <path d="M 980 626 C 966 648, 946 664, 918 674" fill="none" stroke={palette.stroke} strokeWidth="0.98" strokeLinecap="round" />
        <path d="M 942 678 C 908 684, 876 680, 840 666" fill="none" stroke={palette.stroke} strokeWidth="0.92" strokeLinecap="round" />
        <path d="M 872 670 C 844 662, 816 650, 786 628" fill="none" stroke={palette.faint} strokeWidth="0.78" strokeLinecap="round" />
        <path d="M 974 584 C 954 602, 930 616, 902 622" fill="none" stroke={palette.faint} strokeWidth="0.72" strokeLinecap="round" />
        <path d="M 912 638 C 906 612, 902 588, 902 564" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 846 656 C 836 634, 828 614, 824 592" fill="none" stroke={palette.faint} strokeWidth="0.64" strokeLinecap="round" />
        <path d="M 800 628 C 778 614, 758 598, 738 576" fill="none" stroke={palette.faint} strokeWidth="0.66" strokeLinecap="round" />

        <path d="M 26 188 C 32 224, 34 260, 32 294" fill="none" stroke={palette.faint} strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 30 328 C 30 340, 30 350, 30 360" fill="none" stroke={palette.faint} strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 32 404 C 34 438, 32 474, 26 510" fill="none" stroke={palette.faint} strokeWidth="0.5" strokeLinecap="round" />

        <path d="M 974 188 C 968 224, 966 260, 968 294" fill="none" stroke={palette.faint} strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 970 328 C 970 340, 970 350, 970 360" fill="none" stroke={palette.faint} strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 968 404 C 966 438, 968 474, 974 510" fill="none" stroke={palette.faint} strokeWidth="0.5" strokeLinecap="round" />

        <path d="M 328 28 C 366 40, 408 46, 452 48" fill="none" stroke={palette.stroke} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 472 48 C 490 49, 510 49, 528 48" fill="none" stroke={palette.stroke} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 548 48 C 592 46, 634 40, 672 28" fill="none" stroke={palette.stroke} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 392 62 C 424 56, 456 54, 482 54" fill="none" stroke={palette.faint} strokeWidth="0.66" strokeLinecap="round" />
        <path d="M 518 54 C 544 54, 576 56, 608 62" fill="none" stroke={palette.faint} strokeWidth="0.66" strokeLinecap="round" />

        <path d="M 336 672 C 376 660, 418 654, 462 652" fill="none" stroke={palette.stroke} strokeWidth="0.86" strokeLinecap="round" />
        <path d="M 480 652 C 494 651, 506 651, 520 652" fill="none" stroke={palette.stroke} strokeWidth="0.76" strokeLinecap="round" />
        <path d="M 538 652 C 582 654, 624 660, 664 672" fill="none" stroke={palette.stroke} strokeWidth="0.86" strokeLinecap="round" />
        <path d="M 500 648 C 500 632, 500 616, 500 600" fill="none" stroke={palette.stroke} strokeWidth="0.72" strokeLinecap="round" />

        <path
          d="M 464 38 L 474 26 L 484 38"
          fill="none"
          stroke={palette.faint}
          strokeWidth="0.68"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 516 38 L 526 26 L 536 38"
          fill="none"
          stroke={palette.faint}
          strokeWidth="0.68"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 490 616 C 494 622, 497 626, 500 629 C 503 626, 506 622, 510 616"
          fill="none"
          stroke={palette.faint}
          strokeWidth="0.62"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="58" cy="22" r="1.05" fill={palette.node} fillOpacity="0.82" />
        <circle cx="152" cy="44" r="0.98" fill={palette.node} fillOpacity="0.78" />
        <circle cx="98" cy="136" r="1.02" fill={palette.node} fillOpacity="0.76" />
        <circle cx="176" cy="108" r="0.96" fill={palette.node} fillOpacity="0.72" />
        <circle cx="214" cy="72" r="0.94" fill={palette.node} fillOpacity="0.68" />

        <circle cx="942" cy="22" r="1.05" fill={palette.node} fillOpacity="0.82" />
        <circle cx="848" cy="44" r="0.98" fill={palette.node} fillOpacity="0.78" />
        <circle cx="902" cy="136" r="1.02" fill={palette.node} fillOpacity="0.76" />
        <circle cx="824" cy="108" r="0.96" fill={palette.node} fillOpacity="0.72" />
        <circle cx="786" cy="72" r="0.94" fill={palette.node} fillOpacity="0.68" />

        <circle cx="58" cy="678" r="1.05" fill={palette.node} fillOpacity="0.82" />
        <circle cx="152" cy="656" r="0.98" fill={palette.node} fillOpacity="0.78" />
        <circle cx="98" cy="564" r="1.02" fill={palette.node} fillOpacity="0.76" />
        <circle cx="176" cy="592" r="0.96" fill={palette.node} fillOpacity="0.72" />
        <circle cx="214" cy="628" r="0.94" fill={palette.node} fillOpacity="0.68" />

        <circle cx="942" cy="678" r="1.05" fill={palette.node} fillOpacity="0.82" />
        <circle cx="848" cy="656" r="0.98" fill={palette.node} fillOpacity="0.78" />
        <circle cx="902" cy="564" r="1.02" fill={palette.node} fillOpacity="0.76" />
        <circle cx="824" cy="592" r="0.96" fill={palette.node} fillOpacity="0.72" />
        <circle cx="786" cy="628" r="0.94" fill={palette.node} fillOpacity="0.68" />

        <circle cx="30" cy="350" r="1.45" fill={palette.node} fillOpacity="0.82" />
        <circle cx="970" cy="350" r="1.45" fill={palette.node} fillOpacity="0.82" />
        <circle cx="500" cy="652" r="1.38" fill={palette.node} fillOpacity="0.86" />
        <circle cx="500" cy="48" r="1.24" fill={palette.node} fillOpacity="0.86" />

        {!isPortrait && (
          <>
            <path
              d="M 300 336 C 330 334, 358 334, 382 336"
              fill="none"
              stroke={palette.faint}
              strokeWidth="0.42"
              strokeLinecap="round"
              opacity="0.42"
            />
            <path
              d="M 700 336 C 670 334, 642 334, 618 336"
              fill="none"
              stroke={palette.faint}
              strokeWidth="0.42"
              strokeLinecap="round"
              opacity="0.42"
            />
          </>
        )}
      </svg>

      <div className="absolute left-1/2 top-[8px] -translate-x-1/2 text-[10px] opacity-70">
        <span style={{ color: palette.stroke }}>{palette.crown}</span>
      </div>

      <div className="absolute left-1/2 bottom-[6px] -translate-x-1/2 text-[10px] opacity-70">
        <span style={{ color: palette.stroke }}>{palette.anchor}</span>
      </div>
    </div>
  );
}

export function TarotSectionCard({
  title,
  body,
  sigil = "✦",
  tone = "violet",
  orientation = "portrait",
}) {
  const content = normalizeBody(body);

  if (!content) return null;

  const palette = getPalette(tone);
  const isPortrait = orientation === "portrait";
  const bodyClasses = getBodyClasses(content, isPortrait);

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[30px] border backdrop-blur-sm",
        palette.shell,
        palette.glow,
        isPortrait ? "min-h-[430px]" : "min-h-[260px]",
      ].join(" ")}
    >
      <FiligreeOverlay tone={tone} orientation={orientation} />

      <div className="relative flex h-full flex-col px-9 py-10">
        <div className="mt-4 text-center">
          <div
            className={`text-[11px] uppercase tracking-[0.32em] ${palette.title}`}
          >
            {title || "Section"}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div
            className={[
              "mx-auto whitespace-pre-wrap text-center",
              bodyClasses,
              palette.text,
            ].join(" ")}
          >
            {content}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-center gap-3">
          <div className={`h-px w-10 ${palette.line}`} />
          <div className={`text-sm ${palette.sigil}`}>{sigil}</div>
          <div className={`h-px w-10 ${palette.line}`} />
        </div>
      </div>
    </div>
  );
}