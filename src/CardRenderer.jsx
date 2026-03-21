import React, { useState } from "react";

function symbolFromTitle(title = "") {
  const t = title.toLowerCase();

  if (t.includes("flame")) return "🔥";
  if (t.includes("storm")) return "⚡";
  if (t.includes("fog")) return "🌫";
  if (t.includes("signal")) return "📡";
  if (t.includes("threshold")) return "🚪";
  if (t.includes("prophet")) return "👁";
  if (t.includes("engine")) return "⚙";
  if (t.includes("catalyst")) return "🜂";

  return "✦";
}

function CardRenderer({ card }) {
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const rawDate = card.date || card.createdAt || "Unknown Date";
  const symbol = symbolFromTitle(card.title);

  const handleCopy = async () => {
    if (!card.imagePrompt) return;

    try {
      await navigator.clipboard.writeText(card.imagePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 680,
        borderRadius: 24,
        padding: 16,
        background:
          "linear-gradient(145deg, rgba(212,193,123,0.95) 0%, rgba(145,122,55,0.98) 100%)",
        boxShadow:
          "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #f3ecdc 0%, #e8dfcc 100%)",
          borderRadius: 20,
          padding: 22,
          minHeight: 700,
          border: "1px solid rgba(90,70,25,0.22)",
          boxShadow:
            "inset 0 2px 10px rgba(255,255,255,0.45), inset 0 -10px 30px rgba(0,0,0,0.05), 0 8px 22px rgba(0,0,0,0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 10,
            borderRadius: 16,
            border: "1px solid rgba(122,99,40,0.18)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: 0.45,
            color: "#5d4b20",
            fontFamily: "sans-serif",
          }}
        >
          Eidomancer
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 16,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: "#7b6330",
                opacity: 0.8,
                marginBottom: 8,
                fontFamily: "sans-serif",
              }}
            >
              Emergent Arcana
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 24,
                lineHeight: 1.1,
                color: "#3a2b0f",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {card.title || "Untitled Cast"}
            </h2>
          </div>

          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, rgba(151,124,55,0.55), rgba(151,124,55,0.08))",
              marginBottom: 18,
            }}
          />

          <div
            style={{
              marginBottom: 22,
              borderRadius: 18,
              border: "1px solid rgba(122,99,40,0.18)",
              background:
                "radial-gradient(circle at top, rgba(120,95,40,0.18) 0%, rgba(70,55,20,0.06) 55%, rgba(255,255,255,0.15) 100%)",
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow:
                "inset 0 1px 18px rgba(255,255,255,0.18), inset 0 -8px 18px rgba(0,0,0,0.05)",
            }}
          >
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.title || "Card image"}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 180,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.06), transparent 35%, rgba(122,99,40,0.08) 100%)",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    textAlign: "center",
                    color: "#5b4617",
                  }}
                >
                  <div
                    style={{
                      fontSize: 68,
                      marginBottom: 10,
                    }}
                  >
                    {symbol}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      fontFamily: "sans-serif",
                      opacity: 0.65,
                    }}
                  >
                    Symbolic Image Slot
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            style={{
              whiteSpace: "pre-line",
              fontSize: 18,
              lineHeight: 1.55,
              color: "#2f2410",
              flex: 1,
              marginBottom: 18,
            }}
          >
            {card.readingText || "No reading available."}
          </div>

          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 14,
              background: "rgba(122,99,40,0.08)",
              border: "1px solid rgba(122,99,40,0.14)",
            }}
          >
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#7b6330",
                opacity: 0.75,
                marginBottom: 8,
              }}
            >
              Image Prompt Seed
            </div>

            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 13,
                lineHeight: 1.5,
                color: "#4f3d17",
                marginBottom: 10,
              }}
            >
              {card.imagePrompt || "No image prompt available."}
            </div>

            {card.imagePrompt && (
  <div style={{ display: "flex", gap: 8 }}>
    <button
      onClick={handleCopy}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: "none",
        background: "#cdbd7b",
        color: "#161616",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      {copied ? "Copied ✓" : "Copy Prompt"}
    </button>

    <button
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("generate-image", {
            detail: card.imagePrompt,
          })
        )
      }
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: "none",
        background: "#7b8cff",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      Generate Image
    </button>
  </div>
)}
          </div>

          <div
            style={{
              marginTop: "auto",
              paddingTop: 14,
              borderTop: "1px solid rgba(122,99,40,0.2)",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "sans-serif",
              fontSize: 13,
              color: "#5f4d24",
            }}
          >
            <div>
              Theme: <strong>{card.theme || "Unknown Theme"}</strong>
            </div>

            <div>{rawDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardRenderer;