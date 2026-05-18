// D:\eidomancer\src\pages\DailyPage.jsx

import { useMemo } from "react";
import DailyCastCard from "../components/daily/DailyCastCard";
import DailyFocusInput from "../components/daily/DailyFocusInput";
import DailySidebar from "../components/daily/DailySidebar";
import { getAccessTier, getFreemiumCapabilities } from "../lib/freemiumGate";
import useDailyCast from "../hooks/useDailyCast";

function StatusBadge({ aiStatus }) {
  return (
    <div
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        aiStatus === "connected"
          ? "border-green-400/30 bg-green-500/15 text-green-300"
          : aiStatus === "connecting"
          ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-300"
          : "border-red-400/30 bg-red-500/15 text-red-300"
      }`}
    >
      {aiStatus === "connected" && "AI Connected"}
      {aiStatus === "connecting" && "Connecting..."}
      {aiStatus === "offline" && "AI Offline"}
    </div>
  );
}

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

  const appliedFocus = selectedCast?.metadata?.dailyFocus || selectedCast?.question || "";

  let aiStatus = "connected";

  if (isLoading) {
    aiStatus = "connecting";
  } else if (selectedCast?.mode === "no-ai") {
    aiStatus = "offline";
  }

  const hasCast = (status === "ready" || selectedCast) && selectedCast;

  return (
    <div className="min-h-screen bg-[#071019] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-violet-500/10 p-6 shadow-2xl shadow-cyan-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/75">
                Eidomancer Daily
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                A daily symbolic reading that evolves with you.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                One cast for today. Recent continuity. Fast enough to use daily.
                Deep enough to feel like it remembers you.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  One question
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  One structured cast
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  Real reflection
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-start">
              <StatusBadge aiStatus={aiStatus} />
            </div>
          </div>
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

        {hasCast ? (
          <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">
                  Cast Chamber
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                  Read the cast first. Then refine it with a focus if you want a
                  more directed reading.
                </p>
              </div>

              <DailyCastCard
                cast={selectedCast}
                onShare={handleShare}
                shareMessage={shareMessage}
              />
            </div>

            <div className="space-y-6 xl:sticky xl:top-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-cyan-200/70">
                  Refine Today’s Cast
                </div>

                <DailyFocusInput
                  initialValue={focusValue}
                  resetKey={inputResetKey}
                  appliedFocus={appliedFocus}
                  onSubmit={submitFocus}
                  onClear={clearFocus}
                  isLoading={isLoading}
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-xl">
                <DailySidebar
                  capabilities={capabilities}
                  recentCasts={recentCasts}
                  selectedCast={selectedCast}
                  onSelectCast={handleSelectRecentCast}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}