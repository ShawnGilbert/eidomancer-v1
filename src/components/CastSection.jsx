// ⚠️ LEGACY COMPONENT — DO NOT USE FOR V1
// Replaced by TarotSectionCard system
// Safe to delete after V1 stabilization

const styles = {
  signal: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  tension: "border-orange-400/20 bg-orange-500/10 text-orange-100",
  pattern: "border-blue-400/20 bg-blue-500/10 text-blue-100",
  poem: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-50",
  echo: "border-violet-400/20 bg-violet-500/10 text-violet-100",
};

const sigils = {
  signal: "◈",
  tension: "✦",
  pattern: "⬡",
  poem: "☽",
  echo: "✧",
};

export function CastSection({ section }) {
  if (!section) return null;

  const style = styles[section.type] || styles.signal;
  const sigil = sigils[section.type] || "◇";
  const isPoem = section.type === "poem";
  const content = typeof section.content === "string" ? section.content : "";

  return (
    <div className={`rounded-2xl border p-4 shadow-md backdrop-blur-sm ${style}`}>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] opacity-80">
        <span>{sigil}</span>
        <span>{section.label || "Section"}</span>
      </div>

      {isPoem ? (
        <div className="space-y-1 font-medium">
          {content.split("\n").map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      ) : (
        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
      )}
    </div>
  );
}