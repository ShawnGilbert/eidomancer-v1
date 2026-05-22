export const DEFAULT_THEME_ID = "emergent";

// TODO: When theme selection exists, keep symbolic language transforms separate
// from stable cast/artifact meaning data.
export const THEME_REGISTRY = {
  emergent: {
    id: "emergent",
    label: "Emergent",
    description: "The current Eidomancer V1 visual and symbolic language.",
    symbolicLanguage: "cyber-tarot, symbolic compression, emergent signals",
    visualTone: "dark, luminous, restrained, techno-mystic",
    paletteHint: "deep blue-black with cyan, amber, emerald, and violet accents",
    artifactFrameHint: "tarot artifact frame with subtle digital-codex glow",
  },
  technoShaman: {
    id: "technoShaman",
    label: "Techno-Shaman",
    description: "Future ritual language with machine-spirit symbolism.",
    symbolicLanguage: "ritual circuitry, synthetic spirits, signal trance",
    visualTone: "ceremonial, electric, liminal",
    paletteHint: "black, cyan, ultraviolet, signal green",
    artifactFrameHint: "ritual interface frame with circuit-glyph markings",
  },
  christian: {
    id: "christian",
    label: "Christian",
    description: "Devotional symbolic framing for reflection and discernment.",
    symbolicLanguage: "discernment, vocation, grace, trial, witness",
    visualTone: "reverent, contemplative, illuminated",
    paletteHint: "midnight blue, gold, ivory, muted crimson",
    artifactFrameHint: "illuminated manuscript frame with restrained sacred geometry",
  },
  wiccan: {
    id: "wiccan",
    label: "Wiccan",
    description: "Nature-mystic symbolic framing for cycles and intention.",
    symbolicLanguage: "cycles, elements, moon phases, threshold work",
    visualTone: "earthy, lunar, ritual, organic",
    paletteHint: "forest green, moon silver, violet, candle amber",
    artifactFrameHint: "botanical tarot frame with lunar and elemental accents",
  },
  psychological: {
    id: "psychological",
    label: "Psychological",
    description: "Inner-pattern framing for reflection, behavior, and integration.",
    symbolicLanguage: "parts, patterns, shadow, integration, attention",
    visualTone: "clinical-warm, introspective, grounded",
    paletteHint: "charcoal, soft teal, muted gold, warm gray",
    artifactFrameHint: "journal-card frame with subtle diagnostic structure",
  },
  scientific: {
    id: "scientific",
    label: "Scientific",
    description: "Systems and evidence-oriented framing for pattern analysis.",
    symbolicLanguage: "signals, models, feedback, uncertainty, systems",
    visualTone: "precise, analytic, luminous, restrained",
    paletteHint: "graphite, cyan, white, data-green",
    artifactFrameHint: "instrument-panel frame with diagrammatic annotations",
  },
};

export const THEME_PALETTES = {
  emergent: {
    id: "emergent",
    name: "Emergent",
    daily: {
      shell: "min-h-screen bg-[#071019] text-white",
      container: "mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8",
      topInteractionGrid:
        "mb-6 grid gap-4 sm:mb-8 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start",
      header:
        "mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-4 shadow-2xl shadow-cyan-900/20 sm:mb-8 sm:p-6",
      headerEyebrow: "text-xs uppercase tracking-[0.25em] text-cyan-200/75",
      headerTitle: "mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl",
      headerCopy: "mt-3 max-w-3xl text-sm leading-6 text-white/75 sm:text-base",
      statusBadgeBase: "rounded-full border px-3 py-1 text-xs font-medium",
      statusBadges: {
        connected: "border-green-400/30 bg-green-500/15 text-green-300",
        connecting:
          "border-yellow-400/30 bg-yellow-500/15 text-yellow-300 animate-pulse",
        fallback: "border-red-400/30 bg-red-500/15 text-red-300",
      },
      loading:
        "rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/75",
      error:
        "rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center text-red-100",
      savedBanner:
        "flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
      savedBannerText: "text-sm text-amber-200",
      savedBannerButton:
        "rounded-lg bg-amber-400/20 px-3 py-1 text-sm font-medium text-amber-100 hover:bg-amber-400/30",
      artifactGrid: "grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_280px]",
      sectionBlock: "mb-6 sm:mb-8",
    },
    artifact: {
      stageFrameBase: "relative rounded-[2rem] border p-2 sm:p-3",
      stageInset:
        "pointer-events-none absolute inset-0 rounded-[2rem] border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
      stageRuleBase:
        "pointer-events-none absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent to-transparent",
      moodBadge:
        "absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 backdrop-blur-md",
      moodStyles: {
        calm: {
          stage:
            "border-cyan-300/15 bg-gradient-to-b from-cyan-300/10 via-slate-950/80 to-slate-950/95 shadow-[0_24px_80px_rgba(8,47,73,0.32)]",
          rule: "via-cyan-200/30",
        },
        tense: {
          stage:
            "border-amber-300/18 bg-gradient-to-b from-amber-300/10 via-slate-950/84 to-slate-950/95 shadow-[0_24px_80px_rgba(120,53,15,0.24)]",
          rule: "via-amber-200/30",
        },
        hopeful: {
          stage:
            "border-emerald-300/18 bg-gradient-to-b from-emerald-300/10 via-slate-950/82 to-slate-950/95 shadow-[0_24px_80px_rgba(6,78,59,0.26)]",
          rule: "via-emerald-200/30",
        },
        ominous: {
          stage:
            "border-fuchsia-300/16 bg-gradient-to-b from-fuchsia-300/10 via-slate-950/88 to-slate-950/95 shadow-[0_24px_80px_rgba(88,28,135,0.28)]",
          rule: "via-fuchsia-200/28",
        },
        reflective: {
          stage:
            "border-violet-300/16 bg-gradient-to-b from-violet-300/10 via-slate-950/84 to-slate-950/95 shadow-[0_24px_80px_rgba(49,46,129,0.26)]",
          rule: "via-violet-200/30",
        },
      },
      depthLayerStyles: {
        signal: {
          marker: "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.45)]",
          edge: "border-l-cyan-300/55",
          label: "text-cyan-200",
          open: "border-cyan-300/45 bg-cyan-400/12",
          hover: "hover:border-cyan-300/25",
        },
        tension: {
          marker: "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.35)]",
          edge: "border-l-amber-300/45",
          label: "text-amber-200",
          open: "border-amber-300/40 bg-amber-400/10",
          hover: "hover:border-amber-300/25",
        },
        pattern: {
          marker: "bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.35)]",
          edge: "border-l-violet-300/45",
          label: "text-violet-200",
          open: "border-violet-300/40 bg-violet-400/10",
          hover: "hover:border-violet-300/25",
        },
        insight: {
          marker: "bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.35)]",
          edge: "border-l-blue-300/45",
          label: "text-blue-200",
          open: "border-blue-300/40 bg-blue-400/10",
          hover: "hover:border-blue-300/25",
        },
        essence: {
          marker: "bg-cyan-100 shadow-[0_0_10px_rgba(224,242,254,0.32)]",
          edge: "border-l-cyan-100/45",
          label: "text-cyan-100",
          open: "border-cyan-100/35 bg-cyan-100/10",
          hover: "hover:border-cyan-100/20",
        },
        echo: {
          marker: "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.35)]",
          edge: "border-l-emerald-300/45",
          label: "text-emerald-200",
          open: "border-emerald-300/40 bg-emerald-400/10",
          hover: "hover:border-emerald-300/25",
        },
        guidance: {
          marker: "bg-fuchsia-300 shadow-[0_0_10px_rgba(240,171,252,0.35)]",
          edge: "border-l-fuchsia-300/45",
          label: "text-fuchsia-200",
          open: "border-fuchsia-300/40 bg-fuchsia-400/10",
          hover: "hover:border-fuchsia-300/25",
        },
      },
    },
  },
};

export function getThemeMetadata(themeId = DEFAULT_THEME_ID) {
  return THEME_REGISTRY[themeId] || THEME_REGISTRY[DEFAULT_THEME_ID];
}

export function getDefaultThemeMetadata() {
  return getThemeMetadata(DEFAULT_THEME_ID);
}

export function getThemePalette(themeId = DEFAULT_THEME_ID) {
  return THEME_PALETTES[themeId] || THEME_PALETTES[DEFAULT_THEME_ID];
}
