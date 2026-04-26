// D:\EidomancerProject\eidomancer-app\src\components\artifact\ArtifactViewer.jsx

import { useState } from "react";

const PANELS = [
  {
    key: "signal",
    label: "Signal",
    shortLabel: "Signal",
    position: "left-6 top-[18%]",
  },
  {
    key: "tension",
    label: "Tension",
    shortLabel: "Tension",
    position: "right-6 top-[18%]",
  },
  {
    key: "pattern",
    label: "Pattern",
    shortLabel: "Pattern",
    position: "left-6 top-[48%]",
  },
  {
    key: "insight",
    label: "Insight",
    shortLabel: "Insight",
    position: "right-6 top-[48%]",
  },
  {
    key: "essence",
    label: "Essence",
    shortLabel: "Essence",
    position: "left-1/2 bottom-8 -translate-x-1/2",
  },
];

export default function ArtifactViewer({ artifact }) {
  const [activePanel, setActivePanel] = useState("signal");
  const [showInput, setShowInput] = useState(false);

  if (!artifact) {
    return <div>No Artifact loaded.</div>;
  }

  const activePanelData =
    PANELS.find((panel) => panel.key === activePanel) || PANELS[0];

  const activeText = artifact.cast?.[activePanel] || "No text found.";

  return (
    <section className="mx-auto w-full max-w-[900px]">
      <div className="relative aspect-[8.5/11] min-h-[980px] overflow-hidden rounded-[2rem] border border-amber-300/25 bg-slate-950 text-white shadow-2xl">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-lg"
          style={{
            backgroundImage: artifact.coreImageUrl
              ? `url(${artifact.coreImageUrl})`
              : "radial-gradient(circle at center, rgba(168,85,247,0.35), rgba(2,6,23,1) 65%)",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(126,34,206,0.22),rgba(0,0,0,0.72)_55%,rgba(0,0,0,0.94)_100%)]" />
        <div className="absolute inset-0 border-[10px] border-black/30" />

        <div className="pointer-events-none absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-8 bottom-8 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

        <div className="relative z-10 flex h-full flex-col p-8">
          <header className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">
              Eidomancer Artifact
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              {artifact.title}
            </h1>

            {artifact.subtitle ? (
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                {artifact.subtitle}
              </p>
            ) : null}
          </header>

          <main className="relative mt-8 flex-1">
            <div className="absolute left-1/2 top-[44%] z-10 w-[250px] -translate-x-1/2 -translate-y-1/2 sm:w-[285px]">
              <div className="relative aspect-[2/3] overflow-hidden rounded-[1.7rem] border border-amber-300/35 bg-black/70 p-5 text-center shadow-[0_0_60px_rgba(168,85,247,0.25)]">
                <div
                  className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-sm"
                  style={{
                    backgroundImage: artifact.coreImageUrl
                      ? `url(${artifact.coreImageUrl})`
                      : "radial-gradient(circle at center, rgba(168,85,247,0.3), rgba(2,6,23,1) 70%)",
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/80" />

                <div className="relative z-10 flex h-full flex-col justify-between">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/60">
                    Core Card
                  </p>

                  <div>
                    <h2 className="text-2xl font-bold leading-tight text-white">
                      {artifact.title}
                    </h2>

                    <p className="mx-auto mt-4 max-w-[190px] text-xs leading-relaxed text-slate-300">
                      {artifact.structure?.mood || "Symbolic anchor"}
                    </p>
                  </div>

                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                    Theme Source
                  </p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-[44%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />

            {PANELS.map((panel) => {
              const isActive = activePanel === panel.key;
              const panelText = artifact.cast?.[panel.key] || "";

              return (
                <button
                  key={panel.key}
                  type="button"
                  onClick={() => setActivePanel(panel.key)}
                  className={`absolute z-20 w-[185px] rounded-2xl border p-4 text-left shadow-xl backdrop-blur-xl transition-all ${panel.position} ${
                    isActive
                      ? "scale-105 border-amber-300/55 bg-amber-300/12 text-white shadow-amber-950/40"
                      : "border-white/12 bg-black/42 text-slate-300 hover:border-purple-300/40 hover:bg-purple-500/15"
                  }`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.28em] ${
                      isActive ? "text-amber-200" : "text-purple-200/70"
                    }`}
                  >
                    {panel.shortLabel}
                  </p>

                  <p className="mt-3 line-clamp-4 text-xs leading-relaxed">
                    {panelText || "No text found."}
                  </p>
                </button>
              );
            })}

            <div className="absolute left-1/2 top-[78%] z-30 w-[82%] -translate-x-1/2 rounded-3xl border border-white/15 bg-black/65 p-5 text-center shadow-2xl backdrop-blur-xl">
              <p className="mb-3 text-xs uppercase tracking-[0.32em] text-amber-200">
                {activePanelData.label}
              </p>

              <p className="text-sm leading-relaxed text-slate-100 sm:text-base">
                {activeText}
              </p>
            </div>
          </main>

          <footer className="relative z-20 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Core Object
                </p>

                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                  {artifact.structure?.coreObject || "No core object defined."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInput((value) => !value)}
                className="rounded-xl border border-purple-300/30 bg-purple-500/15 px-4 py-2 text-sm text-purple-100 hover:bg-purple-500/25"
              >
                {showInput ? "Hide Cast Input" : "View Cast Input"}
              </button>
            </div>

            {showInput ? (
              <div className="mt-4 rounded-xl border border-amber-300/20 bg-black/60 p-4 text-sm text-slate-200">
                {artifact.privacy?.inputVisible ? (
                  <p>{artifact.input?.text}</p>
                ) : (
                  <p className="italic text-slate-400">
                    This Artifact was generated from a private or censored input.
                  </p>
                )}
              </div>
            ) : null}
          </footer>
        </div>
      </div>
    </section>
  );
}