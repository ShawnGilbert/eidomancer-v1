export function RecentCastsPanel({ casts = [], activeCastId, onLoadCast }) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
      <h2 className="text-2xl font-semibold">Recent Casts</h2>

      <div className="mt-5 h-[26rem] space-y-3 overflow-y-auto pr-1">
        {casts.length === 0 ? (
          <div className="text-sm text-blue-100/70">No casts yet.</div>
        ) : (
          casts.map((cast, index) => {
            const safeId =
              cast?.id || cast?.createdAt || cast?.timestamp || index;

            return (
              <button
                key={index}
                type="button"
                onClick={() => onLoadCast?.(safeId)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  safeId === activeCastId
                    ? "border-blue-400/40 bg-blue-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-sm font-semibold text-white">
                  {cast.title || "Untitled Cast"}
                </div>

                <div className="mt-1 line-clamp-2 text-xs text-blue-100/70">
                  {cast.question || "No question saved."}
                </div>

                <div className="mt-3 text-sm text-blue-100/85">
                  {cast.echo || "No echo yet."}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}