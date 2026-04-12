// D:\eidomancer\src\components\daily\RecentDailyCasts.jsx

function getSectionContent(cast, type) {
  if (!cast || !Array.isArray(cast.sections)) return "";
  return cast.sections.find((section) => section?.type === type)?.content || "";
}

function HistoryCard({ cast, isLocked = false, onSelect }) {
  const title = cast?.coreCard?.title || cast?.title || "Untitled Cast";
  const subtitle = cast?.coreCard?.subtitle || cast?.subtitle || "";
  const echo = cast?.echo || getSectionContent(cast, "echo") || "";
  const dailyFocus = cast?.metadata?.dailyFocus || "";

  return (
    <button
      type="button"
      onClick={() => !isLocked && onSelect?.(cast)}
      disabled={isLocked}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        isLocked
          ? "cursor-not-allowed border-white/10 bg-white/5 opacity-60"
          : "border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
          {cast?.dateKey || "Recent"}
        </div>

        {!isLocked && dailyFocus ? (
          <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/80">
            Focused
          </div>
        ) : null}
      </div>

      <div className="mt-2 text-base font-semibold text-white">{title}</div>

      {subtitle ? (
        <div className="mt-1 text-sm text-white/70">{subtitle}</div>
      ) : null}

      {!isLocked && dailyFocus ? (
        <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-500/10 p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/75">
            Focus
          </div>
          <div className="mt-1 line-clamp-2 text-sm leading-5 text-cyan-50/85">
            {dailyFocus}
          </div>
        </div>
      ) : null}

      <div className="mt-3 text-sm text-white/75 line-clamp-3">
        {isLocked ? "Premium unlock: view deeper recent history." : echo || "No echo available."}
      </div>
    </button>
  );
}

export default function RecentDailyCasts({
  casts = [],
  historyLimit = 3,
  canViewFullHistory = false,
  onSelectCast,
  className = "",
}) {
  const visibleHistory = Array.isArray(casts) ? casts.slice(0, historyLimit) : [];
  const hiddenHistoryCount = Math.max(0, (casts?.length || 0) - visibleHistory.length);

  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
          Recent Casts
        </div>
        <div className="text-xs text-white/50">
          {visibleHistory.length}/{casts?.length || 0}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {visibleHistory.length > 0 ? (
          visibleHistory.map((cast) => (
            <HistoryCard
              key={cast.id || cast.dateKey}
              cast={cast}
              onSelect={onSelectCast}
            />
          ))
        ) : (
          <div className="text-sm text-white/60">No recent casts yet.</div>
        )}

        {!canViewFullHistory && hiddenHistoryCount > 0 ? (
          <HistoryCard
            cast={{ dateKey: "Locked", title: "Premium History" }}
            isLocked
          />
        ) : null}
      </div>
    </div>
  );
}