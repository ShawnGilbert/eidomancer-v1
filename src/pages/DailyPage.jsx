// D:\EidomancerProject\eidomancer-app\src\pages\DailyPage.jsx

import { useEffect, useMemo, useState } from "react";
import ArtifactViewer from "../components/artifact/ArtifactViewer";
import SavedArtifactsPanel from "../components/artifact/SavedArtifactsPanel";
import DailyCastCard from "../components/daily/DailyCastCard";
import DailyFocusInput from "../components/daily/DailyFocusInput";
import DailySidebar from "../components/daily/DailySidebar";
import { castToArtifact } from "../lib/artifactAdapter";
import { saveArtifact } from "../lib/artifactStorage";
import { getAccessTier, getFreemiumCapabilities } from "../lib/freemiumGate";
import useDailyCast from "../hooks/useDailyCast";


/* ---------- COMPONENT ---------- */

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

  const [manualArtifact, setManualArtifact] = useState(null);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);

  const accessTier = useMemo(() => getAccessTier(null), []);
  const capabilities = useMemo(
    () => getFreemiumCapabilities(accessTier, 0),
    [accessTier]
  );

  const selectedArtifact = useMemo(
    () => castToArtifact(selectedCast),
    [selectedCast]
  );

  useEffect(() => {
    if (!selectedArtifact || !selectedCast) return;

    const { saved } = saveArtifact(selectedArtifact, { source: "daily" });

    if (saved) {
      setSavedRefreshKey((value) => value + 1);
    }
  }, [selectedArtifact, selectedCast]);

  useEffect(() => {
    if (!selectedCast || !import.meta.env.DEV) return;

    const metadata = selectedCast.metadata || {};

    console.info("[Eidomancer] Daily cast AI debug", {
      castId: selectedCast.id || null,
      dateKey: selectedCast.dateKey || metadata.dateKey || null,
      mode: selectedCast.mode || "ai",
      aiRequestSucceeded: Boolean(metadata.aiRequestSucceeded),
      aiResponseReceived: Boolean(metadata.aiResponseReceived),
      aiResponseLength: metadata.aiResponseLength || 0,
      aiResponseUsed: Boolean(metadata.aiResponseUsed),
      usedFallback: Boolean(
        selectedCast.mode === "no-ai" || metadata.usedFallback
      ),
      fallbackReason: metadata.fallbackReason || "",
    });
  }, [selectedCast]);

  const activeArtifact = manualArtifact || selectedArtifact;
  const isViewingSaved = !!manualArtifact;

  const isLoading = status === "loading";

  const appliedFocus =
    selectedCast?.metadata?.dailyFocus || selectedCast?.question || "";

  const usedFallback =
    selectedCast?.mode === "no-ai" ||
    selectedCast?.metadata?.usedFallback ||
    selectedCast?.metadata?.aiSource === "deterministic-fallback";

  let aiStatus = "connected";

  if (isLoading) {
    aiStatus = "connecting";
  } else if (usedFallback) {
    aiStatus = "fallback";
  }

  return (
    <div className="min-h-screen bg-[#071019] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
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
              {aiStatus === "fallback" && "Local Fallback"}
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

        {/* Generate Daily Cast */}
        <div className="mb-8">
          <DailyFocusInput
            initialValue={focusValue}
            resetKey={inputResetKey}
            appliedFocus={appliedFocus}
            onSubmit={submitFocus}
            onClear={clearFocus}
            isLoading={isLoading}
          />
        </div>

        {/* Loading */}
        {status === "loading" && !selectedCast && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/75">
            Generating today’s cast…
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center text-red-100">
            {error || "Something went wrong."}
          </div>
        )}

        {/* Daily Cast */}
        {(status === "ready" || selectedCast) && selectedCast && (
          <div className="mb-8">
            <DailyCastCard
              cast={selectedCast}
              onShare={handleShare}
              shareMessage={shareMessage}
            />
          </div>
        )}

        {/* Artifact + Saved */}
        {activeArtifact && (
          <div className="mb-8 space-y-4">
            {isViewingSaved && (
              <div className="flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                <div className="text-sm text-amber-200">
                  Viewing saved artifact
                </div>

                <button
                  onClick={() => setManualArtifact(null)}
                  className="rounded-lg bg-amber-400/20 px-3 py-1 text-sm font-medium text-amber-100 hover:bg-amber-400/30"
                >
                  Back to Today
                </button>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <ArtifactViewer artifact={activeArtifact} />

              <SavedArtifactsPanel
                key={savedRefreshKey}
                activeArtifact={activeArtifact}
                onSelectArtifact={(artifact) => {
                  setManualArtifact(artifact);
                }}
              />
            </div>
          </div>
        )}

        {/* History + Supporting Panels */}
        {(status === "ready" || selectedCast) && selectedCast && (
          <DailySidebar
            capabilities={capabilities}
            recentCasts={recentCasts}
            selectedCast={selectedCast}
            onSelectCast={handleSelectRecentCast}
            showLens={false}
          />
        )}
      </div>
    </div>
  );
}
