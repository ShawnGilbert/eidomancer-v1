const ARTIFACT_HISTORY_KEY = "eidomancer_artifact_history_v1";
const ARTIFACT_HISTORY_LIMIT = 30;

export function getArtifactInput(artifact) {
  if (typeof artifact?.input === "string") return artifact.input;
  return artifact?.input?.text || artifact?.focus || "";
}

export function getArtifactFingerprint(artifact) {
  const title = artifact?.title || "";
  const input = getArtifactInput(artifact);
  const day = new Date(artifact?.createdAt || artifact?.savedAt || Date.now())
    .toISOString()
    .slice(0, 10);

  return `${title}::${input}::${day}`.toLowerCase();
}

export function getArtifactSourceCast(artifact) {
  const sourceCast =
    artifact?.sourceCast ||
    artifact?.fullCast ||
    artifact?.cast ||
    artifact?.source?.cast;

  return sourceCast && typeof sourceCast === "object" ? sourceCast : null;
}

export function getArtifactPackageOutputs(artifact) {
  const outputs =
    artifact?.packageOutputs ||
    artifact?.generatedOutputs ||
    artifact?.outputs ||
    {};
  const echo = outputs.echo ||
    (artifact?.echoPrompt
      ? {
          title: artifact?.title || "Echo",
          prompt: artifact.echoPrompt,
        }
      : null);
  const song =
    outputs.song ||
    outputs.suno ||
    artifact?.songPackage ||
    (artifact?.sunoStylePrompt || artifact?.lyrics
      ? {
          songTitle: artifact?.songTitle || artifact?.title || "Untitled Song",
          sunoStylePrompt: artifact?.sunoStylePrompt || "",
          lyrics: artifact?.lyrics || "",
        }
      : null);

  return {
    ...outputs,
    ...(echo ? { echo } : {}),
    ...(song ? { song } : {}),
  };
}

export function loadSavedArtifacts() {
  try {
    return JSON.parse(localStorage.getItem(ARTIFACT_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveArtifact(artifact, additions = {}) {
  if (!artifact) return { saved: false, reason: "missing" };

  const existing = loadSavedArtifacts();
  const sourceCast = getArtifactSourceCast({ ...artifact, ...additions });
  const savedArtifact = {
    ...artifact,
    ...additions,
    ...(sourceCast ? { sourceCast } : {}),
    savedAt: new Date().toISOString(),
  };
  const savedFingerprint = getArtifactFingerprint(savedArtifact);
  const alreadySaved = existing.some(
    (item) => getArtifactFingerprint(item) === savedFingerprint
  );

  if (alreadySaved) return { saved: false, reason: "duplicate" };

  const updated = [savedArtifact, ...existing].slice(0, ARTIFACT_HISTORY_LIMIT);
  localStorage.setItem(ARTIFACT_HISTORY_KEY, JSON.stringify(updated));

  return { saved: true, artifact: savedArtifact };
}

export function updateSavedArtifact(artifact, updates = {}) {
  if (!artifact) return { updated: false, reason: "missing" };

  const artifacts = loadSavedArtifacts();
  const targetFingerprint = getArtifactFingerprint(artifact);
  const targetIndex = artifacts.findIndex(
    (item) => getArtifactFingerprint(item) === targetFingerprint
  );

  if (targetIndex === -1) {
    return saveArtifact({
      ...artifact,
      ...updates,
      packageOutputs: {
        ...getArtifactPackageOutputs(artifact),
        ...getArtifactPackageOutputs(updates),
      },
    });
  }

  const current = artifacts[targetIndex];
  const sourceCast = getArtifactSourceCast({ ...current, ...artifact, ...updates });
  const updatedArtifact = {
    ...current,
    ...artifact,
    ...updates,
    ...(sourceCast ? { sourceCast } : {}),
    packageOutputs: {
      ...getArtifactPackageOutputs(current),
      ...getArtifactPackageOutputs(artifact),
      ...getArtifactPackageOutputs(updates),
    },
    updatedAt: new Date().toISOString(),
  };

  artifacts[targetIndex] = updatedArtifact;
  localStorage.setItem(ARTIFACT_HISTORY_KEY, JSON.stringify(artifacts));

  return { updated: true, artifact: updatedArtifact };
}

export function deleteSavedArtifact(index) {
  const artifacts = loadSavedArtifacts();
  artifacts.splice(index, 1);
  localStorage.setItem(ARTIFACT_HISTORY_KEY, JSON.stringify(artifacts));
  return artifacts;
}
