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

  if (!title && !subtitle && !hook) return null;

  return {
    title: title || "Core Card",
    subtitle,
    hook,
  };
}

function getQuestionText(cast) {
  if (typeof cast?.question === "string" && cast.question.trim()) {
    return cast.question.trim();
  }

  if (typeof cast?.input === "string" && cast.input.trim()) {
    return cast.input.trim();
  }

  return "";
}

export default function CoreCard({ cast, title = "Core Card" }) {
  const core = getCoreCard(cast);

  if (!core) return null;

  const dominantType = getDominantType(cast);
  const questionText = getQuestionText(cast);

  return (
    <CardFrame dominantType={dominantType} className="p-6 md:p-8">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300/70">
          {title}
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 text-violet-200/90">
          <span className="text-xl">✦</span>
          <span className="text-sm">◌</span>
          <span className="text-xl">✦</span>
        </div>

        <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {core.title}
        </h3>

        {core.subtitle ? (
          <p className="mt-3 text-base text-slate-300/85">{core.subtitle}</p>
        ) : null}

        {core.hook ? (
          <p className="mt-3 text-sm italic text-violet-100/80">{core.hook}</p>
        ) : null}

        {questionText ? (
          <p className="mt-5 text-sm text-slate-300/85">
            <span className="text-slate-400">Question:</span> {questionText}
          </p>
        ) : null}
      </div>
    </CardFrame>
  );
}