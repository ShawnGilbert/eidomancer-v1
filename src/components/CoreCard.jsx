// D:\eidomancer\src\components\CoreCard.jsx

import CardFrame from "./CardFrame";

const VALID_TYPES = new Set(["signal", "tension", "pattern", "poem", "echo"]);

function normalizeText(value = "") {
  return typeof value === "string" ? value.trim() : "";
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

  const title = normalizeText(cast.coreCard.title);
  const subtitle = normalizeText(cast.coreCard.subtitle);
  const hook = normalizeText(cast.coreCard.hook);
  const imageUrl = normalizeText(cast.coreCard.imageUrl);
  if (!title && !subtitle && !hook && !imageUrl) return null;

  return {
    title: title || "Core Card",
    subtitle,
    hook,
    imageUrl,
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1622] to-[#020817]" />
          )}

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
                Remember This
              </div>
            </div>

          </div>
        </div>
      </CardFrame>
    </div>
  );
}