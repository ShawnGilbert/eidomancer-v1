// D:\EidomancerProject\eidomancer-app\src\lib\artifactAdapter.js

function cleanText(value = "") {
  return String(value || "").trim();
}

function getSection(cast, type) {
  const sections = Array.isArray(cast?.sections) ? cast.sections : [];
  const match = sections.find(
    (section) => String(section?.type || "").toLowerCase() === type
  );

  return cleanText(match?.content || "");
}

function hashString(value = "") {
  let hash = 0;
  const text = String(value || "");

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function escapeXml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildVisualPrompt(cast) {
  const title = cleanText(cast?.coreCard?.name || cast?.cardName || cast?.title);
  const imagePrompt = cleanText(cast?.coreCard?.imagePrompt);
  const description = cleanText(cast?.coreCard?.description);
  const signal = getSection(cast, "signal");
  const tension = getSection(cast, "tension");
  const pattern = getSection(cast, "pattern");
  const insight = getSection(cast, "insight");
  const echo = cleanText(cast?.echo) || getSection(cast, "echo");
  const focus =
    cleanText(cast?.question) ||
    cleanText(cast?.metadata?.dailyFocus) ||
    cleanText(cast?.input);

  if (imagePrompt) return imagePrompt;
  if (description) return description;

  return [
    title,
    focus ? `focus: ${focus}` : "",
    signal ? `signal: ${signal}` : "",
    tension ? `tension: ${tension}` : "",
    pattern ? `pattern: ${pattern}` : "",
    insight ? `insight: ${insight}` : "",
    echo ? `echo: ${echo}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildGeneratedArtifactImage(cast) {
  const prompt = buildVisualPrompt(cast);

  if (!prompt) return "";

  const hash = hashString(prompt);
  const palettes = [
    ["#071019", "#22d3ee", "#f59e0b", "#8b5cf6"],
    ["#090a14", "#34d399", "#f97316", "#38bdf8"],
    ["#100718", "#f0abfc", "#fde68a", "#14b8a6"],
    ["#06111f", "#60a5fa", "#fb7185", "#a7f3d0"],
    ["#120b0b", "#f97316", "#facc15", "#38bdf8"],
  ];
  const palette = palettes[hash % palettes.length];
  const symbolCount = 5 + (hash % 4);
  const title = cleanText(cast?.coreCard?.name || cast?.cardName || cast?.title);

  const nodes = Array.from({ length: symbolCount }, (_, index) => {
    const local = hashString(`${prompt}-${index}`);
    const cx = 120 + (local % 760);
    const cy = 180 + ((local >>> 4) % 820);
    const r = 18 + ((local >>> 8) % 54);
    const opacity = 0.18 + (((local >>> 12) % 32) / 100);

    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette[(index % 3) + 1]}" opacity="${opacity.toFixed(
      2
    )}" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1280" role="img" aria-label="${escapeXml(title || "Eidomancer artifact")}">
<defs>
<radialGradient id="bg" cx="50%" cy="34%" r="72%">
<stop offset="0%" stop-color="${palette[1]}" stop-opacity="0.28"/>
<stop offset="48%" stop-color="${palette[3]}" stop-opacity="0.16"/>
<stop offset="100%" stop-color="${palette[0]}"/>
</radialGradient>
<linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="${palette[1]}"/>
<stop offset="50%" stop-color="${palette[2]}"/>
<stop offset="100%" stop-color="${palette[3]}"/>
</linearGradient>
</defs>
<rect width="1024" height="1280" fill="url(#bg)"/>
<rect x="54" y="54" width="916" height="1172" rx="42" fill="none" stroke="url(#line)" stroke-width="5" opacity="0.55"/>
<path d="M512 172 C650 286 740 406 740 590 C740 782 642 934 512 1058 C382 934 284 782 284 590 C284 406 374 286 512 172Z" fill="${palette[0]}" opacity="0.52" stroke="url(#line)" stroke-width="4"/>
${nodes}
<path d="M240 838 C372 756 446 744 512 822 C584 908 696 826 796 748" fill="none" stroke="${palette[2]}" stroke-width="8" stroke-linecap="round" opacity="0.52"/>
<path d="M294 452 C402 386 484 368 586 412 C668 448 724 440 804 394" fill="none" stroke="${palette[1]}" stroke-width="6" stroke-linecap="round" opacity="0.42"/>
<circle cx="512" cy="610" r="132" fill="none" stroke="${palette[3]}" stroke-width="7" opacity="0.58"/>
<circle cx="512" cy="610" r="42" fill="${palette[2]}" opacity="0.74"/>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildSections(cast) {
  const signal = getSection(cast, "signal");
  const tension = getSection(cast, "tension");
  const pattern = getSection(cast, "pattern");
  const insight = getSection(cast, "insight");
  const essence =
    cleanText(cast?.echo) ||
    getSection(cast, "recommendation") ||
    getSection(cast, "guidance");

  return [
    {
      id: "signal",
      title: "Signal",
      position: "leftTop",
      short: signal,
      full: signal,
    },
    {
      id: "tension",
      title: "Tension",
      position: "rightTop",
      short: tension,
      full: tension,
    },
    {
      id: "pattern",
      title: "Pattern",
      position: "leftMiddle",
      short: pattern,
      full: pattern,
    },
    {
      id: "insight",
      title: "Insight",
      position: "rightMiddle",
      short: insight,
      full: insight,
    },
    {
      id: "essence",
      title: "Essence",
      position: "bottomCenter",
      short: essence,
      full: essence,
    },
  ].filter((section) => section.short || section.full);
}

export function castToArtifact(cast) {
  if (!cast) return null;

  const title =
    cleanText(cast?.coreCard?.name) ||
    cleanText(cast?.cardName) ||
    "Untitled Artifact";

  return {
    id: cast?.id || cast?.metadata?.id || `artifact-${Date.now()}`,
    title,
    subtitle: cleanText(cast?.echo) || "An Eidomancer symbolic artifact",
    createdAt: cast?.createdAt || new Date().toISOString(),

    image:
      cast?.coreCard?.imageUrl ||
      buildGeneratedArtifactImage(cast) ||
      `${window.location.origin}/metronome_core.png`,

    input:
      cleanText(cast?.question) ||
      cleanText(cast?.metadata?.dailyFocus) ||
      "No explicit input was provided for this cast.",

    coreObject:
      cleanText(cast?.coreCard?.description) ||
      cleanText(cast?.coreCard?.imagePrompt) ||
      "No core object defined.",

    sections: buildSections(cast),

    sourceCast: cast,
  };
}
