import { useEffect, useState } from "react";
import CoreCard from "../CoreCard";

function getCoreDetails(cast) {
  if (!cast) return null;

  const title = cast?.coreCard?.title || cast?.coreCard?.name || cast?.title || "";
  const subtitle = cast?.coreCard?.subtitle || cast?.subtitle || "";
  const hook = cast?.coreCard?.hook || cast?.coreCard?.description || "";

  if (!title && !subtitle && !hook && !cast?.coreCard?.imageUrl) {
    return null;
  }

  return {
    title: title || "Core Card",
    subtitle,
    hook,
  };
}

export default function DailyCoreCardPreview({ cast, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = getCoreDetails(cast);

  useEffect(() => {
    setIsExpanded(false);
  }, [cast?.id, cast?.dateKey]);

  useEffect(() => {
    if (!isExpanded) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  if (!details) {
    return (
      <div
        className={`min-h-[250px] rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`.trim()}
      >
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
          Core Card
        </div>
        <div className="mt-3 text-sm leading-6 text-white/55">
          Generate a cast to reveal today’s symbolic anchor.
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        aria-expanded={isExpanded}
        className={`block min-h-[250px] w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-cyan-400/25 hover:bg-white/[0.07] ${className}`.trim()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
              Core Card
            </div>
            <div className="mt-2 text-xl font-semibold leading-tight text-white">
              {details.title}
            </div>
          </div>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">
            Expand
          </div>
        </div>

        <div className="mx-auto mt-4 h-[168px] w-[120px] overflow-hidden rounded-[1.05rem]">
          <div className="pointer-events-none w-[300px] origin-top-left scale-[0.4]">
            <CoreCard cast={cast} />
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${details.title} Core Card`}
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative max-h-full w-full max-w-[460px] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="mb-4 ml-auto block rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/75 transition hover:bg-white/15"
            >
              Close
            </button>

            <CoreCard cast={cast} />
          </div>
        </div>
      ) : null}
    </>
  );
}
