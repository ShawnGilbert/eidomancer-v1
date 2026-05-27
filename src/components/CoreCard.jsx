// D:\eidomancer\src\components\CoreCard.jsx

import CardFrame from "./CardFrame";
import { getCoreCardThemeVisual } from "../lib/artifactPresentation";
import { deriveCoreCardFromCast } from "../lib/castToArtifact";

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

function getVisualSeed(core) {
  const visual = core?.visual || {};
  return [
    core?.title,
    core?.subtitle,
    core?.coreObject,
    core?.archetype,
    core?.themeColor,
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
  const derivedCoreCard = deriveCoreCardFromCast(cast);
  if (!derivedCoreCard || typeof derivedCoreCard !== "object") return null;

  const visual =
    derivedCoreCard.visual && typeof derivedCoreCard.visual === "object"
      ? derivedCoreCard.visual
      : {};
  const title = normalizeText(derivedCoreCard.title || derivedCoreCard.name);
  const subtitle = normalizeText(derivedCoreCard.subtitle);
  const coreObject = normalizeText(
    derivedCoreCard.coreObject || derivedCoreCard.description
  );
  const archetype = normalizeText(derivedCoreCard.archetype);
  const themeColor = normalizeText(derivedCoreCard.themeColor).toLowerCase();
  const hook = normalizeText(
    derivedCoreCard.hook || visual.subject || visual.atmosphere
  );
  const imageUrl = normalizeText(derivedCoreCard.imageUrl);
  if (!title && !subtitle && !hook && !imageUrl) return null;

  return {
    title: title || "Core Card",
    subtitle,
    coreObject,
    archetype,
    themeColor,
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

function getVisualPalette(core = {}, dominantType = "signal") {
  const themeVisual = getCoreCardThemeVisual(core.themeColor);
  const visual = core?.visual || {};
  const source = [
    core.themeColor,
    core.coreObject,
    core.archetype,
    visual.paletteHint,
    visual.atmosphere,
    visual.lighting,
    visual.primaryMotif,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (source.includes("crimson") || source.includes("ember")) {
    return getCoreCardThemeVisual("crimson").palette;
  }

  if (source.includes("fuchsia") || source.includes("violet")) {
    return getCoreCardThemeVisual("violet").palette;
  }

  if (source.includes("green") || source.includes("glass")) {
    return getCoreCardThemeVisual("emerald").palette;
  }

  if (dominantType === "tension") {
    return ["#120b0b", "#fb923c", "#facc15", "#38bdf8"];
  }

  if (dominantType === "pattern") {
    return ["#06111f", "#60a5fa", "#22d3ee", "#8b5cf6"];
  }

  return themeVisual.palette;
}

function getSymbolKind(core = {}) {
  const source = [
    core.coreObject,
    core.title,
    core.archetype,
    core.visual?.primaryMotif,
    core.visual?.subject,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (source.includes("engine")) return "engine";
  if (source.includes("root")) return "root";
  if (source.includes("bridge")) return "bridge";
  if (source.includes("storm")) return "storm";
  if (source.includes("archive")) return "archive";
  if (source.includes("mask")) return "mask";
  if (source.includes("compass")) return "compass";
  if (source.includes("threshold")) return "threshold";
  if (source.includes("hollow")) return "hollow";
  if (source.includes("beacon")) return "beacon";
  if (source.includes("lantern")) return "lantern";
  if (source.includes("gate")) return "gate";

  return "core";
}

function SymbolGlyph({ kind, palette, seed }) {
  const [base, primary, secondary, highlight] = palette;
  const common = {
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (kind) {
    case "engine":
      return (
        <g>
          <circle cx="50" cy="52" r="22" fill={base} opacity="0.46" stroke={primary} strokeWidth="2.2" />
          {Array.from({ length: 8 }, (_, index) => {
            const angle = (Math.PI * 2 * index) / 8;
            return (
              <line
                key={index}
                x1={(50 + Math.cos(angle) * 28).toFixed(2)}
                y1={(52 + Math.sin(angle) * 28).toFixed(2)}
                x2={(50 + Math.cos(angle) * 36).toFixed(2)}
                y2={(52 + Math.sin(angle) * 36).toFixed(2)}
                stroke={secondary}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="50" cy="52" r="8" fill={secondary} opacity="0.75" />
        </g>
      );
    case "root":
      return (
        <g {...common} strokeWidth="2">
          <path d="M50 20 C48 38 48 48 50 60" stroke={highlight} />
          <path d="M50 60 C38 72 32 82 26 94" stroke={primary} />
          <path d="M50 60 C62 72 68 82 76 94" stroke={primary} />
          <path d="M50 62 C48 78 46 88 42 98" stroke={secondary} />
          <path d="M36 46 C44 34 56 34 64 46" stroke={secondary} />
        </g>
      );
    case "bridge":
      return (
        <g {...common}>
          <path d="M18 70 C30 36 70 36 82 70" stroke={primary} strokeWidth="3" />
          <path d="M24 70 L76 70" stroke={highlight} strokeWidth="2" />
          <path d="M32 70 L32 84 M50 70 L50 88 M68 70 L68 84" stroke={secondary} strokeWidth="1.7" />
        </g>
      );
    case "storm":
      return (
        <g {...common}>
          <path d="M56 12 L30 54 H48 L40 90 L72 42 H54 Z" fill={primary} opacity="0.72" stroke={highlight} strokeWidth="1.4" />
          <path d="M24 30 C36 18 62 18 76 32" stroke={secondary} strokeWidth="2" />
          <path d="M22 76 C38 66 62 66 78 76" stroke={primary} strokeWidth="1.6" opacity="0.65" />
        </g>
      );
    case "archive":
      return (
        <g {...common}>
          <rect x="27" y="22" width="46" height="58" rx="4" fill={base} opacity="0.5" stroke={primary} strokeWidth="2" />
          <path d="M35 34 H65 M35 46 H65 M35 58 H58" stroke={highlight} strokeWidth="1.6" />
          <path d="M22 30 H27 M73 30 H78 M22 72 H27 M73 72 H78" stroke={secondary} strokeWidth="2" />
        </g>
      );
    case "mask":
      return (
        <g {...common}>
          <path d="M20 46 C30 30 70 30 80 46 C72 70 58 80 50 82 C42 80 28 70 20 46Z" fill={base} opacity="0.45" stroke={primary} strokeWidth="2" />
          <path d="M32 50 C38 44 44 44 48 50 M52 50 C58 44 64 44 70 50" stroke={highlight} strokeWidth="2" />
          <path d="M42 66 C48 70 54 70 60 66" stroke={secondary} strokeWidth="1.6" />
        </g>
      );
    case "compass":
      return (
        <g {...common}>
          <circle cx="50" cy="52" r="32" stroke={primary} strokeWidth="2" fill={base} opacity="0.35" />
          <path d="M50 18 L58 52 L50 86 L42 52 Z" fill={secondary} opacity="0.72" stroke={highlight} strokeWidth="1.4" />
          <path d="M16 52 H84 M50 18 V86" stroke={primary} strokeWidth="1" opacity="0.55" />
        </g>
      );
    case "threshold":
    case "gate":
      return (
        <g {...common}>
          <path d="M30 86 V34 C30 24 70 24 70 34 V86" stroke={primary} strokeWidth="3" />
          <path d="M38 86 V40 C38 34 62 34 62 40 V86" stroke={highlight} strokeWidth="1.8" opacity="0.72" />
          <path d="M46 58 H54" stroke={secondary} strokeWidth="2" />
        </g>
      );
    case "hollow":
      return (
        <g {...common}>
          <circle cx="50" cy="52" r="34" stroke={primary} strokeWidth="2.4" />
          <circle cx="50" cy="52" r="17" stroke={highlight} strokeWidth="1.8" opacity="0.72" />
          <path d="M30 30 L70 74 M70 30 L30 74" stroke={secondary} strokeWidth="1.2" opacity="0.4" />
        </g>
      );
    case "beacon":
    case "lantern":
      return (
        <g {...common}>
          <path d="M38 36 H62 L66 78 H34 Z" fill={base} opacity="0.5" stroke={primary} strokeWidth="2" />
          <path d="M42 36 C42 24 58 24 58 36" stroke={highlight} strokeWidth="2" />
          <circle cx="50" cy="58" r="10" fill={secondary} opacity="0.75" />
          <path d="M18 58 H30 M70 58 H82 M50 16 V28 M28 30 L36 38 M72 30 L64 38" stroke={highlight} strokeWidth="1.5" opacity="0.7" />
        </g>
      );
    case "core":
    default:
      return (
        <g transform={`rotate(${(seed % 28) - 14} 50 50)`}>
          <path
            d="M50 16 L58 42 L84 50 L58 58 L50 84 L42 58 L16 50 L42 42Z"
            fill={base}
            opacity="0.42"
            stroke={primary}
            strokeWidth="1.8"
          />
          <circle cx="50" cy="52" r="18" fill="none" stroke={secondary} strokeWidth="1.4" opacity="0.62" />
        </g>
      );
  }
}

function VisualGlyph({ core, dominantType }) {
  const seedText = getVisualSeed(core);
  const seed = hashString(seedText);
  const palette = getVisualPalette(core, dominantType);
  const kind = getSymbolKind(core);
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
        <SymbolGlyph kind={kind} palette={palette} seed={seed} />
        <g>{nodes}</g>
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
  const themeVisual = getCoreCardThemeVisual(core.themeColor);

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
            <div
              className="absolute inset-0"
              style={{ background: themeVisual.background }}
            >
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
                {core.coreObject || themeVisual.footer || "Remember This"}
              </div>
            </div>

          </div>
        </div>
      </CardFrame>
    </div>
  );
}
