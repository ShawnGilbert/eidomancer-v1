import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

const STORAGE_KEYS = {
  profile: "eidomancer_profile_v1",
  history: "eidomancer_history_v1",
};

const SHARE_PRESETS = {
  tiktok: { width: 1080, height: 1920, label: "TikTok 9:16" },
  facebook: { width: 1080, height: 1350, label: "Facebook 4:5" },
  square: { width: 1080, height: 1080, label: "Square 1:1" },
};

function parseCast(text = "") {
  const cleaned = text
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .trim();

  const extractSection = (labels) => {
    const labelPattern = labels
      .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    const regex = new RegExp(
      `(?:^|\\n)\\s*(?:\\d+[.)-]?\\s*)?(?:${labelPattern})\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\d+[.)-]?\\s*)?(?:CARD TITLE|TITLE|SNAPSHOT|FIELD READING|READING|TENSION|CONFLICT|ACTION|GUIDANCE)\\s*:|$)`,
      "i"
    );

    const match = cleaned.match(regex);
    return match ? match[1].trim() : "";
  };

  const rawTitle =
    extractSection(["CARD TITLE", "TITLE"]) ||
    cleaned.split("\n").find((line) => line.trim()) ||
    "The Unnamed Signal";

  const title = rawTitle
    .replace(/^(?:\d+[.)-]?\s*)?(?:CARD TITLE|TITLE)\s*:?\s*/i, "")
    .trim();

  return {
    title: title || "The Unnamed Signal",
    snapshot: extractSection(["SNAPSHOT"]),
    fieldReading: extractSection(["FIELD READING", "READING"]),
    tension: extractSection(["TENSION", "CONFLICT"]),
    action: extractSection(["ACTION", "GUIDANCE"]),
    raw: cleaned,
  };
}

function getCardPalette(title = "") {
  const t = title.toLowerCase();

  if (t.includes("storm") || t.includes("lightning")) {
    return {
      accent: "#67e8f9",
      accent2: "#a78bfa",
      glow: "rgba(103, 232, 249, 0.35)",
      border: "rgba(103, 232, 249, 0.35)",
      bg:
        "radial-gradient(circle at 30% 20%, rgba(103,232,249,0.20), transparent 30%), radial-gradient(circle at 70% 30%, rgba(167,139,250,0.20), transparent 30%), linear-gradient(160deg, #091224 0%, #0f1d3d 45%, #09111f 100%)",
      sigil: "✦",
    };
  }

  if (t.includes("mirror") || t.includes("echo")) {
    return {
      accent: "#c4b5fd",
      accent2: "#93c5fd",
      glow: "rgba(196, 181, 253, 0.35)",
      border: "rgba(196, 181, 253, 0.35)",
      bg:
        "radial-gradient(circle at 50% 18%, rgba(196,181,253,0.24), transparent 28%), radial-gradient(circle at 50% 75%, rgba(147,197,253,0.16), transparent 30%), linear-gradient(180deg, #130f24 0%, #17172f 48%, #0a1020 100%)",
      sigil: "◈",
    };
  }

  if (t.includes("paradox") || t.includes("progress")) {
    return {
      accent: "#22d3ee",
      accent2: "#8b5cf6",
      glow: "rgba(34, 211, 238, 0.35)",
      border: "rgba(34, 211, 238, 0.30)",
      bg:
        "radial-gradient(circle at 25% 18%, rgba(139,92,246,0.24), transparent 30%), radial-gradient(circle at 78% 22%, rgba(34,211,238,0.20), transparent 26%), linear-gradient(160deg, #0a1026 0%, #10183a 40%, #07101f 100%)",
      sigil: "⌁",
    };
  }

  if (t.includes("builder") || t.includes("architect")) {
    return {
      accent: "#f59e0b",
      accent2: "#fb7185",
      glow: "rgba(245, 158, 11, 0.30)",
      border: "rgba(251, 113, 133, 0.28)",
      bg:
        "radial-gradient(circle at 30% 18%, rgba(245,158,11,0.20), transparent 28%), radial-gradient(circle at 70% 24%, rgba(251,113,133,0.16), transparent 30%), linear-gradient(160deg, #1a1020 0%, #22152a 45%, #110c18 100%)",
      sigil: "⬡",
    };
  }

  return {
    accent: "#67e8f9",
    accent2: "#8b5cf6",
    glow: "rgba(103, 232, 249, 0.30)",
    border: "rgba(103, 232, 249, 0.28)",
    bg:
      "radial-gradient(circle at 28% 18%, rgba(103,232,249,0.18), transparent 30%), radial-gradient(circle at 74% 22%, rgba(139,92,246,0.22), transparent 30%), linear-gradient(165deg, #0b1026 0%, #121936 42%, #070c18 100%)",
    sigil: "✧",
  };
}

function Section({ label, text, sigil, accent }) {
  return (
    <div style={styles.sectionBlock}>
      <div style={styles.sectionHeader}>
        <div
          style={{
            ...styles.sectionSigil,
            color: accent,
            borderColor: `${accent}40`,
            boxShadow: `0 0 20px ${accent}20`,
          }}
        >
          {sigil}
        </div>
        <div style={styles.sectionLabel}>{label}</div>
      </div>
      <div style={styles.sectionText}>{text || "Not returned."}</div>
    </div>
  );
}

export default function App() {
  const [name, setName] = useState("");
  const [mood, setMood] = useState("");
  const [focus, setFocus] = useState("general");
  const [personalContext, setPersonalContext] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sharePreset, setSharePreset] = useState("tiktok");
  const [exporting, setExporting] = useState(false);

  const shareCardRef = useRef(null);

  const parsed = useMemo(() => parseCast(result || ""), [result]);
  const palette = useMemo(() => getCardPalette(parsed.title), [parsed.title]);
  const activeSharePreset = SHARE_PRESETS[sharePreset];

  useEffect(() => {
    try {
      const savedProfile = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.profile) || "{}"
      );
      const savedHistory = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.history) || "[]"
      );

      if (savedProfile.name) setName(savedProfile.name);
      if (savedProfile.mood) setMood(savedProfile.mood);
      if (savedProfile.focus) setFocus(savedProfile.focus);
      if (savedProfile.personalContext) setPersonalContext(savedProfile.personalContext);
      if (Array.isArray(savedHistory)) setHistory(savedHistory);
    } catch (err) {
      console.error("Failed to load local data:", err);
    }
  }, []);

  useEffect(() => {
    const profile = { name, mood, focus, personalContext };
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [name, mood, focus, personalContext]);

  const profileSummary = useMemo(() => {
    const parts = [];
    if (name.trim()) parts.push(name.trim());
    if (mood.trim()) parts.push(`mood: ${mood.trim()}`);
    if (focus.trim()) parts.push(`focus: ${focus}`);
    return parts.length ? parts.join(" • ") : "Unattuned Caster";
  }, [name, mood, focus]);

  const contextPreview = useMemo(() => {
    const t = personalContext.trim();
    if (!t) return "";
    return t.length > 140 ? `${t.slice(0, 137)}...` : t;
  }, [personalContext]);

  const shareSnapshot = useMemo(() => {
    const text = parsed.snapshot || "A symbolic cast from Eidomancer.";
    return text.length > 150 ? `${text.slice(0, 147)}...` : text;
  }, [parsed.snapshot]);

  const generateCast = async () => {
    if (!question.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          name,
          mood,
          focus,
          personalContext,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate cast.");
      }

      const text = data.text || "No cast returned.";
      setResult(text);

      const cast = parseCast(text);
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        question: question.trim(),
        title: cast.title,
        snapshot: cast.snapshot,
        fieldReading: cast.fieldReading,
        tension: cast.tension,
        action: cast.action,
      };

      setHistory((prev) => {
        const next = [newEntry, ...prev].slice(0, 12);
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error(err);
      setResult("Something went wrong while casting.");
    }

    setLoading(false);
  };

  const loadHistoryItem = (item) => {
    setQuestion(item.question);
    setResult(`CARD TITLE:
${item.title}

SNAPSHOT:
${item.snapshot}

FIELD READING:
${item.fieldReading}

TENSION:
${item.tension}

ACTION:
${item.action}`);
  };

  const clearMemory = () => {
    localStorage.removeItem(STORAGE_KEYS.profile);
    localStorage.removeItem(STORAGE_KEYS.history);
    setName("");
    setMood("");
    setFocus("general");
    setPersonalContext("");
    setQuestion("");
    setResult(null);
    setHistory([]);
  };

  const exportShareCard = async () => {
    if (!shareCardRef.current || !result) return;

    try {
      setExporting(true);

      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        canvasWidth: activeSharePreset.width,
        canvasHeight: activeSharePreset.height,
      });

      const link = document.createElement("a");
      link.download = `eidomancer-${sharePreset}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export share card.");
    } finally {
      setExporting(false);
    }
  };

  const shareVariant = useMemo(() => {
    const base = {
      titleSize: 108,
      sigilSize: 110,
      questionSize: 34,
      snapshotSize: 42,
      topSize: 28,
      footerSize: 22,
      titleMaxWidth: "90%",
      questionMaxWidth: "88%",
      snapshotMaxWidth: "82%",
      padding: "110px 90px 110px",
      haloSize: 520,
      haloTop: "38%",
      footerLayout: "space-between",
      questionMarginTop: 34,
      snapshotMarginTop: 14,
      topOffset: 48,
      footerBottom: 46,
    };

    if (sharePreset === "tiktok") {
      return {
        ...base,
        titleSize: 124,
        sigilSize: 124,
        questionSize: 30,
        snapshotSize: 44,
        topSize: 26,
        footerSize: 20,
        titleMaxWidth: "86%",
        questionMaxWidth: "84%",
        snapshotMaxWidth: "80%",
        padding: "150px 88px 140px",
        haloSize: 560,
        haloTop: "34%",
        questionMarginTop: 40,
        snapshotMarginTop: 18,
        topOffset: 54,
        footerBottom: 54,
      };
    }

    if (sharePreset === "facebook") {
      return {
        ...base,
        titleSize: 98,
        sigilSize: 100,
        questionSize: 30,
        snapshotSize: 36,
        topSize: 24,
        footerSize: 18,
        titleMaxWidth: "88%",
        questionMaxWidth: "85%",
        snapshotMaxWidth: "80%",
        padding: "90px 78px 100px",
        haloSize: 480,
        haloTop: "36%",
        questionMarginTop: 28,
        snapshotMarginTop: 12,
        topOffset: 42,
        footerBottom: 38,
      };
    }

    if (sharePreset === "square") {
      return {
        ...base,
        titleSize: 88,
        sigilSize: 90,
        questionSize: 26,
        snapshotSize: 30,
        topSize: 22,
        footerSize: 16,
        titleMaxWidth: "86%",
        questionMaxWidth: "82%",
        snapshotMaxWidth: "78%",
        padding: "72px 70px 82px",
        haloSize: 420,
        haloTop: "33%",
        questionMarginTop: 24,
        snapshotMarginTop: 10,
        topOffset: 34,
        footerBottom: 30,
      };
    }

    return base;
  }, [sharePreset]);

  return (
    <div style={styles.page}>
      <div style={styles.bgOrbA} />
      <div style={styles.bgOrbB} />
      <div style={styles.gridVeil} />

      <main style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>The Emergent Ones</div>
          <h1 style={styles.title}>Eidomancer</h1>
          <p style={styles.subtitle}>
            Ask a real question. Receive a symbolic cast.
          </p>
        </header>

        <section style={styles.topGrid}>
          <section style={styles.inputPanel}>
            <div style={styles.profileWrap}>
              <div style={styles.panelSubhead}>Caster Profile</div>

              <div style={styles.profileGrid}>
                <div style={styles.fieldWrap}>
                  <label htmlFor="name" style={styles.label}>
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Shawn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.textInput}
                  />
                </div>

                <div style={styles.fieldWrap}>
                  <label htmlFor="mood" style={styles.label}>
                    Current mood
                  </label>
                  <input
                    id="mood"
                    type="text"
                    placeholder="restless, hopeful, tired..."
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    style={styles.textInput}
                  />
                </div>

                <div style={styles.fieldWrap}>
                  <label htmlFor="focus" style={styles.label}>
                    Focus area
                  </label>
                  <select
                    id="focus"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    style={styles.selectInput}
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="health">Health</option>
                    <option value="love">Love</option>
                    <option value="money">Money</option>
                    <option value="purpose">Purpose</option>
                  </select>
                </div>
              </div>

              <div style={styles.fieldWrap}>
                <label htmlFor="personalContext" style={styles.label}>
                  Personal context (optional)
                </label>
                <textarea
                  id="personalContext"
                  placeholder="Briefly describe what’s going on in your life, what this question is about, or any relevant background..."
                  value={personalContext}
                  onChange={(e) => setPersonalContext(e.target.value)}
                  style={styles.contextInput}
                />
              </div>

              <div style={styles.profileRow}>
                <div style={styles.profilePill}>{profileSummary}</div>
                <button onClick={clearMemory} style={styles.clearButton}>
                  Clear Memory
                </button>
              </div>

              {contextPreview && (
                <div style={styles.contextPreview}>
                  <span style={styles.contextPreviewLabel}>Context:</span> {contextPreview}
                </div>
              )}
            </div>

            <div style={styles.questionWrap}>
              <div style={styles.panelSubhead}>Casting Prompt</div>

              <label htmlFor="question" style={styles.label}>
                Your question
              </label>
              <textarea
                id="question"
                placeholder="Should I keep pushing even though I'm confused?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={styles.input}
              />

              <button
                onClick={generateCast}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                {loading ? "Casting..." : "Cast"}
              </button>
            </div>

            <div style={styles.sharePanel}>
              <div style={styles.panelSubhead}>Share Export</div>

              <div style={styles.shareRow}>
                <div style={styles.fieldWrap}>
                  <label htmlFor="sharePreset" style={styles.label}>
                    Format
                  </label>
                  <select
                    id="sharePreset"
                    value={sharePreset}
                    onChange={(e) => setSharePreset(e.target.value)}
                    style={styles.selectInput}
                  >
                    <option value="tiktok">TikTok 9:16</option>
                    <option value="facebook">Facebook 4:5</option>
                    <option value="square">Square 1:1</option>
                  </select>
                </div>

                <button
                  onClick={exportShareCard}
                  disabled={!result || exporting}
                  style={{
                    ...styles.exportButton,
                    ...((!result || exporting) ? styles.buttonDisabled : {}),
                  }}
                >
                  {exporting ? "Exporting..." : "Export Share Card"}
                </button>
              </div>
            </div>
          </section>

          <aside style={styles.sidePanel}>
            <div style={styles.sidePanelHeader}>
              <div style={styles.panelSubhead}>Recent Cast Memory</div>
              <button
                onClick={() => setShowHistory((v) => !v)}
                style={styles.toggleButton}
              >
                {showHistory ? "Hide" : `Show (${history.length})`}
              </button>
            </div>

            {showHistory ? (
              history.length === 0 ? (
                <div style={styles.historyEmpty}>No stored casts yet.</div>
              ) : (
                <div style={styles.historyList}>
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      style={styles.historyItem}
                    >
                      <div style={styles.historyTitle}>{item.title}</div>
                      <div style={styles.historyQuestion}>{item.question}</div>
                      <div style={styles.historyMeta}>{item.timestamp}</div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div style={styles.historyCollapsed}>
                Memory is saved locally and used for continuity.
              </div>
            )}
          </aside>
        </section>

        {result && (
          <section style={styles.revealWrap}>
            <div
              style={{
                ...styles.cardArt,
                background: palette.bg,
                borderColor: palette.border,
                boxShadow: `0 24px 60px rgba(0,0,0,0.38), 0 0 36px ${palette.glow}`,
              }}
            >
              <div
                style={{
                  ...styles.cardHalo,
                  background: `radial-gradient(circle, ${palette.glow} 0%, rgba(255,255,255,0) 68%)`,
                }}
              />
              <div
                style={{
                  ...styles.cardCorner,
                  color: palette.accent,
                  borderColor: palette.border,
                }}
              >
                {palette.sigil}
              </div>

              <div style={styles.cardInnerFrame} />
              <div style={styles.cardTopText}>Eidomancer Cast</div>

              <div style={styles.cardCenter}>
                <div
                  style={{
                    ...styles.cardSigil,
                    color: palette.accent,
                    textShadow: `0 0 18px ${palette.glow}`,
                  }}
                >
                  {palette.sigil}
                </div>

                <div
                  style={{
                    ...styles.cardTitle,
                    textShadow: `0 0 24px ${palette.glow}`,
                  }}
                >
                  {parsed.title}
                </div>

                <div style={styles.cardQuestion}>
                  {question.length > 120 ? `${question.slice(0, 120)}...` : question}
                </div>

                <div style={styles.cardCasterLine}>
                  {name?.trim() ? `Cast for ${name.trim()}` : "Cast for the Caster"}
                  {mood?.trim() ? ` • ${mood.trim()}` : ""}
                </div>
              </div>

              <div style={styles.cardBottomBar}>
                <span
                  style={{
                    ...styles.cardTag,
                    borderColor: palette.border,
                    color: palette.accent,
                  }}
                >
                  {focus}
                </span>
                <span
                  style={{
                    ...styles.cardTag,
                    borderColor: palette.border,
                    color: palette.accent2,
                  }}
                >
                  Memory On
                </span>
              </div>
            </div>

            <div style={styles.readingPanel}>
              <div style={styles.readingHeaderRow}>
                <div style={styles.readingPill}>Cast Result</div>
                <div style={styles.readingTitle}>{parsed.title}</div>
              </div>

              <div style={styles.readingGrid}>
                <Section
                  label="Snapshot"
                  text={parsed.snapshot}
                  sigil="✦"
                  accent={palette.accent}
                />
                <Section
                  label="Field Reading"
                  text={parsed.fieldReading}
                  sigil="◈"
                  accent={palette.accent2}
                />
                <Section
                  label="Tension"
                  text={parsed.tension}
                  sigil="⌁"
                  accent={palette.accent}
                />
                <Section
                  label="Action"
                  text={parsed.action}
                  sigil="⬡"
                  accent={palette.accent2}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      <div style={styles.hiddenExportWrap}>
        <div
          ref={shareCardRef}
          style={{
            ...styles.shareCard,
            width: activeSharePreset.width,
            height: activeSharePreset.height,
            background: palette.bg,
            borderColor: palette.border,
            boxShadow: `inset 0 0 120px rgba(0,0,0,0.35), 0 0 50px ${palette.glow}`,
            padding: shareVariant.padding,
          }}
        >
          <div
            style={{
              ...styles.shareHalo,
              width: shareVariant.haloSize,
              height: shareVariant.haloSize,
              top: shareVariant.haloTop,
              background: `radial-gradient(circle, ${palette.glow} 0%, rgba(255,255,255,0) 68%)`,
            }}
          />

          <div
            style={{
              ...styles.shareTopLine,
              top: shareVariant.topOffset,
              fontSize: shareVariant.topSize,
            }}
          >
            The Emergent Ones
          </div>

          <div
            style={{
              ...styles.shareSigil,
              color: palette.accent,
              textShadow: `0 0 28px ${palette.glow}`,
              fontSize: shareVariant.sigilSize,
            }}
          >
            {palette.sigil}
          </div>

          <div
            style={{
              ...styles.shareTitle,
              fontSize: shareVariant.titleSize,
              maxWidth: shareVariant.titleMaxWidth,
            }}
          >
            {parsed.title || "Eidomancer Cast"}
          </div>

          <div
            style={{
              ...styles.shareQuestionBox,
              fontSize: shareVariant.questionSize,
              maxWidth: shareVariant.questionMaxWidth,
              marginTop: shareVariant.questionMarginTop,
            }}
          >
            {question || "A symbolic cast"}
          </div>

          <div style={styles.shareSnapshotLabel}>Snapshot</div>
          <div
            style={{
              ...styles.shareSnapshot,
              fontSize: shareVariant.snapshotSize,
              maxWidth: shareVariant.snapshotMaxWidth,
              marginTop: shareVariant.snapshotMarginTop,
            }}
          >
            {shareSnapshot}
          </div>

          {personalContext.trim() && sharePreset !== "tiktok" && (
            <div style={styles.shareContextWrap}>
              <div style={styles.shareContextLabel}>Context</div>
              <div style={styles.shareContext}>
                {contextPreview}
              </div>
            </div>
          )}

          <div
            style={{
              ...styles.shareFooter,
              bottom: shareVariant.footerBottom,
              justifyContent: shareVariant.footerLayout,
            }}
          >
            <span style={{ ...styles.shareTag, fontSize: shareVariant.footerSize }}>
              {name?.trim() ? `Cast for ${name.trim()}` : "Cast for the Caster"}
            </span>
            <span style={{ ...styles.shareTag, fontSize: shareVariant.footerSize }}>
              {activeSharePreset.label}
            </span>
            <span style={{ ...styles.shareTag, fontSize: shareVariant.footerSize }}>
              Eidomancer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #18214f 0%, #090d22 36%, #04070f 100%)",
    color: "#f8f5ff",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    position: "relative",
    overflow: "hidden",
    padding: "28px 18px 40px",
  },

  bgOrbA: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: "50%",
    background: "rgba(124, 58, 237, 0.16)",
    filter: "blur(70px)",
    top: -70,
    left: -90,
    pointerEvents: "none",
  },

  bgOrbB: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "rgba(34, 211, 238, 0.10)",
    filter: "blur(70px)",
    bottom: 10,
    right: -60,
    pointerEvents: "none",
  },

  gridVeil: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    maskImage: "radial-gradient(circle at center, black 40%, transparent 100%)",
    pointerEvents: "none",
    opacity: 0.25,
  },

  shell: {
    width: "100%",
    maxWidth: 1320,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  header: {
    textAlign: "center",
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#7dd3fc",
    opacity: 0.95,
    marginBottom: 10,
    fontWeight: 700,
  },

  title: {
    margin: 0,
    fontSize: "clamp(2.4rem, 5vw, 4.1rem)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "10px auto 0",
    maxWidth: 520,
    color: "#c9c4f5",
    fontSize: 16,
    lineHeight: 1.55,
  },

  topGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.8fr)",
    gap: 20,
    alignItems: "start",
  },

  inputPanel: {
    background: "rgba(7, 11, 30, 0.76)",
    border: "1px solid rgba(138, 151, 255, 0.18)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 50px rgba(0,0,0,0.34)",
    backdropFilter: "blur(12px)",
  },

  sidePanel: {
    background: "rgba(7, 11, 30, 0.72)",
    border: "1px solid rgba(138, 151, 255, 0.18)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.26)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 18,
  },

  sidePanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },

  toggleButton: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "#f0eaff",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },

  historyCollapsed: {
    color: "#c9c4f5",
    fontSize: 14,
    lineHeight: 1.5,
    paddingTop: 6,
  },

  historyList: {
    display: "grid",
    gap: 10,
    maxHeight: 560,
    overflowY: "auto",
    paddingRight: 2,
  },

  profileWrap: {
    marginBottom: 18,
    paddingBottom: 18,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  questionWrap: {},

  panelSubhead: {
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#7dd3fc",
    marginBottom: 12,
    fontWeight: 800,
  },

  profileGrid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    marginBottom: 12,
  },

  fieldWrap: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#ddd6fe",
  },

  textInput: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(145, 158, 255, 0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "#f8fafc",
    padding: "0 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },

  selectInput: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(145, 158, 255, 0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "#f8fafc",
    padding: "0 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
  },

  contextInput: {
    width: "100%",
    minHeight: 92,
    borderRadius: 16,
    border: "1px solid rgba(145, 158, 255, 0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "#f8fafc",
    padding: 14,
    resize: "vertical",
    fontSize: 14,
    lineHeight: 1.5,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
  },

  profileRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  profilePill: {
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 6,
    fontSize: 12,
    lineHeight: 1.4,
    color: "#c6fff6",
    background: "rgba(103, 232, 249, 0.08)",
    border: "1px solid rgba(103, 232, 249, 0.16)",
    borderRadius: 999,
    padding: "8px 12px",
  },

  clearButton: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "#f0eaff",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  contextPreview: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#c9c4f5",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "10px 12px",
  },

  contextPreviewLabel: {
    color: "#8ee9ff",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: 11,
  },

  input: {
    width: "100%",
    minHeight: 156,
    borderRadius: 18,
    border: "1px solid rgba(145, 158, 255, 0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "#f8fafc",
    padding: 18,
    resize: "vertical",
    fontSize: 16,
    lineHeight: 1.55,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  },

  button: {
    width: "100%",
    border: "none",
    borderRadius: 16,
    padding: "16px 18px",
    background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(23, 35, 120, 0.34)",
  },

  buttonDisabled: {
    opacity: 0.72,
    cursor: "default",
  },

  sharePanel: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  shareRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 12,
    alignItems: "end",
  },

  exportButton: {
    border: "none",
    borderRadius: 16,
    padding: "14px 18px",
    background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    minWidth: 190,
    boxShadow: "0 12px 30px rgba(23, 35, 120, 0.26)",
  },

  revealWrap: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
    gap: 22,
    alignItems: "start",
  },

  cardArt: {
    position: "relative",
    minHeight: 640,
    borderRadius: 30,
    overflow: "hidden",
    border: "1px solid rgba(103, 232, 249, 0.28)",
    padding: 22,
  },

  cardHalo: {
    position: "absolute",
    width: 360,
    height: 360,
    left: "50%",
    top: "44%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },

  cardCorner: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    background: "rgba(255,255,255,0.06)",
    fontSize: 20,
    fontWeight: 800,
    backdropFilter: "blur(8px)",
  },

  cardInnerFrame: {
    position: "absolute",
    inset: 12,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    pointerEvents: "none",
  },

  cardTopText: {
    position: "absolute",
    top: 20,
    left: 20,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(234, 244, 255, 0.82)",
  },

  cardCenter: {
    minHeight: 588,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    padding: "42px 28px 72px",
  },

  cardSigil: {
    fontSize: 64,
    marginBottom: 18,
    fontWeight: 800,
  },

  cardTitle: {
    fontSize: "clamp(2.5rem, 4vw, 4rem)",
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.05em",
    maxWidth: 620,
  },

  cardQuestion: {
    marginTop: 20,
    maxWidth: 520,
    fontSize: 15,
    lineHeight: 1.55,
    color: "rgba(229, 236, 255, 0.84)",
    padding: "12px 18px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  cardCasterLine: {
    marginTop: 14,
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(203, 247, 255, 0.78)",
  },

  cardBottomBar: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 22,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    zIndex: 1,
  },

  cardTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid",
    background: "rgba(255,255,255,0.06)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    backdropFilter: "blur(8px)",
  },

  readingPanel: {
    background: "rgba(6, 10, 24, 0.84)",
    border: "1px solid rgba(91, 255, 228, 0.16)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
    backdropFilter: "blur(12px)",
  },

  readingHeaderRow: {
    marginBottom: 12,
  },

  readingPill: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "#67e8f9",
    border: "1px solid rgba(103, 232, 249, 0.18)",
    background: "rgba(103, 232, 249, 0.07)",
    marginBottom: 10,
  },

  readingTitle: {
    fontSize: 28,
    fontWeight: 850,
    letterSpacing: "-0.03em",
    color: "#f6f4ff",
  },

  readingGrid: {
    display: "grid",
    gap: 4,
  },

  sectionBlock: {
    paddingTop: 16,
    paddingBottom: 16,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  sectionSigil: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    background: "rgba(255,255,255,0.04)",
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#67e8f9",
  },

  sectionText: {
    fontSize: 16,
    lineHeight: 1.75,
    color: "#d8fff7",
    paddingLeft: 40,
  },

  historyEmpty: {
    color: "#c9c4f5",
    fontSize: 14,
  },

  historyItem: {
    width: "100%",
    textAlign: "left",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 12,
    cursor: "pointer",
    color: "#f8f5ff",
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 4,
  },

  historyQuestion: {
    fontSize: 13,
    lineHeight: 1.45,
    color: "#c9c4f5",
    marginBottom: 4,
  },

  historyMeta: {
    fontSize: 11,
    color: "#8ee9ff",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },

  hiddenExportWrap: {
    position: "fixed",
    left: -10000,
    top: 0,
    pointerEvents: "none",
    opacity: 0,
  },

  shareCard: {
    position: "relative",
    overflow: "hidden",
    border: "2px solid rgba(103, 232, 249, 0.28)",
    borderRadius: 42,
    color: "#f8f5ff",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    textAlign: "center",
  },

  shareHalo: {
    position: "absolute",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },

  shareTopLine: {
    position: "absolute",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#8ee9ff",
    fontWeight: 800,
  },

  shareSigil: {
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: 28,
    zIndex: 1,
  },

  shareTitle: {
    lineHeight: 0.95,
    fontWeight: 900,
    letterSpacing: "-0.05em",
    zIndex: 1,
  },

  shareQuestionBox: {
    lineHeight: 1.35,
    color: "rgba(229, 236, 255, 0.88)",
    padding: "18px 28px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    zIndex: 1,
  },

  shareSnapshotLabel: {
    marginTop: 42,
    fontSize: 24,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#67e8f9",
    fontWeight: 800,
    zIndex: 1,
  },

  shareSnapshot: {
    fontWeight: 600,
    color: "#f3fbff",
    zIndex: 1,
  },

  shareContextWrap: {
    marginTop: 22,
    maxWidth: "80%",
    zIndex: 1,
  },

  shareContextLabel: {
    fontSize: 20,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#8ee9ff",
    fontWeight: 800,
    marginBottom: 10,
  },

  shareContext: {
    fontSize: 24,
    lineHeight: 1.45,
    color: "rgba(233, 241, 255, 0.82)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: "18px 22px",
  },

  shareFooter: {
    position: "absolute",
    left: 46,
    right: 46,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    zIndex: 1,
  },

  shareTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
};