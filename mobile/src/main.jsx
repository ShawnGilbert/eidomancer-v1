import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif/400.css";
import { dailySignal, experiences, layers, readingPreviewLayer } from "./content.js";
import { readConsent, writeConsent } from "./consent.js";
import { clearStoreToken, storeToken } from "./store-access.js";
import { loadJournal, saveJournal, newJournalEntry } from "./journal.js";
import "./style.css";

const api = (import.meta.env.VITE_MOBILE_API_ORIGIN || "").replace(/\/$/, "");
const limit = 1800;

function Sigil({ className = "" }) {
  return <img className={className} src={new URL("./sigil.svg", import.meta.url).href} alt="" />;
}

async function post(path, body, token) {
  if (Capacitor.isNativePlatform() && !api.startsWith("https://")) throw new Error("The reading service isn’t configured in this build.");
  const response = await fetch(`${api}/api/mobile/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(23000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "The service is temporarily unavailable.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function Reading({ result, onSave, saved }) {
  const [reporting, setReporting] = useState(false);
  const [report, setReport] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const section = (key) => <section key={key}><h3>{layers[key]}</h3><p>{result.reading[key]}</p></section>;

  async function sendReport(event) {
    event.preventDefault();
    setPending(true);
    try {
      await post("reports", { token: result.reportToken, reason: report });
      setStatus("Report received.");
      setReporting(false);
    } catch {
      setStatus("Couldn’t send the report. Try again.");
    } finally {
      setPending(false);
    }
  }

  return <article className="reading panel" aria-label="Your reading">
    <span className="eyebrow">AI reading</span>
    <h2>{result.reading.title}</h2>
    {result.reading.metaphor && <p className="reading-image">{result.reading.metaphor}</p>}
    {!expanded && section(readingPreviewLayer)}
    <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary>Explore all seven layers</summary>
      {Object.keys(layers).map(section)}
      {result.reading.alternative && <section><h3>What could change this reading?</h3><p>{result.reading.alternative}</p></section>}
      {result.reading.evidence?.length > 0 && <section><h3>From your account</h3>
        {result.reading.evidence.map(({ quote, kind }) => <p key={quote}><strong>{kind === "conduct" ? "Reported action" : kind === "declaration" ? "Stated intent" : kind === "priority" ? "Your priorities" : "Exception"}</strong> · “{quote}”</p>)}
      </section>}
    </details>
    {onSave && <button className="link" disabled={saved} onClick={() => onSave(result.reading)}>{saved ? "Saved to Echo Journal" : "Save to Echo Journal"}</button>}
    {!reporting && status !== "Report received." && <button className="link" onClick={() => setReporting(true)}>Report this reading</button>}
    {reporting && <form onSubmit={sendReport}>
      <p>Reporting sends the generated reading to Eidomancer for review.</p>
      <label htmlFor="reason">Reason</label>
      <select required id="reason" value={report} onChange={(event) => setReport(event.target.value)}>
        <option value="">Choose a reason</option><option value="unsafe">Unsafe guidance</option>
        <option value="offensive">Offensive content</option><option value="misleading">Misleading claim</option>
        <option value="other">Other</option>
      </select>
      <div className="actions"><button disabled={pending} type="submit">Send report</button>
        <button disabled={pending} className="link" type="button" onClick={() => setReporting(false)}>Cancel</button></div>
    </form>}
    {status && <p role="status">{status}</p>}
  </article>;
}

function Form({ mode, consent, setConsent, onSave }) {
  const config = experiences[mode];
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function submit(event) {
    event.preventDefault();
    if (input.trim().length < 10 || pending) return;
    if (!consent) setAsking(true);
    else requestReading();
  }

  async function requestReading() {
    setAsking(false);
    setPending(true);
    setResult(null);
    setSaved(false);
    setError("");
    try {
      const request = { mode, input: input.trim(), consent: true };
      const token = await storeToken(post);
      try {
        setResult(await post("readings", request, token));
      } catch (failure) {
        if (!token || failure.status !== 401) throw failure;
        clearStoreToken();
        setResult(await post("readings", request, await storeToken(post)));
      }
    } catch (failure) {
      setError(failure instanceof SyntaxError || failure.name === "TypeError" || failure.name === "TimeoutError"
        ? "The reading service didn’t respond. Check your connection and try again."
        : failure.message);
    } finally {
      setPending(false);
    }
  }

  return <>
    <h1>{config.name}</h1><p className="intro">{config.summary}</p>
    {!result && <form className="panel" onSubmit={submit} aria-busy={pending}>
      <label htmlFor="reading-input">{config.label}</label>
      <textarea id="reading-input" placeholder={config.placeholder} value={input}
        required minLength={10} maxLength={limit} disabled={pending} onChange={(event) => setInput(event.target.value)} />
      <p className="consent">Leave out identifying details. Readings use OpenAI.</p>
      {asking ? <section aria-label="AI reading permission">
        <p>Eidomancer sends the text you submit to its server and OpenAI for moderation and to create your reading. You can withdraw this permission in Privacy &amp; support.</p>
        <div className="actions">
          <button type="button" onClick={() => { setConsent(true); requestReading(); }}>Allow &amp; get reading</button>
          <button type="button" className="link" onClick={() => setAsking(false)}>Cancel</button>
        </div>
      </section> : <button className="primary" disabled={pending} type="submit">{pending ? "Reading your question…" : config.action}</button>}
      {pending && <p className="sr-only" role="status">Generating your reading.</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </form>}
    {result && <div ref={resultRef} tabIndex={-1}>
      <Reading result={result} saved={saved} onSave={(reading) => { if (onSave(reading, input.trim(), mode)) setSaved(true); }} />
      <button className="link" onClick={() => { setResult(null); setInput(""); }}>
        Start a new reading
      </button>
    </div>}
  </>;
}

function currentView() {
  const requested = window.location.hash.slice(1);
  return requested === "privacy" || requested === "journal" || Object.hasOwn(experiences, requested) ? requested : "daily";
}

function EchoJournal({ entries, update, remove, clear }) {
  return <section>
    <h1>Echo Journal</h1>
    <p className="intro">A reading is a hypothesis, not a verdict. Return when reality has something to add.</p>
    {!entries.length && <div className="panel legal"><p>No saved readings yet. Save a reading to revisit its pattern and exceptions.</p></div>}
    {entries.map((entry) => <article className="panel legal" key={entry.id}>
      <time>{new Date(entry.savedAt).toLocaleDateString()}</time>
      <h2>{entry.reading.title}</h2>
      <p>{entry.reading.insight}</p>
      <details>
        <summary>Revisit this pattern</summary>
        <p><strong>Your question:</strong> {entry.question}</p>
        <p><strong>What could change the reading?</strong> {entry.reading.alternative}</p>
        <p><strong>Original guidance:</strong> {entry.reading.guidance}</p>
        <label htmlFor={`note-${entry.id}`}>What happened? What held up, and what contradicted it?</label>
        <textarea id={`note-${entry.id}`} maxLength={1500} value={entry.note || ""}
          placeholder="New observations are information, not proof."
          onChange={(event) => update(entry.id, event.target.value)} />
      </details>
      <button className="link" onClick={() => remove(entry.id)}>Delete entry</button>
    </article>)}
    {entries.length > 0 && <button className="link" onClick={() => { if (window.confirm("Delete all saved readings and notes from this device?")) clear(); }}>Clear journal</button>}
  </section>;
}

function App() {
  const [view, setView] = useState(currentView);
  const [journal, setJournal] = useState(() => loadJournal(window.localStorage));
  const [journalError, setJournalError] = useState("");
  function persistJournal(next) {
    if (!saveJournal(window.localStorage, next)) {
      setJournalError("Could not save on this device. Check available storage.");
      return false;
    }
    setJournal(next);
    setJournalError("");
    return true;
  }
  function addReading(reading, question, mode) {
    const entry = newJournalEntry({
      id: crypto.randomUUID(), savedAt: new Date().toISOString(), reading, question, mode,
    });
    return persistJournal([entry, ...journal].slice(0, 30));
  }
  const [consent, rememberConsent] = useState(() => readConsent(window.localStorage));
  function setConsent(allowed) {
    rememberConsent(allowed);
    writeConsent(window.localStorage, allowed);
  }
  const [date, setDate] = useState(() => new Date());
  const top = useRef(null);
  const signal = dailySignal(date);

  useEffect(() => {
    const refresh = () => setDate(new Date());
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    function handleNavigation() {
      setView(currentView());
      top.current.focus();
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", handleNavigation);
    return () => window.removeEventListener("hashchange", handleNavigation);
  }, []);

  function navigate(next) {
    if (next !== view) window.location.hash = next;
  }

  return <div className="shell">
    <header><button className="wordmark" onClick={() => navigate("daily")}><Sigil />Eidomancer</button>
      {view !== "daily" && <button className="back" onClick={() => navigate("daily")}>← Daily Signal</button>}</header>
    <main ref={top} tabIndex={-1}>
      {view === "daily" ? <>
        <div className="date-row"><h1>Daily Signal</h1><time>{new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(date)}</time></div>
        <article className="daily panel">
          <div className="art"><Sigil /></div>
          <div className="daily-copy"><h2>{signal.title}</h2><p>{signal.signal}</p>
            <details><summary>Try this today</summary><p>{signal.guidance}</p></details>
          </div>
        </article>
        <nav aria-label="Readings">
          {Object.entries(experiences).map(([key, item]) =>
            <button key={key} className="destination panel" onClick={() => navigate(key)}>
              <span><strong>{item.name}</strong><small>{item.summary}</small></span><span aria-hidden="true">↗</span>
            </button>)}
        </nav>
        <button className="destination panel" onClick={() => navigate("journal")}>
          <span><strong>Echo Journal</strong><small>What held up? What changed? What surprised you?</small></span><span aria-hidden="true">↗</span>
        </button>
      </> : view === "journal" ? <EchoJournal entries={journal}
        update={(id, note) => persistJournal(journal.map((entry) => entry.id === id ? { ...entry, note } : entry))}
        remove={(id) => persistJournal(journal.filter((entry) => entry.id !== id))}
        clear={() => persistJournal([])} /> : view === "privacy" ? <>
        <h1>Privacy & support</h1>
        <div className="panel legal">
          <p>Daily Signal is available on your device. Ask Eidomancer and Reveal the Pattern send the text you submit to the Eidomancer service and OpenAI with your permission. The app doesn’t require an account. If you explicitly save a reading, its question, generated text, and your notes are stored on this device (up to 30 entries), not in an Eidomancer account. You can delete entries or clear the journal. Device backups and anyone with access to this device may also access saved entries.</p>
          <p>Eidomancer processes network information to operate and limit abuse. If you report a reading, the generated text and report reason are retained for review.</p>
          <p>AI reading permission is {consent ? "on" : "off"}.</p>
          {consent && <button type="button" className="link" onClick={() => setConsent(false)}>Withdraw AI reading permission</button>}
          {api && <p><a href={`${api}/privacy`} target="_blank" rel="noreferrer">Full privacy policy and support ↗</a></p>}
        </div>
      </> : <Form key={view} mode={view} consent={consent} setConsent={setConsent} onSave={addReading} />}
      {journalError && <p className="error" role="alert">{journalError}</p>}
    </main>
    <footer><button className="link" onClick={() => navigate("privacy")}>Privacy & support</button></footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
