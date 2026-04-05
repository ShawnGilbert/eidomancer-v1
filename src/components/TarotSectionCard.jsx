export function TarotSectionCard({
  title,
  body,
  sigil = "✦",
  tone = "violet",
  orientation = "portrait",
}) {
  if (!body) return null;

  const toneMap = {
    blue: {
      shell:
        "border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(80,180,255,0.10),transparent_28%),linear-gradient(180deg,rgba(5,18,45,0.98),rgba(2,9,28,0.98))]",
      glow: "shadow-[0_20px_60px_rgba(40,120,220,0.18)]",
      edge: "border-cyan-200/18",
      line: "bg-cyan-200/22",
      title: "text-cyan-100/82",
      text: "text-cyan-50/92",
      sigil: "text-cyan-200/80",
      ornament: "text-cyan-300/34",
    },
    ember: {
      shell:
        "border-orange-300/20 bg-[radial-gradient(circle_at_top,rgba(255,150,70,0.10),transparent_28%),linear-gradient(180deg,rgba(22,10,30,0.98),rgba(10,7,24,0.98))]",
      glow: "shadow-[0_20px_60px_rgba(220,110,40,0.16)]",
      edge: "border-orange-200/18",
      line: "bg-orange-200/22",
      title: "text-orange-100/82",
      text: "text-orange-50/92",
      sigil: "text-orange-200/80",
      ornament: "text-orange-300/34",
    },
    violet: {
      shell:
        "border-violet-300/20 bg-[radial-gradient(circle_at_top,rgba(170,120,255,0.10),transparent_28%),linear-gradient(180deg,rgba(20,16,58,0.98),rgba(8,8,32,0.98))]",
      glow: "shadow-[0_20px_60px_rgba(120,90,220,0.18)]",
      edge: "border-violet-200/18",
      line: "bg-violet-200/22",
      title: "text-violet-100/82",
      text: "text-violet-50/92",
      sigil: "text-violet-200/80",
      ornament: "text-violet-300/34",
    },
    teal: {
      shell:
        "border-teal-300/20 bg-[radial-gradient(circle_at_top,rgba(70,220,190,0.10),transparent_28%),linear-gradient(180deg,rgba(8,36,44,0.98),rgba(4,16,28,0.98))]",
      glow: "shadow-[0_20px_60px_rgba(30,160,140,0.18)]",
      edge: "border-teal-200/18",
      line: "bg-teal-200/22",
      title: "text-teal-100/82",
      text: "text-teal-50/92",
      sigil: "text-teal-200/80",
      ornament: "text-teal-300/34",
    },
  };

  const palette = toneMap[tone] || toneMap.violet;
  const isPortrait = orientation === "portrait";

  const motifMap = {
  blue: {
    tl: "⊚",
    tr: "⊚",
    bl: "◌",
    br: "◌",
    side: "⟡",
    crown: "⊚",
    footer: "◌",
  },
  ember: {
    tl: "✦",
    tr: "✦",
    bl: "⟁",
    br: "⟁",
    side: "✹",
    crown: "🔥",
    footer: "✦",
  },
  violet: {
    tl: "≈",
    tr: "≈",
    bl: "◈",
    br: "◈",
    side: "≈",
    crown: "≈",
    footer: "◈",
  },
  teal: {
    tl: "◌",
    tr: "◌",
    bl: "⊙",
    br: "⊙",
    side: "◌",
    crown: "🜃",
    footer: "⊙",
  },
};

  const motif = motifMap[tone] || motifMap.violet;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[30px] border backdrop-blur-sm",
        palette.shell,
        palette.glow,
        isPortrait ? "min-h-[430px]" : "min-h-[260px]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-[10px] rounded-[24px] border ${palette.edge}`} />
        <div className={`absolute inset-[18px] rounded-[20px] border ${palette.edge}`} />

        <div className="absolute left-6 top-6 text-sm leading-none">
          <span className={palette.ornament}>{motif.tl}</span>
        </div>
        <div className="absolute right-6 top-6 text-sm leading-none">
          <span className={palette.ornament}>{motif.tr}</span>
        </div>
        <div className="absolute bottom-6 left-6 text-sm leading-none">
          <span className={palette.ornament}>{motif.bl}</span>
        </div>
        <div className="absolute bottom-6 right-6 text-sm leading-none">
          <span className={palette.ornament}>{motif.br}</span>
        </div>

        <div className="absolute left-[22px] top-1/2 -translate-y-1/2 text-[10px] leading-none">
          <span className={palette.ornament}>{motif.side}</span>
        </div>
        <div className="absolute right-[22px] top-1/2 -translate-y-1/2 text-[10px] leading-none">
          <span className={palette.ornament}>{motif.side}</span>
        </div>

        <div className="absolute left-1/2 top-[18px] -translate-x-1/2">
          <div className="flex items-center gap-3">
            <div className={`h-px w-10 ${palette.line}`} />
            <div className={`text-[10px] ${palette.ornament}`}>{motif.crown}</div>
            <div className={`h-px w-10 ${palette.line}`} />
          </div>
        </div>

        <div className="absolute left-1/2 bottom-[16px] -translate-x-1/2">
          <div className="flex items-center gap-3">
            <div className={`h-px w-8 ${palette.line}`} />
            <div className={`text-[10px] ${palette.ornament}`}>{motif.footer}</div>
            <div className={`h-px w-8 ${palette.line}`} />
          </div>
        </div>

        <div className="absolute left-7 top-7 h-10 w-10 rounded-tl-[16px] border-l border-t border-white/10" />
        <div className="absolute right-7 top-7 h-10 w-10 rounded-tr-[16px] border-r border-t border-white/10" />
        <div className="absolute bottom-7 left-7 h-10 w-10 rounded-bl-[16px] border-b border-l border-white/10" />
        <div className="absolute bottom-7 right-7 h-10 w-10 rounded-br-[16px] border-b border-r border-white/10" />
      </div>

      <div className="relative flex h-full flex-col px-9 py-10">
        <div className="mt-4 text-center">
          <div className={`text-[11px] uppercase tracking-[0.32em] ${palette.title}`}>
            {title}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div
  className={[
    "mx-auto whitespace-pre-wrap text-center",
    isPortrait
      ? body.length < 90
        ? "max-w-[22ch] text-[18px] leading-10"
        : body.length < 180
          ? "max-w-[20ch] text-[16px] leading-9"
          : "max-w-[18ch] text-[15px] leading-8"
      : body.length < 120
        ? "max-w-[48ch] text-[18px] leading-10"
        : body.length < 260
          ? "max-w-[42ch] text-[16px] leading-9"
          : "max-w-[38ch] text-[15px] leading-8",
    palette.text,
  ].join(" ")}
>
  {body}
</div>
        </div>

        <div className="mb-3 flex items-center justify-center gap-3">
          <div className={`h-px w-10 ${palette.line}`} />
          <div className={`text-sm ${palette.sigil}`}>{sigil}</div>
          <div className={`h-px w-10 ${palette.line}`} />
        </div>
      </div>
    </div>
  );
}