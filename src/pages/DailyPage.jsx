// D:\EidomancerProject\eidomancer-app\src\pages\DailyPage.jsx

import { useEffect, useMemo, useState } from "react";
import ArtifactViewer from "../components/artifact/ArtifactViewer";
import SavedArtifactsPanel from "../components/artifact/SavedArtifactsPanel";
import DailyCastCard from "../components/daily/DailyCastCard";
import DailyCoreCardPreview from "../components/daily/DailyCoreCardPreview";
import DailyFocusInput from "../components/daily/DailyFocusInput";
import DailySidebar from "../components/daily/DailySidebar";
import { castToArtifact } from "../lib/artifactAdapter";
import { saveArtifact } from "../lib/artifactStorage";
import { getAccessTier, getFreemiumCapabilities } from "../lib/freemiumGate";
import { getThemePalette } from "../lib/themePalettes";
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
  const palette = getThemePalette("emergent").daily;

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
    <div className={palette.shell}>
      <div className={palette.container}>
        {/* Header */}
        <div className={palette.header}>
          <div className="flex items-center justify-between gap-4">
            <div className={palette.headerEyebrow}>
              Eidomancer Daily
            </div>

            <div
              className={`${palette.statusBadgeBase} ${
                palette.statusBadges[aiStatus] || palette.statusBadges.fallback
              }`}
            >
              {aiStatus === "connected" && "AI Connected"}
              {aiStatus === "connecting" && "Connecting..."}
              {aiStatus === "fallback" && "Local Fallback"}
            </div>
          </div>

          <h1 className={palette.headerTitle}>
            A daily symbolic reading that evolves with you.
          </h1>

          <p className={palette.headerCopy}>
            One cast for today. Recent continuity. Fast enough to use daily.
            Deep enough to feel like it remembers you.
          </p>
        </div>

        {/* Top Interaction Row */}
        <div className={palette.topInteractionGrid}>
          <DailyFocusInput
            initialValue={focusValue}
            resetKey={inputResetKey}
            appliedFocus={appliedFocus}
            onSubmit={submitFocus}
            onClear={clearFocus}
            isLoading={isLoading}
          />

          <DailyCoreCardPreview cast={selectedCast} />
        </div>

        {/* Loading */}
        {status === "loading" && !selectedCast && (
          <div className={palette.loading}>
            Generating today’s cast…
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className={palette.error}>
            {error || "Something went wrong."}
          </div>
        )}

        {/* Artifact + Saved */}
        {activeArtifact && (
          <div className={`${palette.sectionBlock} space-y-4`}>
            {isViewingSaved && (
              <div className={palette.savedBanner}>
                <div className={palette.savedBannerText}>
                  Viewing saved artifact
                </div>

                <button
                  onClick={() => setManualArtifact(null)}
                  className={palette.savedBannerButton}
                >
                  Back to Today
                </button>
              </div>
            )}

            <div className={palette.artifactGrid}>
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

        {/* Daily Cast Details */}
        {(status === "ready" || selectedCast) && selectedCast && (
          <div className={palette.sectionBlock}>
            <DailyCastCard
              cast={selectedCast}
              onShare={handleShare}
              shareMessage={shareMessage}
            />
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
