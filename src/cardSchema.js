const archetypes = [
  "The Fog-Walker",
  "The Quiet Cartographer",
  "The Ember Keeper",
  "The Storm Listener",
  "The Bridge Builder",
];

export function makeCard({ question = "", theme = "emergent-ones" } = {}) {
  const title =
    archetypes[Math.floor(Math.random() * archetypes.length)];

  return {
    id: crypto.randomUUID(),
    title,
    theme,
    readingText: "",
    createdAt: new Date().toISOString(),
    tags: ["guidance", "navigation"],
  };
}