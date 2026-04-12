// D:\eidomancer\src\components\daily\DailyCastCard.jsx

import DailyShareButton from "./DailyShareButton";

function getSectionContent(cast, type) {
  if (!cast || !Array.isArray(cast.sections)) return "";
  return cast.sections.find((section) => section?.type === type)?.content || "";
}

function formatDateLabel(dateKey = "") {
  if (!dateKey) return "Today";

  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SectionBlock({ title, content }) {
  if (!content) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
        {title}
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/85">
        {content}
      </div>
    </div>
  );
}

export default function DailyCastCard({
  cast,
  onShare,
  shareMessage = "",
  showPoem = true,
  className = "",
}) {
  if (!cast) return null;

  const coreTitle = cast?.coreCard?.title || cast?.title || "Daily Cast";
  const coreSubtitle = cast?.coreCard?.subtitle || cast?.subtitle || "";
  const coreHook = cast?.coreCard?.hook || "";
  const dailyFocus = cast?.metadata?.dailyFocus || "";

  const signal = getSectionContent(cast, "signal");
  const tension = getSectionContent(cast, "tension");
  const pattern = getSectionContent(cast, "pattern");
  const poem = getSectionContent(cast, "poem");
  const echo = cast?.echo || getSectionContent(cast, "echo");
  const actionPrompt = tension || pattern || signal;

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
              {formatDateLabel(cast?.dateKey)}
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {coreTitle}
            </h2>
            {coreSubtitle ? (
              <div className="mt-2 text-base text-white/70">{coreSubtitle}</div>
            ) : null}
          </div>

          <DailyShareButton onShare={onShare} shareMessage={shareMessage} />
        </div>

        {dailyFocus ? (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
              Today’s Focus
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cyan-50/90">
              {dailyFocus}
            </div>
          </div>
        ) : null}

        {coreHook ? (
          <div className="mt-6 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4 text-base leading-7 text-fuchsia-50">
            {coreHook}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionBlock title="Signal" content={signal} />
        <SectionBlock title="Pattern" content={pattern} />
        <SectionBlock title="Tension" content={tension} />
        <SectionBlock title="Echo" content={echo} />
      </div>

      {showPoem && poem ? <SectionBlock title="Poem" content={poem} /> : null}

      {actionPrompt ? (
        <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-orange-200/75">
            Action Prompt
          </div>
          <div className="mt-2 text-sm leading-6 text-orange-50/90">
            {actionPrompt}
          </div>
        </div>
      ) : null}
    </div>
  );
}