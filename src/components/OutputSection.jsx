import { useState } from "react";

export function OutputSection({ title, data }) {
  const [copied, setCopied] = useState(false);

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#07142f] p-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-2 text-sm text-blue-100/60">
          Not generated yet.
        </div>
      </div>
    );
  }

  const formatted = formatData(data);

  function handleCopy() {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07142f] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{title}</div>

        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-blue-300 transition hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-blue-100/90">
        {formatted}
      </pre>
    </div>
  );
}

function formatData(data) {
  if (typeof data === "string") return data;
  if (data.bundle) return data.bundle;
  if (data.lyrics) return data.lyrics;
  if (data.prompt) return data.prompt;

  if (data.titleOptions) {
    return `Titles:
${data.titleOptions.join("\n")}

Description:
${data.description}

Tags:
${data.tagString || data.tags.join(", ")}`;
  }

  if (data.headline) {
    return `${data.headline}

${data.subhead || ""}

${data.sections?.pattern || ""}

${data.sections?.insight || ""}

${data.footer || ""}`;
  }

  return JSON.stringify(data, null, 2);
}