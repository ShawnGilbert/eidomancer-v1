export default function CastSection({ title, body, color = "purple", icon }) {
  if (!body) return null;

  const colorMap = {
    purple: "bg-purple-500/10 border-purple-400/30 text-purple-200",
    blue: "bg-blue-500/10 border-blue-400/30 text-blue-200",
    orange: "bg-orange-500/10 border-orange-400/30 text-orange-200",
    green: "bg-green-500/10 border-green-400/30 text-green-200",
    red: "bg-red-500/10 border-red-400/30 text-red-200",
  };

  return (
  <div
    className={`relative rounded-2xl border ${colorMap[color]} shadow-[0_10px_30px_rgba(0,0,0,0.28)] overflow-hidden`}
  >
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.05] to-transparent" />

    <div className="relative px-4 py-3 border-b border-white/10 bg-black/10">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] opacity-90">
        <span className="text-base">{icon || "✦"}</span>
        <span>{title}</span>
      </div>
    </div>

    <div className="relative p-4">
      <div className="rounded-xl border border-white/8 bg-black/10 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
        {body}
      </div>
    </div>
  </div>
);
}