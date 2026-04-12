// D:\eidomancer\src\pages\DailyPage.jsx

import { useEffect, useMemo, useState } from "react";
import DailyCastCard from "../components/daily/DailyCastCard";
import DailySidebar from "../components/daily/DailySidebar";
import { generateDailyCast, getDateKey } from "../lib/dailyCast";
import {
  getTodayDailyCast,
  getRecentDailyCasts,
  saveDailyCast,
} from "../lib/dailyCastStorage";
import { buildClipboardPayload } from "../lib/shareText";
import { getAccessTier, getFreemiumCapabilities } from "../lib/freemiumGate";
import { detectReturnEvent, logEvent } from "../lib/localAnalytics";

export default function DailyPage() {
  const [selectedCast, setSelectedCast] = useState(null);
  const [recentCasts, setRecentCasts] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const accessTier = useMemo(() => getAccessTier(null), []);
  const capabilities = useMemo(
    () => getFreemiumCapabilities(accessTier, 0),
    [accessTier]
  );

  useEffect(() => {
    detectReturnEvent();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDailyCast() {
      setStatus("loading");
      setError("");

      try {
        const dateKey = getDateKey();
        const stored = getTodayDailyCast(dateKey);

        if (stored) {
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
              stored?.metadata?.engagementMode || stored?.engagement?.mode || null,
          });

          return;
        }

        const history = getRecentDailyCasts(7);
        const generated = await generateDailyCast({
          question: "",
          sourceText: "",
          userContext: "",
          history,
          profile: {
            theme: "The Emergent Ones",
          },
        });

        saveDailyCast(generated);

        logEvent("daily_cast_generated", {
          dateKey: generated?.dateKey || dateKey,
          castId: generated?.id || null,
          castType: generated?.castType || "daily",
          engagementMode:
            generated?.metadata?.engagementMode || generated?.engagement?.mode || null,
          continuityCount: generated?.metadata?.continuityCount || history.length || 0,
        });

        logEvent("daily_cast_viewed", {
          source: "generated",
          dateKey: generated?.dateKey || dateKey,
          castId: generated?.id || null,
          castType: generated?.castType || "daily",
          engagementMode:
            generated?.metadata?.engagementMode || generated?.engagement?.mode || null,
        });

        if (!cancelled) {
          setSelectedCast(generated);
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
    if (!shareMessage) return;

    const timer = window.setTimeout(() => {
      setShareMessage("");
    }, 2000);

    return () => window.clearTimeout(timer);
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
          selectedCast?.metadata?.engagementMode || selectedCast?.engagement?.mode || null,
        shareVariant: payload.preferredText ? "preferred" : "full",
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
      engagementMode: cast?.metadata?.engagementMode || cast?.engagement?.mode || null,
    });

    logEvent("daily_cast_viewed", {
      source: "history",
      dateKey: cast?.dateKey || null,
      castId: cast?.id || null,
      castType: cast?.castType || "daily",
      engagementMode: cast?.metadata?.engagementMode || cast?.engagement?.mode || null,
    });
  }

  return (
    <div className="min-h-screen bg-[#071019] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-2xl shadow-cyan-900/20">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/75">
            Eidomancer Daily
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A daily symbolic reading that evolves with you.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">
            One cast for today. Recent continuity. Fast enough to use daily.
            Deep enough to feel like it remembers you.
          </p>
        </div>

        {status === "loading" ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/75">
            Generating today’s cast…
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center text-red-100">
            {error || "Something went wrong."}
          </div>
        ) : null}

        {status === "ready" && selectedCast ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <DailyCastCard
              cast={selectedCast}
              onShare={handleShare}
              shareMessage={shareMessage}
            />

            <DailySidebar
              capabilities={capabilities}
              recentCasts={recentCasts}
              selectedCast={selectedCast}
              onSelectCast={handleSelectRecentCast}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}