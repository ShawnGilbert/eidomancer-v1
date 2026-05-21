// D:\EidomancerProject\eidomancer-app\src\pages\DailyPage.jsx

import { useEffect, useMemo, useState } from "react";
import ArtifactViewer from "../components/artifact/ArtifactViewer";
import { GeneratedOutputsPanel } from "../components/GeneratedOutputsPanel";
import { PackageActionsPanel } from "../components/PackageActionsPanel";
import SavedArtifactsPanel from "../components/artifact/SavedArtifactsPanel";
import DailyCastCard from "../components/daily/DailyCastCard";
import DailyCoreCardPreview from "../components/daily/DailyCoreCardPreview";
import DailyFocusInput from "../components/daily/DailyFocusInput";
import DailySidebar from "../components/daily/DailySidebar";
import { castToArtifact } from "../lib/artifactAdapter";
import {
  clearSavedArtifactPackageOutputs,
  getArtifactPackageOutputs,
  getArtifactSourceCast,
  saveArtifact,
  updateSavedArtifact,
} from "../lib/artifactStorage";
import { getAccessTier, getFreemiumCapabilities } from "../lib/freemiumGate";
import {
  generateEcho,
  generateSongPackage,
  generateYouTubePackage,
} from "../lib/packageGenerators";
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
  const [generatedOutputs, setGeneratedOutputs] = useState({});
  const [isGeneratingOutput, setIsGeneratingOutput] = useState(false);
  const [packageStatusMessage, setPackageStatusMessage] = useState("");

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

  function handleSelectSavedArtifact(artifact) {
    if (!artifact) return;

    setManualArtifact(artifact);
    setGeneratedOutputs(getArtifactPackageOutputs(artifact));

    const sourceCast = getArtifactSourceCast(artifact);

    if (sourceCast) {
      handleSelectRecentCast(sourceCast);
    }
  }

  async function handleSubmitFocus(nextFocus) {
    setManualArtifact(null);
    await submitFocus(nextFocus);
  }

  async function handleClearFocus() {
    setManualArtifact(null);
    await clearFocus();
  }

  function handleSelectSidebarCast(cast) {
    setManualArtifact(null);
    handleSelectRecentCast(cast);
  }

  function handleGenerateOutput(type) {
    const activeRecord = getArtifactSourceCast(activeArtifact) || selectedCast || activeArtifact;

    if (!activeRecord) return;

    setIsGeneratingOutput(true);
    const existingOutputs = {
      ...getArtifactPackageOutputs(activeArtifact),
      ...generatedOutputs,
    };
    const fullPackageOutputs =
      type === "fullPackage"
        ? (() => {
            const echo = generateEcho(activeRecord);
            const song = generateSongPackage(activeRecord);
            const youtube = generateYouTubePackage({
              ...activeRecord,
              packageOutputs: {
                ...existingOutputs,
                echo,
                song,
              },
            });

            return { echo, song, youtube };
          })()
        : null;
    const nextOutput =
      fullPackageOutputs
        ? fullPackageOutputs
        : type === "youtube"
        ? generateYouTubePackage({
            ...activeRecord,
            packageOutputs: {
              ...existingOutputs,
            },
          })
        : type === "song"
        ? generateSongPackage(activeRecord)
        : type === "echo"
        ? generateEcho(activeRecord)
        : null;

    if (!nextOutput) {
      setIsGeneratingOutput(false);
      return;
    }
    const successMessages = {
      echo: "Echo Prompt created",
      song: "Song Package created",
      youtube: "YouTube Package created",
      fullPackage: "Full Package created",
    };

    const packageOutputs = {
      ...existingOutputs,
      ...(fullPackageOutputs || { [type]: nextOutput }),
    };
    const updatedArtifact = {
      ...activeArtifact,
      packageOutputs,
      ...(packageOutputs.echo ? { echoPrompt: packageOutputs.echo.prompt } : {}),
    };

    setGeneratedOutputs((outputs) => ({
      ...outputs,
      ...(fullPackageOutputs || { [type]: nextOutput }),
    }));

    const { artifact } = updateSavedArtifact(activeArtifact, {
      packageOutputs,
      ...(packageOutputs.echo ? { echoPrompt: packageOutputs.echo.prompt } : {}),
    });

    if (artifact) {
      if (isViewingSaved) {
        setManualArtifact(artifact);
      }
      setSavedRefreshKey((value) => value + 1);
    } else if (isViewingSaved) {
      setManualArtifact(updatedArtifact);
    }

    setPackageStatusMessage(successMessages[type] || "Package output created");
    setIsGeneratingOutput(false);
  }

  function handleClearGeneratedOutputs() {
    setGeneratedOutputs({});
    setPackageStatusMessage("Generated outputs cleared");

    const { artifact } = clearSavedArtifactPackageOutputs(activeArtifact);

    if (artifact) {
      if (isViewingSaved) {
        setManualArtifact(artifact);
      }

      setSavedRefreshKey((value) => value + 1);
    }
  }

  useEffect(() => {
    if (!selectedArtifact || !selectedCast) return;

    const { saved } = saveArtifact(selectedArtifact, {
      source: "daily",
      sourceCast: selectedCast,
    });

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
  const activeOutputRecord = getArtifactSourceCast(activeArtifact) || selectedCast || activeArtifact;
  const activeOutputCast = activeOutputRecord
    ? {
        ...activeOutputRecord,
        assets: {
          ...((activeOutputRecord && activeOutputRecord.assets) || {}),
          ...generatedOutputs,
        },
      }
    : null;

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

  useEffect(() => {
    setGeneratedOutputs(getArtifactPackageOutputs(activeArtifact));
  }, [activeArtifact?.id, activeArtifact?.savedAt]);

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
            onSubmit={handleSubmitFocus}
            onClear={handleClearFocus}
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
                onSelectArtifact={handleSelectSavedArtifact}
              />
            </div>

            <PackageActionsPanel
              availableActions={[
                ["echo", "Create Echo Prompt"],
                ["song", "Create Song Package"],
                ["youtube", "Create YouTube Package"],
                ["fullPackage", "Create Full Package"],
              ]}
              onGenerate={handleGenerateOutput}
              isGeneratingAsset={isGeneratingOutput}
              statusMessage={packageStatusMessage}
            />

            <GeneratedOutputsPanel
              activeCast={activeOutputCast}
              generatedOnly
              onClearOutputs={handleClearGeneratedOutputs}
            />
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
            onSelectCast={handleSelectSidebarCast}
            showLens={false}
          />
        )}
      </div>
    </div>
  );
}
