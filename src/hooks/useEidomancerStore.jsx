import { useEffect, useMemo, useState } from "react";
import { runEidomancerCast } from "../pipeline";
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

function extractSection(text = "", startLabel, endLabel) {
  const startRegex = new RegExp(`^${startLabel}\\s*$`, "m");
  const startMatch = text.match(startRegex);
  if (!startMatch) return "";

  const contentStart = startMatch.index + startMatch[0].length;

  if (!endLabel) {
    return text.slice(contentStart).trim();
  }

  const endRegex = new RegExp(`^${endLabel}\\s*$`, "m");
  const endMatch = text.slice(contentStart).match(endRegex);

  if (!endMatch) {
    return text.slice(contentStart).trim();
  }

  const endIndex = contentStart + endMatch.index;
  return text.slice(contentStart, endIndex).trim();
}

function parseCastText(castText = "") {
  const titleRaw = extractSection(castText, "🃏 Card Title", "Signal");
  const signal = extractSection(castText, "Signal", "Tension");
  const tension = extractSection(castText, "Tension", "Pattern");
  const pattern = extractSection(castText, "Pattern", "🧠 Poem");
  const poem = extractSection(castText, "🧠 Poem", "⚡ Echo");
  const echo = extractSection(castText, "⚡ Echo", null);

  const cleanedTitle =
    titleRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => !line.startsWith("(")) || "Untitled Cast";

  return {
    title: cleanedTitle,
    signal: signal || "",
    tension: tension || "",
    pattern: pattern || "",
    poem: poem || "",
    echo: echo || "",
  };
}

function buildCastRecord(question, castResult) {
  const castText = castResult?.castText || "";
  const parsed = parseCastText(castText);

  const readingText = [
    parsed.signal && `Signal\n${parsed.signal}`,
    parsed.tension && `Tension\n${parsed.tension}`,
    parsed.pattern && `Pattern\n${parsed.pattern}`,
    parsed.poem && `Poem\n${parsed.poem}`,
    parsed.echo && `Echo\n${parsed.echo}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    question,
    theme: castResult?.theme || "The Emergent Ones",
    title: parsed.title,
    signal: parsed.signal,
    tension: parsed.tension,
    pattern: parsed.pattern,
    poem: parsed.poem,
    echo: parsed.echo,
    castText,
    readingText,
    assets: {},
    type: castResult?.type || "eidomancer_cast",
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

      const castResult = await runEidomancerCast({
        input: trimmed,
        theme: "The Emergent Ones",
      });

      if (castResult?.error) {
        throw new Error(castResult.error);
      }

      const record = buildCastRecord(trimmed, castResult);

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