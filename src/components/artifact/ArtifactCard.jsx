// D:\EidomancerProject\eidomancer-app\src\components\artifact\ArtifactCard.jsx

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { getArtifactInput } from "../../lib/artifactStorage";
import { normalizeArtifact } from "../../lib/normalizeArtifact";

const sectionPositions = {
  leftTop: "left-[4%] top-[26%]",
  leftMiddle: "left-[4%] top-[47%]",
  rightTop: "right-[4%] top-[26%]",
  rightMiddle: "right-[4%] top-[47%]",
  bottomCenter: "left-1/2 bottom-[8%] -translate-x-1/2",
};

export default function ArtifactCard({ artifact }) {
  const artifactRef = useRef(null);
  const [openSection, setOpenSection] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState("");

  if (!artifact) return null;

  // Normalize at the render edge so legacy archive records cannot crash the card UI.
  const normalizedArtifact = normalizeArtifact(artifact);
  const sections = normalizedArtifact.sections;

  function buildShareText() {
    return [
      normalizedArtifact.title,
      normalizedArtifact.subtitle,
      normalizedArtifact.input ? `Input: ${getArtifactInput(normalizedArtifact)}` : "",
      "",
      ...sections.map((section) => {
        return `${section.title}: ${section.short || section.full || ""}`;
      }),
      "",
      normalizedArtifact.coreObject ? `Core Object: ${normalizedArtifact.coreObject}` : "",
      "",
      "Generated with Eidomancer",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function copyCast() {
    try {
      await navigator.clipboard.writeText(buildShareText());
      setStatus("Cast copied.");
    } catch (error) {
      console.error(error);
      setStatus("Copy failed.");
    }
  }

  async function downloadImage() {
    if (!artifactRef.current) return;

    try {
      setStatus("Rendering image...");

      const dataUrl = await toPng(artifactRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#020617",
      });

      const link = document.createElement("a");
      link.download = `${normalizedArtifact.title || "eidomancer-artifact"}.png`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      link.href = dataUrl;
      link.click();

      setStatus("Image downloaded.");
    } catch (error) {
      console.error(error);
      setStatus("Image download failed.");
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl border border-cyan-300/10 bg-slate-950 p-3 shadow-2xl shadow-cyan-950/30 sm:p-4">
      <div
        ref={artifactRef}
        className="relative overflow-hidden rounded-2xl border border-amber-300/25 bg-black shadow-[0_0_32px_rgba(251,191,36,0.08)] ring-1 ring-cyan-200/5"
      >
        <img
          src={normalizedArtifact.image}
          alt={normalizedArtifact.title || "Eidomancer artifact"}
          className="block w-full"
        />

        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-3 py-4 text-center sm:px-6 sm:py-5">
          <p className="text-[9px] uppercase tracking-[0.32em] text-amber-300/70 sm:text-[10px] sm:tracking-[0.45em]">
            Eidomancer Artifact
          </p>

          <h2 className="mx-auto mt-2 line-clamp-2 max-w-3xl break-words text-xl font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:text-3xl">
            {normalizedArtifact.title}
          </h2>

          {normalizedArtifact.subtitle && (
            <p className="mx-auto mt-1 max-w-2xl line-clamp-2 break-words text-xs leading-5 text-slate-200/90 sm:text-sm">{normalizedArtifact.subtitle}</p>
          )}
        </div>

        <div className="hidden md:block">
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            const positionClass =
              sectionPositions[section.position] || sectionPositions.leftTop;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className={`absolute ${positionClass} ${
  isOpen
  ? "z-30 scale-[1.03] border-cyan-300/80 bg-slate-950/95 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
  : "z-10 scale-100 border-amber-300/20 bg-black/50 opacity-70 hover:scale-[1.01] hover:opacity-100"
} w-[25%] rounded-xl border p-3 text-left shadow-xl backdrop-blur-md transition-all duration-200 ease-out hover:border-cyan-300/70 hover:bg-slate-950/85`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
                    {section.title}
                  </h3>

                  <span className="text-[9px] text-slate-400">
                    {isOpen ? "Close" : "Open"}
                  </span>
                </div>

                <div className="mt-2 space-y-2 overflow-hidden">
  <p className={`${isOpen ? "" : "line-clamp-3"} break-words text-xs leading-relaxed text-slate-100`}>
    {section.short}
  </p>

  {isOpen && (
  <div className="space-y-2 border-t border-white/10 pt-2">
    <div className="max-h-28 overflow-auto break-words text-[11px] leading-relaxed text-slate-300">
      {section.full || "No deeper interpretation yet."}
    </div>

    {section.action && (
      <div className="max-h-24 overflow-auto rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-2 text-[11px] leading-relaxed text-emerald-100">
        <span className="font-bold uppercase tracking-[0.18em]">
          Next Move:
        </span>{" "}
        {section.action}
      </div>
    )}
  </div>
)}
</div>
              </button>
            );
          })}
        </div>

        {normalizedArtifact.coreObject && (
          <div className="absolute bottom-3 left-3 right-3 hidden rounded-xl border border-cyan-300/25 bg-black/80 p-3 shadow-[0_0_18px_rgba(34,211,238,0.12)] backdrop-blur-md md:block">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">
              Core Object
            </h3>

            <p className="mt-1 line-clamp-3 break-words text-xs leading-relaxed text-slate-200">
              {normalizedArtifact.coreObject}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {sections.map((section) => {
          const isOpen = openSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenSection(isOpen ? null : section.id)}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-left"
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                {section.title}
              </h3>

              <div className="mt-2 space-y-2">
  <p className="line-clamp-3 break-words text-sm text-slate-200">{section.short}</p>

  {isOpen && (
  <div className="space-y-2 border-t border-white/10 pt-2">
    <div className="max-h-40 overflow-auto break-words text-[11px] leading-relaxed text-slate-300">
      {section.full || "No deeper interpretation yet."}
    </div>

    {section.action && (
      <div className="max-h-32 overflow-auto rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-2 text-[11px] leading-relaxed text-emerald-100">
        <span className="font-bold uppercase tracking-[0.18em]">
          Next Move:
        </span>{" "}
        {section.action}
      </div>
    )}
  </div>
)}
</div>
            </button>
          );
        })}
      </div>
{sections.some((section) => section.action) && (
  <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
    <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
      Guidance
    </h3>
    <p className="mt-2 line-clamp-4 break-words text-sm leading-relaxed text-emerald-100">
      {sections.find((section) => section.action)?.action}
    </p>
  </div>
)}
      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-cyan-300/10 bg-cyan-400/[0.04] px-3 py-2 text-[11px] leading-5 text-slate-400">
          <span className="font-bold uppercase tracking-[0.16em] text-cyan-200/55">
            Artifact Actions
          </span>{" "}
          Copy, download, or review input. Saved artifacts keep card state, context, and outputs.
        </div>

        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={copyCast}
            className="rounded-xl border border-cyan-300/20 bg-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/30"
          >
            Copy Cast
          </button>

          <button
            type="button"
            onClick={downloadImage}
            className="rounded-xl border border-purple-300/20 bg-purple-400/20 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/30"
          >
            Download Image
          </button>

          {normalizedArtifact.input && (
            <button
              type="button"
              onClick={() => setShowInput(!showInput)}
              className="rounded-xl border border-amber-300/20 bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/30"
            >
              {showInput ? "Hide Input" : "View Input"}
            </button>
          )}

          <span className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-center text-sm font-semibold text-emerald-100/80">
            Auto-saved
          </span>

          {status && <span className="text-sm text-slate-400">{status}</span>}
        </div>

        {showInput && normalizedArtifact.input && (
          <div className="rounded-xl border border-amber-300/20 bg-black/70 p-4 text-sm leading-relaxed text-slate-200 backdrop-blur-md">
            {getArtifactInput(normalizedArtifact)}
          </div>
        )}
      </div>
    </section>
  );
}
