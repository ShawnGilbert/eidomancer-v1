import CardFrame from "./CardFrame";
import { TarotSectionCard } from "./TarotSectionCard";
import CoreCard from "./CoreCard";

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
      {chips.map((chip, index) => (
        <div
          key={`${chip}-${index}`}
          className="rounded-full border border-violet-200/20 bg-violet-300/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-violet-100/85"
        >
          {chip}
        </div>
      ))}
    </div>
  );
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

function getHeaderTitle(cast) {
  if (typeof cast?.title === "string" && cast.title.trim()) {
    return cast.title.trim();
  }

  return "Untitled Cast";
}

function getHeaderSubtitle(cast) {
  if (typeof cast?.subtitle === "string" && cast.subtitle.trim()) {
    return cast.subtitle.trim();
  }

  return "";
}

function getHeaderHook(cast) {
  if (typeof cast?.coreCard?.hook === "string" && cast.coreCard.hook.trim()) {
    return cast.coreCard.hook.trim();
  }

  return "";
}

function buildSectionLookup(sections) {
  const lookup = {
    signal: null,
    tension: null,
    pattern: null,
    poem: null,
    echo: null,
  };

  for (const section of sections) {
    if (section?.type && lookup.hasOwnProperty(section.type)) {
      lookup[section.type] = section;
    }
  }

  return lookup;
}

function renderSectionCard(section, index) {
  if (!section) return null;

  return (
    <TarotSectionCard
      key={`${section.type || "section"}-${section.label || "Section"}-${index}`}
      title={section.label || "Section"}
      body={section.content || ""}
      sigil={getSigil(section.type)}
      tone={getTone(section.type)}
      orientation="portrait"
    />
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
  const sectionLookup = buildSectionLookup(sections);

  const headerTitle = getHeaderTitle(cast);
  const headerSubtitle = getHeaderSubtitle(cast);
  const headerHook = getHeaderHook(cast);
  const questionText = getQuestionText(cast);

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
            {headerTitle}
          </h2>

          {headerSubtitle ? (
            <p className="mt-4 text-base text-slate-300/85">{headerSubtitle}</p>
          ) : null}

          {headerHook ? (
            <p className="mt-2 text-sm italic text-violet-100/80">
              {headerHook}
            </p>
          ) : null}

          {questionText ? (
            <p className="mt-5 text-lg text-slate-300/90">
              <span className="text-slate-400">Question:</span>{" "}
              {questionText}
            </p>
          ) : null}
        </div>
      </CardFrame>

      <div className="grid gap-6 lg:grid-cols-3">
        <div>{renderSectionCard(sectionLookup.signal, 0)}</div>

        <div>
          <CoreCard cast={cast} title="Core Card" />
        </div>

        <div>{renderSectionCard(sectionLookup.pattern, 1)}</div>

        <div>{renderSectionCard(sectionLookup.echo, 2)}</div>

        <div className="hidden lg:block" />

        <div>{renderSectionCard(sectionLookup.tension, 3)}</div>
      </div>

      {sectionLookup.poem ? (
        <TarotSectionCard
          key={`${sectionLookup.poem.type || "poem"}-${sectionLookup.poem.label || "Poem"}-full`}
          title={sectionLookup.poem.label || "Poem"}
          body={sectionLookup.poem.content || ""}
          sigil={getSigil(sectionLookup.poem.type)}
          tone={getTone(sectionLookup.poem.type)}
          orientation="landscape"
        />
      ) : null}
    </div>
  );
}