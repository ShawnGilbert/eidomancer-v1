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
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
                className={`group relative rounded-xl border p-3 text-left transition ${
                  isActive
                    ? "border-cyan-300/70 bg-cyan-400/15 shadow-lg shadow-cyan-950/40"
                    : "border-white/10 bg-black/30 hover:border-cyan-300/40 hover:bg-cyan-950/30"
                }`}
              >
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
                  className="w-full text-left"
                >
                  {isActive && (
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                      Active
                    </div>
                  )}

                  <div className="text-sm font-semibold text-white">
                    {artifact.title || "Untitled Artifact"}
                  </div>

                  <div
                    className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                      isFullyReloadable
                        ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100/80"
                        : "border-amber-300/25 bg-amber-400/10 text-amber-100/75"
                    }`}
                  >
                    {isFullyReloadable ? "Full cast" : "Artifact only"}
                  </div>

                  {outputLabels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {outputLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-purple-300/25 bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-100/80"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {artifact.subtitle && (
                    <div className="mt-1 line-clamp-2 text-xs text-slate-400">
                      {artifact.subtitle}
                    </div>
                  )}

                  {inputPreview && (
                    <div className="mt-2 line-clamp-3 rounded-lg border border-cyan-300/10 bg-cyan-400/10 p-2 text-xs text-cyan-100">
                      Focus: {inputPreview}
                    </div>
                  )}

                  {artifact.savedAt && (
                    <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Saved {new Date(artifact.savedAt).toLocaleString()}
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
