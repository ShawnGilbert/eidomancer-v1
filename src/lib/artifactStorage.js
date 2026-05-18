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
  const savedArtifact = {
    ...artifact,
    ...additions,
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

export function deleteSavedArtifact(index) {
  const artifacts = loadSavedArtifacts();
  artifacts.splice(index, 1);
  localStorage.setItem(ARTIFACT_HISTORY_KEY, JSON.stringify(artifacts));
  return artifacts;
}
