const pages = {
  about: {
    title: "About Eidomancer",
    eyebrow: "About",
    body: [
      "Eidomancer is a symbolic reflection app for daily casts, artifacts, and reusable creative outputs.",
      "V1 is intentionally simple: it helps you name a focus, generate a cast, inspect the artifact, and save or export useful material.",
      "Eidomancer is a reflection tool, not a substitute for professional advice, emergency support, or your own judgment.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Privacy",
    body: [
      "V1 stores casts, saved artifacts, focus text, and generated outputs in your browser local storage.",
      "If AI generation is enabled, your submitted focus and cast prompt may be sent to the configured backend and AI provider to generate a response.",
      "Do not enter sensitive personal, medical, legal, financial, or emergency information. Clearing browser site data can remove locally saved Eidomancer data.",
    ],
  },
  terms: {
    title: "Terms / Disclaimer",
    eyebrow: "Terms",
    body: [
      "Eidomancer is provided as an experimental V1 reflection and creative tool.",
      "Casts and outputs are symbolic interpretations and generated text. They are not medical, legal, financial, psychological, or spiritual authority.",
      "Use your own judgment, verify important decisions independently, and seek qualified professional help when needed.",
    ],
  },
};

export function getLegalPage(pageId) {
  return pages[pageId] || null;
}

export default function LegalPage({ pageId = "about" }) {
  const page = getLegalPage(pageId) || pages.about;

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col">
        <header className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="#/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/80 transition hover:text-cyan-100"
          >
            Eidomancer
          </a>

          <nav className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            <a href="#/about" className="transition hover:text-white">
              About
            </a>
            <a href="#/privacy" className="transition hover:text-white">
              Privacy
            </a>
            <a href="#/terms" className="transition hover:text-white">
              Terms
            </a>
          </nav>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/20 sm:p-7">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/70">
            {page.eyebrow}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            {page.title}
          </h1>

          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200/82 sm:text-base">
            {page.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <footer className="mt-auto flex flex-wrap gap-3 py-6 text-xs uppercase tracking-[0.16em] text-white/45">
          <a href="#/" className="transition hover:text-white">
            App
          </a>
          <a href="#/about" className="transition hover:text-white">
            About
          </a>
          <a href="#/privacy" className="transition hover:text-white">
            Privacy Policy
          </a>
          <a href="#/terms" className="transition hover:text-white">
            Terms / Disclaimer
          </a>
        </footer>
      </div>
    </main>
  );
}
