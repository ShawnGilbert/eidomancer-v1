// D:\eidomancer\src\components\daily\DailySidebar.jsx

import RecentDailyCasts from "./RecentDailyCasts";
import DailyAnalyticsPanel from "./DailyAnalyticsPanel";

function formatGenerationSource(selectedCast) {
  const reason = selectedCast?.metadata?.generationReason || "";
  const dailyFocus = selectedCast?.metadata?.dailyFocus || "";

  if (reason === "focus_submitted" && dailyFocus) {
    return "Regenerated from focus";
  }

  if (reason === "focus_cleared") {
    return "Regenerated after focus cleared";
  }

  if (dailyFocus) {
    return "Focus-guided daily cast";
  }

  return "Default daily cast";
}

export default function DailySidebar({
  capabilities,
  recentCasts = [],
  selectedCast = null,
  onSelectCast,
  showAnalytics = true,
  className = "",
}) {
  const postureTitle = selectedCast?.engagement?.title || "Path Seeker";
  const postureTone = selectedCast?.engagement?.tone
    ? ` · ${selectedCast.engagement.tone}`
    : "";
  const dailyFocus = selectedCast?.metadata?.dailyFocus || "";
  const generationLabel = formatGenerationSource(selectedCast);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
          Access
        </div>
        <div className="mt-2 text-lg font-semibold text-white">
          {capabilities?.isPremium ? "Premium" : "Free"}
        </div>
        <div className="mt-2 text-sm leading-6 text-white/75">
          Free users can view today’s cast and the most recent{" "}
          {capabilities?.historyLimit ?? 3} saved cards.
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
            Cast Source
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/80">
            {dailyFocus ? "Focused" : "Default"}
          </div>
        </div>

        <div className="mt-3 text-sm leading-6 text-white/80">
          {generationLabel}
        </div>

        {dailyFocus ? (
          <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/10 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/75">
              Active Focus
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cyan-50/90">
              {dailyFocus}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-white/55">
            No explicit focus set for today.
          </div>
        )}
      </div>

      <RecentDailyCasts
        casts={recentCasts}
        historyLimit={capabilities?.historyLimit ?? 3}
        canViewFullHistory={Boolean(capabilities?.canViewFullHistory)}
        onSelectCast={onSelectCast}
      />

      {showAnalytics ? (
        <DailyAnalyticsPanel dateKey={selectedCast?.dateKey} />
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
          Today’s Posture
        </div>
        <div className="mt-2 text-sm leading-6 text-white/75">
          {postureTitle}
          {postureTone}
        </div>
        <div className="mt-3 text-sm text-white/60">
          This stays subtle. It shapes how the cast speaks without turning the
          user into a label.
        </div>
      </div>
    </div>
  );
}