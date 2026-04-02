import { useEffect, useMemo, useState } from "react";
import { buildCastRecord } from "../lib/castEngine";
import {
  generateCoreCard,
  generateEcho,
  generateFullPackage,
  generateLyrics,
  generateSuno,
  generateYouTubePackage,
} from "../lib/packageGenerators";
import { loadCasts, saveCasts } from "../lib/storage";

const assetGenerators = {
  coreCard: generateCoreCard,
  echo: generateEcho,
  lyrics: generateLyrics,
  suno: generateSuno,
  youtube: generateYouTubePackage,
  fullPackage: generateFullPackage,
};

export function useEidomancerStore() {
  const [question, setQuestion] = useState("");
  const [recentCasts, setRecentCasts] = useState(() => loadCasts());
  const [activeCastId, setActiveCastId] = useState(() => {
    const existing = loadCasts();
    return existing[0]?.id ?? null;
  });
  const [isCasting, setIsCasting] = useState(false);
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveCasts(recentCasts);
  }, [recentCasts]);

  const activeCast = useMemo(() => {
    return recentCasts.find((item) => item.id === activeCastId) ?? null;
  }, [recentCasts, activeCastId]);

  async function castQuestion() {
    const trimmed = question.trim();
    if (!trimmed) return;

    try {
      setError(null);
      setIsCasting(true);

      await new Promise((resolve) => setTimeout(resolve, 500));
      const record = buildCastRecord(trimmed);

      setRecentCasts((prev) => [record, ...prev].slice(0, 20));
      setActiveCastId(record.id);
      setQuestion("");
    } catch (err) {
      setError(err?.message || "Cast failed.");
    } finally {
      setIsCasting(false);
    }
  }

  async function generateAsset(type) {
    if (!activeCast) return;

    try {
      setError(null);
      setIsGeneratingAsset(true);

      await new Promise((resolve) => setTimeout(resolve, 250));

      const generator = assetGenerators[type];
      if (!generator) {
        throw new Error(`Unknown asset type: ${type}`);
      }

      const result = generator(activeCast);

      setRecentCasts((prev) =>
        prev.map((item) =>
          item.id === activeCast.id
            ? {
                ...item,
                assets: {
                  ...item.assets,
                  [type]: result,
                },
              }
            : item
        )
      );
    } catch (err) {
      setError(err?.message || "Asset generation failed.");
    } finally {
      setIsGeneratingAsset(false);
    }
  }

  async function generateAllAssets() {
    if (!activeCast) return;

    try {
      setError(null);
      setIsGeneratingAsset(true);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const nextAssets = Object.entries(assetGenerators).reduce(
        (acc, [key, generator]) => {
          acc[key] = generator(activeCast);
          return acc;
        },
        {}
      );

      setRecentCasts((prev) =>
        prev.map((item) =>
          item.id === activeCast.id
            ? {
                ...item,
                assets: {
                  ...item.assets,
                  ...nextAssets,
                },
              }
            : item
        )
      );
    } catch (err) {
      setError(err?.message || "Generate all failed.");
    } finally {
      setIsGeneratingAsset(false);
    }
  }

  function loadCast(id) {
    setActiveCastId(id);
  }

  function clearQuestion() {
    setQuestion("");
  }

  return {
    question,
    setQuestion,
    recentCasts,
    activeCast,
    isCasting,
    isGeneratingAsset,
    error,
    castQuestion,
    generateAsset,
    generateAllAssets,
    loadCast,
    clearQuestion,
  };
}