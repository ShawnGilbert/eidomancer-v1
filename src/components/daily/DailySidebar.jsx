// D:\eidomancer\src\components\daily\DailySidebar.jsx

import RecentDailyCasts from "./RecentDailyCasts";
import DailyAnalyticsPanel from "./DailyAnalyticsPanel";

function formatGenerationSource(selectedCast) {
  const reason = selectedCast?.metadata?.generationReason || "";
  const dailyFocus = selectedCast?.metadata?.dailyFocus || "";

  if (reason === "focus_submitted" && dailyFocus) {
    return "This cast was shaped by the focus you submitted.";
  }

  if (reason === "focus_cleared") {
    return "This cast was regenerated after your focus was cleared.";
  }

  if (dailyFocus) {
    return "This cast is being guided by an active focus.";
  }

  return "This is today’s default cast.";
}

function SidebarPanel({ label, children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`.trim()}>
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
        {label}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
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
  const isPremium = Boolean(capabilities?.isPremium);
  const historyLimit = capabilities?.historyLimit ?? 3;

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      <SidebarPanel label="Membership">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold text-white">
            {isPremium ? "Premium" : "Free"}
          </div>
          <div
            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
              isPremium
                ? "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200/80"
                : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            {isPremium ? "Expanded" : "Standard"}
          </div>
        </div>

        <div className="mt-3 text-sm leading-6 text-white/75">
          {isPremium
            ? "Premium users can explore a deeper reading history and expanded continuity."
            : `Free users can view today’s cast and the most recent ${historyLimit} saved cards.`}
        </div>
      </SidebarPanel>

      <SidebarPanel label="Today’s Lens">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm leading-6 text-white/80">{generationLabel}</div>
          <div
            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
              dailyFocus
                ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200/80"
                : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            {dailyFocus ? "Focused" : "Open"}
          </div>
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
          <div className="mt-3 text-sm leading-6 text-white/55">
            No explicit focus is shaping today’s cast yet.
          </div>
        )}
      </SidebarPanel>

      <RecentDailyCasts
        casts={recentCasts}
        historyLimit={historyLimit}
        canViewFullHistory={Boolean(capabilities?.canViewFullHistory)}
        onSelectCast={onSelectCast}
      />

      <SidebarPanel label="Today’s Posture">
        <div className="text-sm leading-6 text-white/75">
          <span className="text-white">{postureTitle}</span>
          {postureTone}
        </div>
        <div className="mt-3 text-sm leading-6 text-white/60">
          This stays subtle. It influences the tone of the reading without reducing you to a fixed label.
        </div>
      </SidebarPanel>

      {showAnalytics ? (
        <div className="opacity-80">
          <DailyAnalyticsPanel dateKey={selectedCast?.dateKey} />
        </div>
      ) : null}
    </div>
  );
}