// D:\eidomancer\src\components\daily\DailyAnalyticsPanel.jsx

import { useMemo } from "react";
import {
  getAnalyticsEvents,
  getDailyAnalyticsSummary,
} from "../../lib/localAnalytics";
import { getDateKey } from "../../lib/dailyCast";

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-sm text-white/70">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function EventRow({ event }) {
  const timestamp = event?.timestamp
    ? new Date(event.timestamp).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "--:--";

  const payload = event?.payload && typeof event.payload === "object" ? event.payload : {};
  const source = payload.source ? ` · ${payload.source}` : "";
  const focus = payload.focusApplied ? " · focused" : "";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/75">
          {event?.name || "event"}
          {source}
          {focus}
        </div>
        <div className="text-xs text-white/45">{timestamp}</div>
      </div>

      {payload.generationReason ? (
        <div className="mt-2 text-sm text-white/65">
          Reason: {payload.generationReason}
        </div>
      ) : null}

      {payload.engagementMode ? (
        <div className="mt-1 text-sm text-white/55">
          Engagement: {payload.engagementMode}
        </div>
      ) : null}
    </div>
  );
}

export default function DailyAnalyticsPanel({
  dateKey,
  maxEvents = 8,
  className = "",
}) {
  const activeDateKey = dateKey || getDateKey();

  const { summary, recentEvents } = useMemo(() => {
    const allEvents = getAnalyticsEvents();
    const filtered = allEvents
      .filter((event) => event?.dateKey === activeDateKey)
      .sort((a, b) => {
        const aTime = Date.parse(a?.timestamp || "") || 0;
        const bTime = Date.parse(b?.timestamp || "") || 0;
        return bTime - aTime;
      });

    return {
      summary: getDailyAnalyticsSummary(activeDateKey),
      recentEvents: filtered.slice(0, maxEvents),
    };
  }, [activeDateKey, maxEvents]);

  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
            Daily Analytics
          </div>
          <div className="mt-2 text-sm text-white/60">
            Local-only product signals for {activeDateKey}
          </div>
        </div>

        <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/80">
          Local
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <StatRow label="Events" value={summary.totalEvents} />
        <StatRow label="Casts generated" value={summary.dailyCastGenerated} />
        <StatRow label="Casts viewed" value={summary.dailyCastViewed} />
        <StatRow label="Shares clicked" value={summary.shareClicked} />
        <StatRow label="History opened" value={summary.historyOpened} />
        <StatRow label="Returned same day" value={summary.returnedSameDay} />
        <StatRow label="Returned next day" value={summary.returnedNextDay} />
      </div>

      <div className="mt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
          Recent Events
        </div>

        <div className="mt-3 space-y-3">
          {recentEvents.length > 0 ? (
            recentEvents.map((event) => (
              <EventRow key={event.id || `${event.name}-${event.timestamp}`} event={event} />
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
              No analytics events recorded for today yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}