// D:\eidomancer\src\hooks\useDailyCast.js

import { useEffect, useState } from "react";
import { generateDailyCast, getDateKey } from "../lib/dailyCast";
import {
  getTodayDailyCast,
  getRecentDailyCasts,
  saveDailyCast,
} from "../lib/dailyCastStorage";
import { buildClipboardPayload } from "../lib/shareText";
import {
  clearDailyFocus,
  getDailyFocus,
  pruneDailyFocusEntries,
  saveDailyFocus,
} from "../lib/dailyFocusStorage";
import { detectReturnEvent, logEvent } from "../lib/localAnalytics";

export default function useDailyCast() {
  const [selectedCast, setSelectedCast] = useState(null);
  const [recentCasts, setRecentCasts] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [focusValue, setFocusValue] = useState("");
  const [inputResetKey, setInputResetKey] = useState(0);

  useEffect(() => {
    detectReturnEvent();
    pruneDailyFocusEntries(30);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDailyCast() {
      setStatus("loading");
      setError("");

      try {
        const dateKey = getDateKey();
        const savedFocus = getDailyFocus(dateKey);
        const stored = getTodayDailyCast(dateKey);

        const storedMatchesFocus =
          stored &&
          (stored?.metadata?.dailyFocus || "").trim() === savedFocus.trim();

        if (stored && storedMatchesFocus) {
          if (!cancelled) {
            setSelectedCast(stored);
            setRecentCasts(getRecentDailyCasts(7));
            setStatus("ready");
          }

          logEvent("daily_cast_viewed", {
            source: "storage",
            dateKey,
            castId: stored?.id || null,
            castType: stored?.castType || "daily",
            engagementMode:
              stored?.metadata?.engagementMode ||
              stored?.engagement?.mode ||
              null,
            focusApplied: Boolean(savedFocus),
          });

          // Do not return; allow background refresh.
        }

        const history = getRecentDailyCasts(7);

        const generated = await generateDailyCast({
          question: savedFocus,
          sourceText: "",
          userContext: "",
          history,
          profile: {
            theme: "The Emergent Ones",
          },
        });

        const castWithFocus = {
          ...generated,
          metadata: {
            ...(generated?.metadata || {}),
            dailyFocus: savedFocus,
          },
        };

        saveDailyCast(castWithFocus);

        logEvent("daily_cast_generated", {
          dateKey: castWithFocus?.dateKey || dateKey,
          castId: castWithFocus?.id || null,
          castType: castWithFocus?.castType || "daily",
          engagementMode:
            castWithFocus?.metadata?.engagementMode ||
            castWithFocus?.engagement?.mode ||
            null,
          continuityCount:
            castWithFocus?.metadata?.continuityCount || history.length || 0,
          focusApplied: Boolean(savedFocus),
        });

        logEvent("daily_cast_viewed", {
          source: stored ? "regenerated" : "generated",
          dateKey: castWithFocus?.dateKey || dateKey,
          castId: castWithFocus?.id || null,
          castType: castWithFocus?.castType || "daily",
          engagementMode:
            castWithFocus?.metadata?.engagementMode ||
            castWithFocus?.engagement?.mode ||
            null,
          focusApplied: Boolean(savedFocus),
        });

        if (!cancelled) {
          setSelectedCast(castWithFocus);
          setRecentCasts(getRecentDailyCasts(7));
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load daily cast.");
          setStatus("error");
        }
      }
    }

    loadDailyCast();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCast || selectedCast.mode !== "no-ai") {
      return;
    }

    let cancelled = false;
    let retryTimer = null;

    async function retryCast() {
      const dateKey = getDateKey();
      const savedFocus = getDailyFocus(dateKey);

      try {
        const history = getRecentDailyCasts(7).filter(
          (cast) => cast?.dateKey !== dateKey
        );

        const generated = await generateDailyCast({
          question: savedFocus,
          sourceText: "",
          userContext: "",
          history,
          profile: {
            theme: "The Emergent Ones",
          },
        });

        if (generated?.mode === "no-ai") {
          if (!cancelled) {
            retryTimer = window.setTimeout(retryCast, 3000);
          }
          return;
        }

        const castWithFocus = {
          ...generated,
          metadata: {
            ...(generated?.metadata || {}),
            dailyFocus: savedFocus,
          },
        };

        saveDailyCast(castWithFocus);

        logEvent("daily_cast_generated", {
          dateKey: castWithFocus?.dateKey || dateKey,
          castId: castWithFocus?.id || null,
          castType: castWithFocus?.castType || "daily",
          engagementMode:
            castWithFocus?.metadata?.engagementMode ||
            castWithFocus?.engagement?.mode ||
            null,
          continuityCount:
            castWithFocus?.metadata?.continuityCount || history.length || 0,
          focusApplied: Boolean(savedFocus),
          generationReason: "auto_reconnect",
        });

        logEvent("daily_cast_viewed", {
          source: "auto_reconnect",
          dateKey: castWithFocus?.dateKey || dateKey,
          castId: castWithFocus?.id || null,
          castType: castWithFocus?.castType || "daily",
          engagementMode:
            castWithFocus?.metadata?.engagementMode ||
            castWithFocus?.engagement?.mode ||
            null,
          focusApplied: Boolean(savedFocus),
        });

        if (!cancelled) {
          setSelectedCast(castWithFocus);
          setRecentCasts(getRecentDailyCasts(7));
          setStatus("ready");
          setError("");
        }
      } catch {
        if (!cancelled) {
          retryTimer = window.setTimeout(retryCast, 3000);
        }
      }
    }

    retryTimer = window.setTimeout(retryCast, 2000);

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [selectedCast]);

  useEffect(() => {
    if (!shareMessage) return;

    const timer = window.setTimeout(() => {
      setShareMessage("");
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [shareMessage]);

  async function handleShare() {
    if (!selectedCast) return;

    try {
      const payload = buildClipboardPayload(selectedCast);
      const text = payload.preferredText || payload.fullText || "";

      if (!text) {
        setShareMessage("Nothing to copy yet.");
        return;
      }

      await navigator.clipboard.writeText(text);

      logEvent("share_clicked", {
        dateKey: selectedCast?.dateKey || getDateKey(),
        castId: selectedCast?.id || null,
        castType: selectedCast?.castType || "daily",
        engagementMode:
          selectedCast?.metadata?.engagementMode ||
          selectedCast?.engagement?.mode ||
          null,
        shareVariant: payload.preferredText ? "preferred" : "full",
        focusApplied: Boolean(selectedCast?.metadata?.dailyFocus),
      });

      setShareMessage("Copied to clipboard.");
    } catch {
      setShareMessage("Copy failed.");
    }
  }

  function handleSelectRecentCast(cast) {
    setSelectedCast(cast);

    logEvent("history_opened", {
      dateKey: cast?.dateKey || null,
      castId: cast?.id || null,
      castType: cast?.castType || "daily",
      engagementMode:
        cast?.metadata?.engagementMode || cast?.engagement?.mode || null,
      focusApplied: Boolean(cast?.metadata?.dailyFocus),
    });

    logEvent("daily_cast_viewed", {
      source: "history",
      dateKey: cast?.dateKey || null,
      castId: cast?.id || null,
      castType: cast?.castType || "daily",
      engagementMode:
        cast?.metadata?.engagementMode || cast?.engagement?.mode || null,
      focusApplied: Boolean(cast?.metadata?.dailyFocus),
    });
  }

  async function regenerateForFocus(nextFocus = "") {
    const dateKey = getDateKey();
    const normalizedFocus = String(nextFocus || "").trim();

    setStatus("loading");
    setError("");

    try {
      if (normalizedFocus) {
        saveDailyFocus(normalizedFocus, dateKey);
      } else {
        clearDailyFocus(dateKey);
      }

      const history = getRecentDailyCasts(7).filter(
        (cast) => cast?.dateKey !== dateKey
      );

      const generated = await generateDailyCast({
        question: normalizedFocus,
        sourceText: "",
        userContext: "",
        history,
        profile: {
          theme: "The Emergent Ones",
        },
      });

      const castWithFocus = {
        ...generated,
        metadata: {
          ...(generated?.metadata || {}),
          dailyFocus: normalizedFocus,
        },
      };

      saveDailyCast(castWithFocus);

      logEvent("daily_cast_generated", {
        dateKey,
        castId: castWithFocus?.id || null,
        castType: castWithFocus?.castType || "daily",
        engagementMode:
          castWithFocus?.metadata?.engagementMode ||
          castWithFocus?.engagement?.mode ||
          null,
        continuityCount:
          castWithFocus?.metadata?.continuityCount || history.length || 0,
        focusApplied: Boolean(normalizedFocus),
        generationReason: normalizedFocus ? "focus_submitted" : "focus_cleared",
      });

      logEvent("daily_cast_viewed", {
        source: normalizedFocus ? "focus_submitted" : "focus_cleared",
        dateKey,
        castId: castWithFocus?.id || null,
        castType: castWithFocus?.castType || "daily",
        engagementMode:
          castWithFocus?.metadata?.engagementMode ||
          castWithFocus?.engagement?.mode ||
          null,
        focusApplied: Boolean(normalizedFocus),
      });

      setSelectedCast(castWithFocus);
      setRecentCasts(getRecentDailyCasts(7));
      setStatus("ready");

      // Clear the draft box after a successful cast submit.
      setFocusValue("");
      setInputResetKey((key) => key + 1);
    } catch (err) {
      setError(err?.message || "Failed to regenerate daily cast.");
      setStatus("error");
    }
  }

  async function submitFocus(nextFocus) {
    await regenerateForFocus(nextFocus);

    logEvent("daily_focus_submitted", {
      dateKey: getDateKey(),
      focusLength: String(nextFocus || "").trim().length,
    });
  }

  async function clearFocusAndRegenerate() {
    await regenerateForFocus("");

    logEvent("daily_focus_cleared", {
      dateKey: getDateKey(),
    });
  }

  return {
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
    clearFocus: clearFocusAndRegenerate,
  };
}