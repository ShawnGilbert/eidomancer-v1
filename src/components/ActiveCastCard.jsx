import CardFrame from "./CardFrame";
import { TarotSectionCard } from "./TarotSectionCard";

function buildLegacySections(cast) {
  if (!cast || typeof cast !== "object") return [];

  return [
    cast.signal
      ? { type: "signal", label: "Signal", content: cast.signal }
      : null,
    cast.tension
      ? { type: "tension", label: "Tension", content: cast.tension }
      : null,
    cast.pattern
      ? { type: "pattern", label: "Pattern", content: cast.pattern }
      : null,
    cast.poem
      ? {
          type: "poem",
          label: "Poem",
          content: cast.poem,
          shape: cast.poemShape || "free_verse",
        }
      : null,
    cast.echo
      ? { type: "echo", label: "Echo", content: cast.echo }
      : null,
  ].filter(Boolean);
}

function getSections(cast) {
  if (!cast || typeof cast !== "object") return [];
  if (Array.isArray(cast.sections) && cast.sections.length > 0) {
    return cast.sections;
  }
  return buildLegacySections(cast);
}

function getTone(type) {
  switch (type) {
    case "signal":
      return "blue";
    case "tension":
      return "ember";
    case "pattern":
      return "violet";
    case "poem":
      return "violet";
    case "echo":
      return "teal";
    default:
      return "violet";
  }
}

function getSigil(type) {
  switch (type) {
    case "signal":
      return "◈";
    case "tension":
      return "✦";
    case "pattern":
      return "⬡";
    case "poem":
      return "☽";
    case "echo":
      return "✧";
    default:
      return "✦";
  }
}

function getDominantType(sections) {
  if (!sections.length) return "signal";
  return sections[0]?.type || "signal";
}

function renderHeaderMeta(cast) {
  const sourceType =
    typeof cast?.sourceType === "string" && cast.sourceType.trim()
      ? cast.sourceType.replace(/_/g, " ")
      : null;

  const questionType =
    typeof cast?.questionType === "string" && cast.questionType.trim()
      ? cast.questionType.replace(/_/g, " ")
      : null;

  const chips = [sourceType, questionType].filter(Boolean);

  if (!chips.length) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      {chips.map((chip) => (
        <div
          key={chip}
          className="rounded-full border border-violet-200/20 bg-violet-300/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-violet-100/85"
        >
          {chip}
        </div>
      ))}
    </div>
  );
}

export default function ActiveCastCard({ cast, isCasting = false }) {
  if (isCasting) {
    return (
      <CardFrame dominantType="signal" className="p-8 md:p-10">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300/70">
            Active Cast
          </div>
          <div className="mt-6 text-3xl font-semibold text-white">
            Casting...
          </div>
          <p className="mt-4 text-sm text-slate-300/80">
            Interpreting pattern. Compressing tension. Listening for signal.
          </p>
        </div>
      </CardFrame>
    );
  }

  if (!cast || typeof cast !== "object") return null;

  const sections = getSections(cast);
  const dominantType = getDominantType(sections);

  const primarySections = sections.filter((section) => section?.type !== "poem");
  const poemSection = sections.find((section) => section?.type === "poem");

  return (
    <div className="space-y-7">
      <CardFrame dominantType={dominantType} className="p-8 md:p-10">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300/70">
            Active Cast
          </div>

          <div className="mt-5 flex items-center justify-center gap-8 text-violet-200/90">
            <span className="text-2xl">✦</span>
            <span className="text-sm">◌</span>
            <span className="text-2xl">✦</span>
          </div>

          {renderHeaderMeta(cast)}

          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {cast.title || "Untitled Cast"}
          </h2>

          {cast.question ? (
            <p className="mt-5 text-lg text-slate-300/90">
              <span className="text-slate-400">Question:</span>{" "}
              {cast.question}
            </p>
          ) : cast.subtitle ? (
            <p className="mt-5 text-base text-slate-300/85">
              {cast.subtitle}
            </p>
          ) : null}
        </div>
      </CardFrame>

      {primarySections.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {primarySections.map((section, index) => (
            <TarotSectionCard
              key={`${section.type || "section"}-${index}`}
              title={section.label || "Section"}
              body={section.content || ""}
              sigil={getSigil(section.type)}
              tone={getTone(section.type)}
              orientation="portrait"
            />
          ))}
        </div>
      ) : null}

      {poemSection ? (
        <TarotSectionCard
          title={poemSection.label || "Poem"}
          body={poemSection.content || ""}
          sigil={getSigil(poemSection.type)}
          tone={getTone(poemSection.type)}
          orientation="landscape"
        />
      ) : null}
    </div>
  );
}