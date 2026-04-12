// D:\eidomancer\src\components\daily\DailyShareButton.jsx

export default function DailyShareButton({
  onShare,
  shareMessage = "",
  className = "",
  label = "Share / Copy",
}) {
  return (
    <div className={`flex flex-col items-start gap-2 sm:items-end ${className}`.trim()}>
      <button
        type="button"
        onClick={onShare}
        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25"
      >
        {label}
      </button>

      {shareMessage ? (
        <div className="text-xs text-cyan-200/80">{shareMessage}</div>
      ) : null}
    </div>
  );
}