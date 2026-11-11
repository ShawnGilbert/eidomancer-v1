import React, { useEffect, useState } from "react";
import { pilotPost } from "./client.js";
import { purchaseTerms, privacyTerms } from "./terms.js";

export function Support({ email }) {
  return email ? <p>Support and privacy requests · <a href={`mailto:${email}`}>{email}</a></p>
    : <p>For support, reply to your pilot invitation or access email.</p>;
}

export function PilotPrivacy({ support }) {
  return <>
    {privacyTerms.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    <p><a href="https://developers.openai.com/api/docs/guides/your-data" rel="noreferrer">OpenAI API data controls</a></p>
    <Support email={support} />
  </>;
}

export function PilotAccess({ remaining, setRemaining, support, onContinue }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    pilotPost("balance").then((value) => { if (mounted) setRemaining(value.remaining); })
      .catch(() => { if (mounted) setError("Access could not be checked. Try again online or contact support."); });
    return () => { mounted = false; };
  }, [setRemaining]);

  async function access(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const code = new FormData(form).get("code").trim();
    form.reset();
    setBusy(true);
    setError("");
    try { setRemaining((await pilotPost("access", { code })).remaining); }
    catch (failure) { setError(failure.code ? failure.message : "Access could not be checked. Try again online."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    setError("");
    try { setRemaining((await pilotPost("logout")).remaining); }
    catch { setError("Couldn’t sign out. Try again online."); }
    finally { setBusy(false); }
  }

  return <section>
    <h1>Personalized readings</h1>
    <div className="panel">
      {remaining === null ? <form onSubmit={access}>
        <label htmlFor="pilot-code">Your access code</label>
        <input id="pilot-code" name="code" type="password" autoComplete="off" spellCheck="false" required
          minLength={43} maxLength={43} />
        <button type="submit" disabled={busy}>Restore reading access</button>
      </form> : <>
        <p role="status">{remaining} of 5 readings remaining</p>
        {remaining > 0 && <button type="button" onClick={onContinue}>Ask Eidomancer</button>}
        <button type="button" className="link" disabled={busy} onClick={logout}>Sign out of this browser</button>
      </>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
    <section className="panel legal">
      <h2>Pilot purchase terms</h2>
      {purchaseTerms.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <Support email={support} />
    </section>
  </section>;
}
