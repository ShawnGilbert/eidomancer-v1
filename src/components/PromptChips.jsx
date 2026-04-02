export function PromptChips({ prompts, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-100 transition hover:bg-white/10"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}