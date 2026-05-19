// D:\eidomancer\src\components\CoreCard.jsx

import CardFrame from "./CardFrame";

const VALID_TYPES = new Set(["signal", "tension", "pattern", "poem", "echo"]);

function normalizeText(value = "") {
  return typeof value === "string" ? value.trim() : "";
}

function hashString(value = "") {
  let hash = 0;
  const text = String(value || "");

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function pickFrom(seed, options = []) {
  if (!Array.isArray(options) || options.length === 0) return "";
  return options[seed % options.length];
}

function getVisualSeed(core) {
  const visual = core?.visual || {};
  return [
    core?.title,
    visual.subject,
    visual.archetypeFigure,
    visual.environment,
    visual.primaryMotif,
    Array.isArray(visual.secondaryMotifs) ? visual.secondaryMotifs.join(" ") : "",
    visual.paletteHint,
    visual.lighting,
    visual.atmosphere,
    visual.composition,
    Array.isArray(visual.symbolicProps) ? visual.symbolicProps.join(" ") : "",
    visual.imagePrompt,
  ]
    .filter(Boolean)
    .join(" :: ");
}

function getDominantType(cast) {
  const firstType =
    Array.isArray(cast?.sections) && cast.sections.length > 0
      ? cast.sections[0]?.type
      : "";

  return VALID_TYPES.has(firstType) ? firstType : "signal";
}

function getCoreCard(cast) {
  if (!cast || typeof cast !== "object") return null;
  if (!cast.coreCard || typeof cast.coreCard !== "object") return null;

  const visual =
    cast.coreCard.visual && typeof cast.coreCard.visual === "object"
      ? cast.coreCard.visual
      : {};
  const title = normalizeText(cast.coreCard.title || cast.coreCard.name);
  const subtitle = normalizeText(cast.coreCard.subtitle);
  const hook = normalizeText(
    cast.coreCard.hook || visual.subject || visual.atmosphere
  );
  const imageUrl = normalizeText(cast.coreCard.imageUrl);
  if (!title && !subtitle && !hook && !imageUrl) return null;

  return {
    title: title || "Core Card",
    subtitle,
    hook,
    imageUrl,
    visual,
  };
}

function getTypeAccent(dominantType) {
  switch (dominantType) {
    case "tension":
      return { sigil: "✦" };
    case "pattern":
      return { sigil: "⬡" };
    case "poem":
      return { sigil: "☽" };
    case "echo":
      return { sigil: "✧" };
    case "signal":
    default:
      return { sigil: "◈" };
  }
}

function getVisualPalette(visual = {}, dominantType = "signal") {
  const source = [
    visual.paletteHint,
    visual.atmosphere,
    visual.lighting,
    visual.primaryMotif,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (source.includes("crimson") || source.includes("ember")) {
    return ["#120b0b", "#fb7185", "#f97316", "#fde68a"];
  }

  if (source.includes("fuchsia") || source.includes("violet")) {
    return ["#100718", "#f0abfc", "#8b5cf6", "#14b8a6"];
  }

  if (source.includes("green") || source.includes("glass")) {
    return ["#06111f", "#34d399", "#22d3ee", "#a7f3d0"];
  }

  if (dominantType === "tension") {
    return ["#120b0b", "#fb923c", "#facc15", "#38bdf8"];
  }

  if (dominantType === "pattern") {
    return ["#06111f", "#60a5fa", "#22d3ee", "#8b5cf6"];
  }

  return ["#071019", "#22d3ee", "#f59e0b", "#8b5cf6"];
}

function VisualGlyph({ core, dominantType }) {
  const visual = core?.visual || {};
  const seedText = getVisualSeed(core);
  const hasVisual = Boolean(seedText);
  if (!hasVisual) return null;

  const seed = hashString(seedText);
  const palette = getVisualPalette(visual, dominantType);
  const primaryMotif = normalizeText(visual.primaryMotif).toLowerCase();
  const rotation = (seed % 28) - 14;
  const orbitCount = 3 + (seed % 3);
  const nodes = Array.from({ length: orbitCount }, (_, index) => {
    const local = hashString(`${seedText}-${index}`);
    const angle = (Math.PI * 2 * index) / orbitCount + (local % 24) / 24;
    const radius = 34 + ((local >>> 5) % 20);
    const cx = 50 + Math.cos(angle) * radius;
    const cy = 50 + Math.sin(angle) * radius;

    return (
      <circle
        key={index}
        cx={cx.toFixed(2)}
        cy={cy.toFixed(2)}
        r={3 + (local % 5)}
        fill={palette[(index % 3) + 1]}
        opacity="0.58"
      />
    );
  });
  const figure = pickFrom(seed, [
    "M50 20 C62 34 68 48 66 64 C64 80 56 90 50 96 C44 90 36 80 34 64 C32 48 38 34 50 20Z",
    "M50 16 L68 52 L50 92 L32 52Z",
    "M50 18 C70 34 78 58 50 94 C22 58 30 34 50 18Z",
    "M28 76 C36 38 64 38 72 76 C62 66 38 66 28 76Z",
  ]);
  const motifStroke = primaryMotif.includes("fracture")
    ? "M28 18 L46 48 L38 48 L60 86 L54 56 L68 56"
    : primaryMotif.includes("thread") || primaryMotif.includes("orbit")
    ? "M18 54 C32 28 66 28 82 54 C66 80 32 80 18 54Z"
    : primaryMotif.includes("aperture")
    ? "M50 20 A30 30 0 1 1 49.9 20 M50 34 A16 16 0 1 0 50.1 34"
    : "M50 16 L58 42 L84 50 L58 58 L50 84 L42 58 L16 50 L42 42Z";

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-[12%] rounded-full opacity-70 blur-2xl"
        style={{
          background: `radial-gradient(circle, ${palette[1]}55, ${palette[3]}18 42%, transparent 70%)`,
        }}
      />
      <svg
        viewBox="0 0 100 100"
        className="absolute left-1/2 top-[17%] h-[48%] w-[62%] -translate-x-1/2 opacity-90"
        aria-hidden="true"
      >
        <g transform={`rotate(${rotation} 50 50)`}>
          <path
            d={figure}
            fill={palette[0]}
            opacity="0.42"
            stroke={palette[1]}
            strokeWidth="1.6"
          />
          <path
            d={motifStroke}
            fill="none"
            stroke={palette[2]}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            opacity="0.72"
          />
          <circle
            cx="50"
            cy="52"
            r={18 + (seed % 9)}
            fill="none"
            stroke={palette[3]}
            strokeWidth="1.2"
            opacity="0.5"
          />
          {nodes}
        </g>
      </svg>
      <div
        className="absolute inset-x-[18%] bottom-[18%] h-px opacity-45"
        style={{
          background: `linear-gradient(90deg, transparent, ${palette[2]}, transparent)`,
        }}
      />
    </div>
  );
}

export default function CoreCard({ cast, className = "" }) {
  const core = getCoreCard(cast);
  if (!core) return null;

  const dominantType = getDominantType(cast);
  const accent = getTypeAccent(dominantType);

  const hasImage = Boolean(core.imageUrl);

  return (
    <div
      id="eidomancer-core-card"
      data-export-target="core-card"
      className={className}
    >
      <CardFrame dominantType={dominantType} mode="portrait">
        <div className="relative flex h-full flex-col overflow-hidden">

          {/* IMAGE LAYER */}
          {hasImage ? (
            <div className="absolute inset-0">
              <img
                src={core.imageUrl}
                alt={core.title}
                className="h-full w-full object-cover"
              />

              {/* dark overlay for readability */}
              <div className="absolute inset-0 bg-black/55" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1622] to-[#020817]">
              <VisualGlyph core={core} dominantType={dominantType} />
            </div>
          )}

          {hasImage ? <VisualGlyph core={core} dominantType={dominantType} /> : null}

          {/* CONTENT */}
          <div className="relative z-10 flex h-full flex-col px-5 pb-5 pt-10 md:px-6 md:pb-6 md:pt-12 text-center">

            {/* TOP SIGIL */}
            <div className="flex items-center justify-center gap-4 text-white/70">
              <span className="text-lg">{accent.sigil}</span>
              <span className="text-[10px] uppercase tracking-[0.35em] text-white/40">
                Eidomancer
              </span>
              <span className="text-lg">{accent.sigil}</span>
            </div>

            {/* TITLE */}
            <h3 className="mx-auto mt-10 max-w-[12ch] text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
              {core.title}
            </h3>

            {/* SUBTITLE */}
            {core.subtitle ? (
              <p className="mx-auto mt-4 max-w-[22ch] text-sm leading-6 text-white/85">
                {core.subtitle}
              </p>
            ) : null}

            {/* HOOK */}
            {core.hook ? (
              <p className="mx-auto mt-6 max-w-[22ch] text-sm italic leading-7 text-white/90">
                {core.hook}
              </p>
            ) : null}

            {/* FOOT */}
            <div className="mt-auto pt-6">
              <div className="rounded-xl bg-black/40 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/50">
                {core.visual?.primaryMotif || "Remember This"}
              </div>
            </div>

          </div>
        </div>
      </CardFrame>
    </div>
  );
}
