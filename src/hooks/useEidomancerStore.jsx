import { useEffect, useMemo, useState } from "react";
import { generateCast, formatCastAsText } from "../lib/castEngine";
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

function createId() {
  return `cast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCastRecord(question, castResult) {
  const safeCast =
    castResult && typeof castResult === "object"
      ? castResult
      : {
          title: "Untitled Cast",
          subtitle: "",
          coreCard: null,
          mode: "fallback",
          sourceType: "question",
          questionType: "general",
          poemShape: "free_verse",
          seed: "",
          sections: [],
        };

  const sections = Array.isArray(safeCast.sections) ? safeCast.sections : [];

  const safeCoreCard =
    safeCast.coreCard && typeof safeCast.coreCard === "object"
      ? {
          title:
            typeof safeCast.coreCard.title === "string"
              ? safeCast.coreCard.title.trim()
              : "",
          subtitle:
            typeof safeCast.coreCard.subtitle === "string"
              ? safeCast.coreCard.subtitle.trim()
              : "",
          hook:
            typeof safeCast.coreCard.hook === "string"
              ? safeCast.coreCard.hook.trim()
              : "",
        }
      : null;

  const fallbackTitle =
    (typeof safeCast.title === "string" && safeCast.title.trim()) ||
    safeCoreCard?.title ||
    "Untitled Cast";

  const fallbackSubtitle =
    (typeof safeCast.subtitle === "string" && safeCast.subtitle.trim()) ||
    safeCoreCard?.subtitle ||
    "";

  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    question,
    input: question,
    theme: "The Emergent Ones",
    title: fallbackTitle,
    subtitle: fallbackSubtitle,
    coreCard: safeCoreCard,
    mode: safeCast.mode || "fallback",
    sourceType: safeCast.sourceType || "question",
    questionType: safeCast.questionType || "general",
    poemShape: safeCast.poemShape || "free_verse",
    seed: safeCast.seed || "",
    sections,
    castText: formatCastAsText(safeCast),
    readingText: formatCastAsText(safeCast),
    assets: {},
    type: "eidomancer_cast",
  };
}

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

  const [aiStatus, setAiStatus] = useState("checking");
  const [aiMessage, setAiMessage] = useState("Checking the Ruliad...");

  useEffect(() => {
    saveCasts(recentCasts);
  }, [recentCasts]);

  const activeCast = useMemo(() => {
    return recentCasts.find((item) => item.id === activeCastId) ?? null;
  }, [recentCasts, activeCastId]);

  const aiConnected = aiStatus === "connected";

  async function refreshAIStatus() {
    try {
      setAiStatus("checking");
      setAiMessage("Checking the Ruliad...");

      const response = await fetch("/api/ai/status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.reason || "Failed to check AI connection.");
      }

      if (data?.connected) {
        setAiStatus("connected");
        setAiMessage("Connected to the Ruliad");
      } else {
        setAiStatus("disconnected");
        setAiMessage(data?.reason || "AI connection is unavailable.");
      }
    } catch (err) {
      setAiStatus("error");
      setAiMessage(err?.message || "AI connection check failed.");
    }
  }

  useEffect(() => {
    refreshAIStatus();
  }, []);

  async function castQuestion() {
    const trimmed = question.trim();
    if (!trimmed) return;

    if (!aiConnected) {
      setError(
        aiStatus === "checking"
          ? "The Ruliad is still being checked. Try again in a moment."
          : aiMessage || "The Ruliad is silent. No cast can form."
      );
      return;
    }

    try {
      setError(null);
      setIsCasting(true);

      const castResult = await generateCast(trimmed);
      const record = normalizeCastRecord(trimmed, castResult);

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
    aiStatus,
    aiMessage,
    aiConnected,
    refreshAIStatus,
    castQuestion,
    generateAsset,
    generateAllAssets,
    loadCast,
    clearQuestion,
  };
}