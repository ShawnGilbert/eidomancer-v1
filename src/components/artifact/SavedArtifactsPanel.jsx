// D:\EidomancerProject\eidomancer-app\src\components\artifact\SavedArtifactsPanel.jsx

import { useState } from "react";
import {
  deleteSavedArtifact,
  getArtifactFingerprint,
  getArtifactInput,
  getArtifactPackageOutputs,
  getArtifactSourceCast,
  loadSavedArtifacts,
} from "../../lib/artifactStorage";

const MAX_SAVED_ARTIFACTS_DISPLAY = 5;

function formatSavedTimestamp(savedAt) {
  if (!savedAt) return "";

  const savedDate = new Date(savedAt);

  if (Number.isNaN(savedDate.getTime())) return "";

  return savedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SavedArtifactsPanel({
  activeArtifact,
  onSelectArtifact,
}) {
  const [refresh, setRefresh] = useState(0);

  function deleteArtifact(index) {
    deleteSavedArtifact(index);
    setRefresh((v) => v + 1);
  }

  const savedArtifacts = loadSavedArtifacts();
  const visibleArtifacts = savedArtifacts.slice(0, MAX_SAVED_ARTIFACTS_DISPLAY);
  const activeFingerprint = activeArtifact
    ? getArtifactFingerprint(activeArtifact)
    : "";

  return (
    <aside className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
        Saved Artifacts
      </h2>

      {visibleArtifacts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No saved artifacts yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {visibleArtifacts.map((artifact, index) => {
            const inputPreview = getArtifactInput(artifact);
            const isFullyReloadable = Boolean(getArtifactSourceCast(artifact));
            const packageOutputs = getArtifactPackageOutputs(artifact);
            const outputLabels = [
              packageOutputs.echo ? "Echo" : "",
              packageOutputs.suno || packageOutputs.song ? "Song" : "",
              packageOutputs.youtube ? "YouTube" : "",
            ].filter(Boolean);
            const isActive =
              getArtifactFingerprint(artifact) === activeFingerprint;

            return (
              <div
                key={`${artifact.title}-${artifact.savedAt}-${index}`}
                className={`group relative rounded-xl border p-3 text-left transition-all duration-200 ease-out ${
                  isActive
                    ? "border-cyan-200/90 bg-cyan-400/20 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-200/35"
                    : "border-white/10 bg-black/30 hover:border-cyan-300/40 hover:bg-cyan-950/30"
                }`}
              >
                {isActive && (
                  <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-cyan-200/80 shadow-[0_0_18px_rgba(103,232,249,0.55)]" />
                )}

                <button
                  type="button"
                  onClick={() => deleteArtifact(index)}
                  className="absolute right-2 top-2 text-xs text-red-300 opacity-0 hover:text-red-200 group-hover:opacity-100"
                >
                  ✕
                </button>

                <button
                  type="button"
                  onClick={() => onSelectArtifact(artifact)}
                  aria-current={isActive ? "true" : undefined}
                  className="w-full text-left"
                >
                  <div className="flex flex-col gap-2 pr-5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      {isActive && (
                        <div className="mb-2 inline-flex rounded-full border border-cyan-200/35 bg-cyan-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-50 shadow-[0_0_12px_rgba(103,232,249,0.16)]">
                          Active
                        </div>
                      )}

                      <div
                        className={`truncate text-sm font-semibold leading-5 ${
                          isActive ? "text-cyan-50" : "text-white"
                        }`}
                      >
                        {artifact.title || "Untitled Artifact"}
                      </div>
                    </div>

                    {artifact.savedAt && (
                      <div className="w-fit shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300/80">
                        {formatSavedTimestamp(artifact.savedAt)}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        isFullyReloadable
                          ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100/80"
                          : "border-amber-300/25 bg-amber-400/10 text-amber-100/75"
                      }`}
                    >
                      {isFullyReloadable ? "Full cast" : "Artifact only"}
                    </span>

                    {outputLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-purple-300/25 bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-100/80"
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  {artifact.subtitle && (
                    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Essence
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-200/80">
                        {artifact.subtitle}
                      </div>
                    </div>
                  )}

                  {inputPreview && (
                    <div className="mt-2 rounded-lg border border-cyan-300/10 bg-cyan-400/10 px-2.5 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/70">
                        Focus
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-cyan-50/85">
                        {inputPreview}
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
