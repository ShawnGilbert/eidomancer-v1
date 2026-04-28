import ArtifactCard from "./ArtifactCard";

export default function ArtifactViewer({ artifact }) {
  if (!artifact) return null;
  return <ArtifactCard artifact={artifact} />;
}