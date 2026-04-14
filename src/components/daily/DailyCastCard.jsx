// D:\eidomancer\src\components\daily\DailyCastCard.jsx

import { useEffect, useMemo, useState } from "react";
import CoreCard from "../CoreCard";
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

function buildGuidance({ signal, pattern, tension, echo, coreHook }) {
  if (echo) return echo;
  if (tension) return tension;
  if (pattern) return pattern;
  if (signal) return signal;
  if (coreHook) return coreHook;
  return "";
}

function SectionBlock({ title, content, tone = "default" }) {
  if (!content) return null;

  const toneClasses = {
    default: "border-white/10 bg-white/5 text-white/85",
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-50/90",
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-50/90",
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-50/90",
    fuchsia: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-50/90",
  };

  const labelToneClasses = {
    default: "text-cyan-200/70",
    cyan: "text-cyan-200/75",
    violet: "text-violet-200/75",
    orange: "text-orange-200/75",
    fuchsia: "text-fuchsia-200/75",
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-lg ${toneClasses[tone] || toneClasses.default}`}
    >
      <div
        className={`text-xs uppercase tracking-[0.2em] ${labelToneClasses[tone] || labelToneClasses.default}`}
      >
        {title}
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!cast) return;

    setVisible(false);

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cast]);

  const content = useMemo(() => {
    if (!cast) return null;

    const coreTitle = cast?.coreCard?.title || cast?.title || "Daily Cast";
    const coreSubtitle = cast?.coreCard?.subtitle || cast?.subtitle || "";
    const coreHook = cast?.coreCard?.hook || "";
    const dailyFocus = cast?.metadata?.dailyFocus || cast?.question || "";

    const signal = getSectionContent(cast, "signal");
    const tension = getSectionContent(cast, "tension");
    const pattern = getSectionContent(cast, "pattern");
    const poem = getSectionContent(cast, "poem");
    const echo = cast?.echo || getSectionContent(cast, "echo");

    const guidance = buildGuidance({
      signal,
      pattern,
      tension,
      echo,
      coreHook,
    });

    return {
      coreTitle,
      coreSubtitle,
      coreHook,
      dailyFocus,
      signal,
      tension,
      pattern,
      poem,
      echo,
      guidance,
    };
  }, [cast]);

  if (!cast || !content) return null;

  const {
    coreTitle,
    coreSubtitle,
    dailyFocus,
    signal,
    tension,
    pattern,
    poem,
    echo,
    guidance,
  } = content;

  return (
    <div
      className={`space-y-6 transform transition-all duration-500 ease-out ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-3 scale-[0.98] opacity-0"
      } ${className}`.trim()}
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">
                {formatDateLabel(cast?.dateKey)}
              </div>
              <div className="mt-3 text-sm uppercase tracking-[0.2em] text-white/45">
                Daily Cast
              </div>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                You have drawn the{" "}
                <span className="text-cyan-200">“{coreTitle}”</span> card.
              </h2>
              {coreSubtitle ? (
                <div className="mt-3 max-w-2xl text-base leading-7 text-white/70">
                  {coreSubtitle}
                </div>
              ) : null}
            </div>

            <div className="shrink-0">
              <DailyShareButton onShare={onShare} shareMessage={shareMessage} />
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <CoreCard cast={cast} title="Core Card" />

          {dailyFocus ? (
            <SectionBlock title="Question / Focus" content={dailyFocus} tone="cyan" />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <SectionBlock title="Pattern" content={pattern} tone="default" />
            <SectionBlock title="Tension" content={tension} tone="orange" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SectionBlock title="Signal" content={signal} tone="violet" />
            <SectionBlock title="Echo" content={echo} tone="default" />
          </div>

          {showPoem && poem ? (
            <SectionBlock title="Poem" content={poem} tone="fuchsia" />
          ) : null}

          {guidance ? (
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
                Guidance
              </div>
              <div className="mt-2 text-sm leading-6 text-cyan-50/95">
                {guidance}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}