import { useEffect, useMemo, useState } from "react";
import ArtifactCard from "./ArtifactCard";

function getArtifactTransitionKey(artifact) {
  return [
    artifact?.id,
    artifact?.savedAt,
    artifact?.updatedAt,
    artifact?.title,
  ]
    .filter(Boolean)
    .join("::");
}

export default function ArtifactViewer({ artifact }) {
  const [visible, setVisible] = useState(false);
  const artifactKey = useMemo(
    () => getArtifactTransitionKey(artifact),
    [artifact]
  );

  useEffect(() => {
    if (!artifact) return undefined;

    setVisible(false);

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [artifactKey, artifact]);

  if (!artifact) return null;

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-2 scale-[0.99] opacity-0"
      }`}
    >
      <ArtifactCard artifact={artifact} />
    </div>
  );
}
