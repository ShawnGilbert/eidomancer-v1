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
        },
        tension: {
          marker: "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.35)]",
          edge: "border-l-amber-300/45",
          label: "text-amber-200",
        },
        pattern: {
          marker: "bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.35)]",
          edge: "border-l-violet-300/45",
          label: "text-violet-200",
        },
        echo: {
          marker: "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.35)]",
          edge: "border-l-emerald-300/45",
          label: "text-emerald-200",
        },
        guidance: {
          marker: "bg-fuchsia-300 shadow-[0_0_10px_rgba(240,171,252,0.35)]",
          edge: "border-l-fuchsia-300/45",
          label: "text-fuchsia-200",
        },
      },
    },
  },
};

export function getThemePalette(themeId = "emergent") {
  return THEME_PALETTES[themeId] || THEME_PALETTES.emergent;
}
