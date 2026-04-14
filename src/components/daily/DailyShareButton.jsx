// D:\eidomancer\src\components\daily\DailyShareButton.jsx

import { useEffect, useMemo, useState } from "react";
import { toBlob, toPng } from "html-to-image";

function sanitizeFileName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getCardFileName() {
  const cardRoot = document.getElementById("eidomancer-core-card");
  const titleNode = cardRoot?.querySelector("h3");
  const title = titleNode?.textContent?.trim() || "eidomancer-core-card";
  return `${sanitizeFileName(title) || "eidomancer-core-card"}.png`;
}

async function renderCardDataUrl(node, pixelRatio = 1.1) {
  return toPng(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: "#020817",
  });
}

async function buildCardFile(node) {
  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 2.5,
    backgroundColor: "#020817",
  });

  if (!blob) {
    throw new Error("Unable to create card image.");
  }

  return new File([blob], getCardFileName(), {
    type: "image/png",
  });
}

function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

async function shareCardFile(file) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Eidomancer Core Card",
      text: "You have drawn a card.",
    });
    return true;
  }

  return false;
}

export default function DailyShareButton({
  onShare,
  shareMessage = "",
  className = "",
  label = "Copy Cast",
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [cardMessage, setCardMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  const combinedMessage = useMemo(() => {
    return cardMessage || shareMessage || "";
  }, [cardMessage, shareMessage]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    }

    if (isPreviewOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isPreviewOpen]);

  async function buildPreviewImage() {
    const cardNode = document.getElementById("eidomancer-core-card");

    if (!cardNode) {
      throw new Error("Core card not found.");
    }

    const dataUrl = await renderCardDataUrl(cardNode, 1.1);

    return {
      dataUrl,
      fileName: getCardFileName(),
    };
  }

  async function handleOpenPreview() {
    setCardMessage("");
    setPreviewUrl("");
    setPreviewFileName("");
    setIsPreviewOpen(true);
    setIsPreviewLoading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 30));

      const { dataUrl, fileName } = await buildPreviewImage();
      setPreviewUrl(dataUrl);
      setPreviewFileName(fileName);
    } catch (error) {
      console.error("Failed to render core card preview:", error);
      setCardMessage("Card preview failed.");
      setIsPreviewOpen(false);
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleDownloadCard() {
    try {
      setIsExporting(true);
      setCardMessage("");

      const cardNode = document.getElementById("eidomancer-core-card");
      if (!cardNode) {
        throw new Error("Core card not found.");
      }

      const dataUrl = await renderCardDataUrl(cardNode, 2.5);
      const fileName = getCardFileName();

      downloadDataUrl(dataUrl, fileName);
      setCardMessage("Card downloaded.");
    } catch (error) {
      console.error("Failed to download core card:", error);
      setCardMessage("Card download failed.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleNativeShare() {
    try {
      setIsExporting(true);
      setCardMessage("");

      const cardNode = document.getElementById("eidomancer-core-card");
      if (!cardNode) {
        throw new Error("Core card not found.");
      }

      const file = await buildCardFile(cardNode);
      const didShare = await shareCardFile(file);

      if (didShare) {
        setCardMessage("Card shared.");
        return;
      }

      const dataUrl = await renderCardDataUrl(cardNode, 2.5);
      downloadDataUrl(dataUrl, previewFileName || getCardFileName());
      setCardMessage("Sharing not supported here. Card downloaded instead.");
    } catch (error) {
      console.error("Failed to share core card:", error);
      setCardMessage("Card share failed.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleCopyCast() {
    setCardMessage("");
    onShare?.();
  }

  function closePreview() {
    if (isExporting) return;
    setIsPreviewOpen(false);
  }

  return (
    <>
      <div
        className={`flex flex-col items-start gap-2 sm:items-end ${className}`.trim()}
      >
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleOpenPreview}
            disabled={isPreviewLoading || isExporting}
            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
              isPreviewLoading || isExporting
                ? "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
                : "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25"
            }`}
          >
            {isPreviewLoading ? "Opening..." : "Share Card"}
          </button>

          <button
            type="button"
            onClick={handleCopyCast}
            className="rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25"
          >
            {label}
          </button>
        </div>

        {combinedMessage ? (
          <div className="text-xs text-cyan-200/80">{combinedMessage}</div>
        ) : null}
      </div>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={closePreview}
            aria-hidden="true"
          />

          <div className="relative z-[101] flex h-screen w-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#071019]/95 px-4 py-3 sm:px-6">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">
                  Card Preview
                </div>
                <div className="mt-1 text-sm text-white/65">
                  Review before sharing or downloading.
                </div>
              </div>

              <button
                type="button"
                onClick={closePreview}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 sm:p-6">
              <div className="flex flex-1 items-center justify-center w-full">
                {isPreviewLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
                    Building preview...
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Eidomancer card preview"
                    className="max-h-[75vh] w-auto max-w-full rounded-[1.5rem] border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
                  />
                ) : (
                  <div className="text-sm text-white/60">
                    Preview unavailable.
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={isExporting || isPreviewLoading}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isExporting ? "Working..." : "Download"}
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={isExporting || isPreviewLoading}
                  className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/15 px-5 py-3 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isExporting ? "Working..." : "Share"}
                </button>

                <button
                  type="button"
                  onClick={closePreview}
                  disabled={isExporting}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}