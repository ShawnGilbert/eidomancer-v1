// D:\eidomancer\src\pages\DailyPage.jsx

import { useMemo } from "react";
import DailyCastCard from "../components/daily/DailyCastCard";
import DailyFocusInput from "../components/daily/DailyFocusInput";
import DailySidebar from "../components/daily/DailySidebar";
import { getAccessTier, getFreemiumCapabilities } from "../lib/freemiumGate";
import useDailyCast from "../hooks/useDailyCast";

export default function DailyPage() {
  const {
    selectedCast,
    recentCasts,
    status,
    error,
    shareMessage,
    focusValue,
    inputResetKey,
    handleShare,
    handleSelectRecentCast,
    submitFocus,
    clearFocus,
  } = useDailyCast();

  const accessTier = useMemo(() => getAccessTier(null), []);
  const capabilities = useMemo(
    () => getFreemiumCapabilities(accessTier, 0),
    [accessTier]
  );

  const isLoading = status === "loading";

  const appliedFocus =
    selectedCast?.metadata?.dailyFocus ||
    selectedCast?.question ||
    "";

  let aiStatus = "connected";

  if (isLoading) {
    aiStatus = "connecting";
  } else if (selectedCast?.mode === "no-ai") {
    aiStatus = "offline";
  }

  return (
    <div className="min-h-screen bg-[#071019] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-2xl shadow-cyan-900/20">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/75">
              Eidomancer Daily
            </div>

            <div
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                aiStatus === "connected"
                  ? "border-green-400/30 bg-green-500/15 text-green-300"
                  : aiStatus === "connecting"
  ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-300 animate-pulse"
                  : "border-red-400/30 bg-red-500/15 text-red-300"
              }`}
            >
              {aiStatus === "connected" && "AI Connected"}
              {aiStatus === "connecting" && "Connecting..."}
              {aiStatus === "offline" && "AI Offline"}
            </div>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A daily symbolic reading that evolves with you.
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">
            One cast for today. Recent continuity. Fast enough to use daily.
            Deep enough to feel like it remembers you.
          </p>
        </div>

        {status === "loading" && !selectedCast ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/75">
            Generating today’s cast…
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center text-red-100">
            {error || "Something went wrong."}
          </div>
        ) : null}

        {(status === "ready" || selectedCast) && selectedCast ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <DailyCastCard
              cast={selectedCast}
              onShare={handleShare}
              shareMessage={shareMessage}
            />

            <div className="space-y-6">
              <DailyFocusInput
                initialValue={focusValue}
                resetKey={inputResetKey}
                appliedFocus={appliedFocus}
                onSubmit={submitFocus}
                onClear={clearFocus}
                isLoading={isLoading}
              />

              <DailySidebar
                capabilities={capabilities}
                recentCasts={recentCasts}
                selectedCast={selectedCast}
                onSelectCast={handleSelectRecentCast}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}