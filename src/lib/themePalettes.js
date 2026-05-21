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
  },
};

export function getThemePalette(themeId = "emergent") {
  return THEME_PALETTES[themeId] || THEME_PALETTES.emergent;
}
