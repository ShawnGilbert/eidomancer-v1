import { useEffect, useState } from "react";
import CoreCard from "../CoreCard";

function getCoreDetails(cast) {
  if (!cast) return null;

  const title = cast?.coreCard?.title || cast?.coreCard?.name || cast?.title || "";
  const subtitle = cast?.coreCard?.subtitle || cast?.subtitle || "";
  const hook = cast?.coreCard?.hook || cast?.coreCard?.description || "";

  if (!title && !subtitle && !hook && !cast?.coreCard?.imageUrl) {
    return null;
  }

  return {
    title: title || "Core Card",
    subtitle,
    hook,
  };
}

function getSectionContent(cast, type) {
  if (!cast || !Array.isArray(cast.sections)) return "";
  return cast.sections.find((section) => section?.type === type)?.content || "";
}

function getBackContent(cast, details) {
  const lore = cast?.coreCard?.lore || {};
  const description = cast?.coreCard?.description || "";
  const echo = cast?.echo || getSectionContent(cast, "echo");
  const signal = getSectionContent(cast, "signal");
  const pattern = getSectionContent(cast, "pattern");
  const tension = getSectionContent(cast, "tension");
  const guidance =
    getSectionContent(cast, "recommendation") ||
    getSectionContent(cast, "guidance") ||
    getSectionContent(cast, "action");
  const insight = getSectionContent(cast, "insight");
  const focus = cast?.metadata?.dailyFocus || cast?.question || "";

  return {
    archetypeMeaning:
      lore.archetypeMeaning || lore.archetype_meaning || description || details?.hook || "",
    symbolicRole: lore.symbolicRole || lore.symbolic_role || "",
    uprightMeaning: lore.uprightMeaning || lore.upright_meaning || "",
    shadowMeaning: lore.shadowMeaning || lore.shadow_meaning || "",
    whyItAppeared: lore.whyItAppeared || lore.why_it_appeared || "",
    casterInvitation: lore.casterInvitation || lore.caster_invitation || "",
    meaning: description || details?.hook || "",
    echo,
    guidance,
    insight,
    focus,
    signal,
    pattern,
    tension,
  };
}

function trimLine(value = "", fallback = "Undeclared") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.length > 74 ? `${text.slice(0, 71).trim()}...` : text;
}

function getSignalStrength(cast) {
  const aiUsed = cast?.metadata?.aiResponseUsed || cast?.metadata?.aiRequestSucceeded;
  const fallback = cast?.metadata?.usedFallback || cast?.mode === "no-ai";

  if (aiUsed && !fallback) return "Live";
  if (fallback) return "Local";
  return "Latent";
}

function DossierStat({ label, value }) {
  return (
    <div className="border-l border-cyan-300/25 px-3 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/55">
        {label}
      </div>
      <div className="mt-1 text-xs font-semibold leading-5 text-cyan-50/90">
        {value}
      </div>
    </div>
  );
}

function DossierEntry({ label, children, accent = "cyan" }) {
  const accentClass =
    accent === "amber"
      ? "text-amber-200/80"
      : accent === "emerald"
      ? "text-emerald-200/80"
      : "text-cyan-200/80";

  return (
    <section className="border-t border-white/10 pt-3">
      <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] ${accentClass}`}>
        <span className="text-sm leading-none">+</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm leading-6 text-white/82">{children}</div>
    </section>
  );
}

function getImageGenerationPayload(cast) {
  const payload =
    cast?.coreCard?.imageGeneration && typeof cast.coreCard.imageGeneration === "object"
      ? cast.coreCard.imageGeneration
      : {};

  return {
    prompt: payload.prompt || "",
    negativePrompt: payload.negativePrompt || payload.negative_prompt || "",
    styleFamily: payload.styleFamily || payload.style_family || "",
    palette: payload.palette || "",
    mood: payload.mood || "",
    symbolicMotifs: Array.isArray(payload.symbolicMotifs)
      ? payload.symbolicMotifs
      : Array.isArray(payload.symbolic_motifs)
      ? payload.symbolic_motifs
      : [],
    composition: payload.composition || "",
    lighting: payload.lighting || "",
    aspectRatio: payload.aspectRatio || payload.aspect_ratio || "",
  };
}

function PayloadField({ label, children, scroll = false }) {
  return (
    <div className="border-t border-cyan-300/10 pt-3">
      <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/45">
        {label}
      </div>
      <div
        className={`mt-2 whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-cyan-50/78 ${
          scroll ? "max-h-36 overflow-y-auto pr-2" : ""
        }`}
      >
        {children || "Not encoded"}
      </div>
    </div>
  );
}

function ImageGenerationPayloadPanel({ cast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const payload = getImageGenerationPayload(cast);
  const hasPayload = Object.values(payload).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim())
  );
  const promptReady = Boolean(String(payload.prompt || "").trim());

  async function handleCopyPrompt() {
    if (!promptReady) {
      setCopyStatus("No prompt encoded.");
      return;
    }

    try {
      await navigator.clipboard.writeText(payload.prompt);
      setCopyStatus("Prompt copied.");
    } catch (error) {
      console.warn("Unable to copy image prompt", error);
      setCopyStatus("Copy failed.");
    }
  }

  return (
    <section className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.045] p-4 shadow-inner shadow-cyan-950/20">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <div className="text-[10px] uppercase tracking-[0.26em] text-cyan-200/60">
            Image Generation Payload
          </div>
          <div className="mt-1 font-mono text-[11px] leading-5 text-white/42">
            hidden machinery beneath the symbolism
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {promptReady ? (
            <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-100/75">
              Image prompt ready
            </div>
          ) : null}
          <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-100/75">
            {isOpen ? "collapse" : "inspect"}
          </div>
        </div>
      </button>

      {isOpen ? (
        <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-4 shadow-inner shadow-cyan-950/30">
          {hasPayload ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/65">
                    Core-card prompt channel
                  </div>
                  <div className="mt-1 text-xs leading-5 text-white/45">
                    Prepared for a future image generator; no image API is called here.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  disabled={!promptReady}
                  className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-50/80 transition hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
                >
                  Copy Image Prompt
                </button>
                {copyStatus ? (
                  <div className="w-full font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-100/55">
                    {copyStatus}
                  </div>
                ) : null}
              </div>
              <PayloadField label="Prompt" scroll>
                {payload.prompt}
              </PayloadField>
              <PayloadField label="Negative Prompt" scroll>
                {payload.negativePrompt}
              </PayloadField>
              <div className="grid gap-3 sm:grid-cols-2">
                <PayloadField label="Style Family">{payload.styleFamily}</PayloadField>
                <PayloadField label="Aspect Ratio">{payload.aspectRatio}</PayloadField>
                <PayloadField label="Palette">{payload.palette}</PayloadField>
                <PayloadField label="Mood">{payload.mood}</PayloadField>
                <PayloadField label="Composition">{payload.composition}</PayloadField>
                <PayloadField label="Lighting">{payload.lighting}</PayloadField>
              </div>
              <PayloadField label="Symbolic Motifs">
                {payload.symbolicMotifs.length > 0
                  ? payload.symbolicMotifs.join(" | ")
                  : ""}
              </PayloadField>
            </div>
          ) : (
            <div className="font-mono text-[11px] leading-5 text-white/50">
              No image-generation payload is encoded on this historical cast.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function CoreCardBack({ cast, details }) {
  const dossier = getBackContent(cast, details);
  const hasLore = [
    dossier.archetypeMeaning,
    dossier.symbolicRole,
    dossier.uprightMeaning,
    dossier.shadowMeaning,
    dossier.whyItAppeared,
    dossier.casterInvitation,
  ].some((value) => String(value || "").trim());
  const hasMeaning = hasLore || Object.values(dossier).some((value) =>
    String(value || "").trim()
  );
  const imagePromptReady = Boolean(
    String(cast?.coreCard?.imageGeneration?.prompt || "").trim()
  );
  const archetype = details.subtitle || details.hook || dossier.archetypeMeaning;
  const alignment = dossier.uprightMeaning ? "Upright / Shadow" : "Interpretive";
  const momentum = dossier.casterInvitation ? "Invitational" : "Revealing";

  return (
    <div
      id="eidomancer-core-card-back"
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-400/30 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),rgba(2,8,23,0.98)_38%,rgba(3,7,18,1))] p-5 text-slate-100 shadow-2xl shadow-cyan-950/40"
    >
      <div className="border border-cyan-300/15 p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-b border-cyan-300/20 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.35em] text-cyan-200/55 lg:justify-start">
              <span>Core Record</span>
            </div>

            <h3 className="mt-4 text-center text-3xl font-semibold leading-tight text-white lg:text-left">
              {details.title}
            </h3>

            <div className="mx-auto mt-5 h-[170px] w-[122px] overflow-hidden rounded-[1.05rem] border border-cyan-300/20 shadow-xl shadow-cyan-950/35 lg:mx-0">
              <div className="pointer-events-none w-[305px] origin-top-left scale-[0.4]">
                <CoreCard cast={cast} />
              </div>
            </div>

            {imagePromptReady ? (
              <div className="mx-auto mt-3 w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-100/75 lg:mx-0">
                Image prompt ready
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-y-3 text-left lg:grid-cols-1">
              <DossierStat label="Archetype" value={trimLine(archetype)} />
              <DossierStat label="Signal" value={getSignalStrength(cast)} />
              <DossierStat label="Alignment" value={alignment} />
              <DossierStat label="Momentum" value={momentum} />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="border-b border-cyan-300/25 pb-4">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55">
                <span>Eidomancer Dossier</span>
                <span className="h-px flex-1 bg-gradient-to-r from-cyan-200/35 to-transparent" />
              </div>
              <div className="mt-3 text-sm leading-6 text-white/58">
                A lore sheet for the card's archetype, field behavior, and requested movement.
              </div>
            </div>

            <div className="mt-5 max-h-[65vh] space-y-5 overflow-y-auto pr-1">
              {hasMeaning ? (
                <>
                  <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-5">
                      <DossierEntry label="Archetype Meaning">
                        {dossier.archetypeMeaning || dossier.meaning || "Meaning has not resolved yet."}
                      </DossierEntry>

                      <DossierEntry label="Symbolic Role">
                        {dossier.symbolicRole ||
                          "This card serves as the primary symbolic anchor for the cast."}
                      </DossierEntry>
                    </div>

                    <div className="space-y-5 border-y border-cyan-300/15 py-4 xl:border-x xl:border-y-0 xl:px-4 xl:py-0">
                      <DossierEntry label="Upright Meaning" accent="emerald">
                        {dossier.uprightMeaning || trimLine(dossier.insight, "The useful reading has not resolved yet.")}
                      </DossierEntry>
                      <DossierEntry label="Shadow Meaning" accent="amber">
                        {dossier.shadowMeaning || trimLine(dossier.tension, "The shadow has not named itself yet.")}
                      </DossierEntry>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <DossierEntry label="Why It Appeared">
                      {dossier.whyItAppeared ||
                        (dossier.focus
                          ? `It appeared in response to the focus: ${dossier.focus}`
                          : "It appeared as the day's strongest available symbolic anchor.")}
                    </DossierEntry>

                    <DossierEntry label="What It Asks of the Caster" accent="emerald">
                      {dossier.casterInvitation ||
                        dossier.echo ||
                        dossier.guidance ||
                        "Let the symbol clarify the next movement without forcing the entire story to resolve."}
                    </DossierEntry>
                  </div>

                  <DossierEntry label="Supporting Context">
                    {dossier.pattern ||
                      dossier.signal ||
                      dossier.focus ||
                      "No additional cast context is needed for this card."}
                  </DossierEntry>

                  <ImageGenerationPayloadPanel cast={cast} />
                </>
              ) : (
                <div className="border-y border-white/10 py-4 text-sm leading-6 text-white/70">
                  No card-back meaning has been generated yet.
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-cyan-300/20 pt-3 text-center text-xs uppercase tracking-[0.2em] text-white/45">
              Treat As Symbolic Intelligence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DailyCoreCardPreview({ cast, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const details = getCoreDetails(cast);

  useEffect(() => {
    setIsExpanded(false);
    setIsFlipped(false);
  }, [cast?.id, cast?.dateKey]);

  useEffect(() => {
    if (!isExpanded) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  if (!details) {
    return (
      <div
        className={`min-h-[250px] rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`.trim()}
      >
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
          Core Card
        </div>
        <div className="mt-3 text-sm leading-6 text-white/55">
          Generate a cast to reveal today's symbolic anchor.
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        aria-expanded={isExpanded}
        className={`block min-h-[250px] w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-cyan-400/25 hover:bg-white/[0.07] ${className}`.trim()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
              Core Card
            </div>
            <div className="mt-2 text-xl font-semibold leading-tight text-white">
              {details.title}
            </div>
          </div>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">
            Expand
          </div>
        </div>

        <div className="mx-auto mt-4 h-[168px] w-[120px] overflow-hidden rounded-[1.05rem]">
          <div className="pointer-events-none w-[300px] origin-top-left scale-[0.4]">
            <CoreCard cast={cast} />
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${details.title} Core Card`}
          onClick={() => setIsExpanded(false)}
        >
          <div
            className={`relative max-h-full w-full overflow-y-auto ${
              isFlipped ? "max-w-5xl" : "max-w-[460px]"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFlipped((value) => !value)}
                className="rounded-full border border-cyan-400/25 bg-cyan-500/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100/85 transition hover:bg-cyan-500/25"
              >
                {isFlipped ? "Show Front" : "Flip Card"}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/75 transition hover:bg-white/15"
              >
                Close
              </button>
            </div>

            {isFlipped ? (
              <CoreCardBack cast={cast} details={details} />
            ) : (
              <CoreCard cast={cast} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
