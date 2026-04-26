// D:\EidomancerProject\eidomancer-app\src\components\artifact\ArtifactViewer.jsx

import { useState } from "react";

const PANELS = [
  { key: "signal", label: "Signal", position: "left-8 top-[18%]" },
  { key: "tension", label: "Tension", position: "right-8 top-[18%]" },
  { key: "pattern", label: "Pattern", position: "left-8 top-[45%]" },
  { key: "insight", label: "Insight", position: "right-8 top-[45%]" },
  { key: "essence", label: "Essence", position: "left-1/2 bottom-[20%] -translate-x-1/2" },
];

export default function ArtifactViewer({ artifact }) {
  const [activePanel, setActivePanel] = useState("signal");
  const [showInput, setShowInput] = useState(false);
  const [showCoreCard, setShowCoreCard] = useState(false);

  if (!artifact) return <div>No Artifact loaded.</div>;

  const activePanelData =
    PANELS.find((p) => p.key === activePanel) || PANELS[0];

  const activeText = artifact.cast?.[activePanel] || "No text found.";

  return (
    <section className="mx-auto w-full max-w-[920px]">
      <div className="relative aspect-[8.5/11] min-h-[1040px] overflow-hidden rounded-[2rem] border border-amber-300/25 bg-slate-950 text-white shadow-2xl">

        {/* ABSTRACTED CORE IMAGE BACKGROUND */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: artifact.coreImageUrl
              ? `url(${artifact.coreImageUrl})`
              : "radial-gradient(circle at center, rgba(168,85,247,0.35), rgba(2,6,23,1) 65%)",
          }}
        />

        {/* LIGHT SHAPING */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(126,34,206,0.25),rgba(0,0,0,0.75)_55%,rgba(0,0,0,0.95)_100%)]" />
        <div className="absolute inset-0 border-[10px] border-black/30" />

        {/* HEADER */}
        <div className="relative z-10 flex h-full flex-col p-9">
          <header className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">
              Eidomancer Artifact
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
              {artifact.title}
            </h1>

            {artifact.subtitle && (
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                {artifact.subtitle}
              </p>
            )}
          </header>

          {/* FLOATING PANELS */}
          <main className="relative mt-10 flex-1">
            {PANELS.map((panel) => {
              const isActive = activePanel === panel.key;
              const panelText = artifact.cast?.[panel.key] || "";

              return (
                <button
                  key={panel.key}
                  onClick={() => setActivePanel(panel.key)}
                  className={`absolute z-20 w-[190px] rounded-2xl border p-4 text-left backdrop-blur-xl transition-all ${panel.position} ${
                    isActive
                      ? "scale-105 border-amber-300/60 bg-amber-300/15 text-white"
                      : "border-white/10 bg-black/40 text-slate-300 hover:bg-purple-500/20"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200">
                    {panel.label}
                  </p>

                  <p className="mt-3 line-clamp-4 text-xs leading-relaxed">
                    {panelText}
                  </p>
                </button>
              );
            })}

            {/* ACTIVE PANEL EXPANDED */}
            <div className="absolute left-1/2 bottom-[8%] z-30 w-[82%] -translate-x-1/2 rounded-3xl border border-white/15 bg-black/70 p-5 text-center backdrop-blur-xl">
              <p className="mb-3 text-xs uppercase tracking-[0.32em] text-amber-200">
                {activePanelData.label}
              </p>

              <p className="text-sm leading-relaxed text-slate-100">
                {activeText}
              </p>
            </div>
          </main>

          {/* FOOTER */}
          <footer className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Core Object
                </p>
                <p className="mt-1 text-sm text-slate-200 line-clamp-2">
                  {artifact.structure?.coreObject}
                </p>
              </div>

              <button
                onClick={() => setShowInput((v) => !v)}
                className="rounded-xl border border-purple-300/30 bg-purple-500/15 px-4 py-2 text-sm"
              >
                {showInput ? "Hide Input" : "View Input"}
              </button>
            </div>

            {showInput && (
              <div className="mt-4 rounded-xl border border-amber-300/20 bg-black/60 p-4 text-sm text-slate-200">
                {artifact.input?.text}
              </div>
            )}
          </footer>

          {/* SMALL CORE CARD ICON */}
          {artifact.coreImageUrl && (
            <button
              onClick={() => setShowCoreCard(true)}
              className="absolute bottom-6 right-6 z-40 h-12 w-12 overflow-hidden rounded-lg border border-white/20 shadow-lg hover:scale-105"
            >
              <img
                src={artifact.coreImageUrl}
                alt="Core Card"
                className="h-full w-full object-cover"
              />
            </button>
          )}

          {/* CORE CARD MODAL */}
          {showCoreCard && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"
              onClick={() => setShowCoreCard(false)}
            >
              <div className="w-[300px] aspect-[2/3] overflow-hidden rounded-2xl border border-white/20">
                <img
                  src={artifact.coreImageUrl}
                  alt="Core Card"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}