# Web pilot operations and release gates

The [purchase and privacy copy](./terms.js) is for owner review. The offer is one $4.99 USD payment for five readings, limited to ten buyers. The proposed fulfillment window is two US business days. The proposed policy is a full refund within 14 calendar days if no readings were used, plus support for failed fulfillment. Confirm the seller name, support mailbox, availability, applicable tax and consumer obligations, and refund handling before publishing the copy.

## Offline verification

From the repository root with Node 24:

```sh
npm ci
npm run mobile:test
npm run web:pilot:build
```

The tests use localhost, temporary SQLite ledgers, synthetic payment references, and a fake provider. The separate `web:preview:build` mode still produces the offline-only demo. `web:pilot:build` produces `mobile/dist-pilot` with the same free features and its separate browser reading/access UI. There is no payment link in the app. The owner supplies the approved checkout and terms only to invited buyers. No Stripe account or API key is needed for offline tests.

## Isolated hosting, after approval

Use a dedicated HTTPS origin on a new Render service and a single Node 24 instance with a durable, private volume. The same SQLite file holds purchase, retry and spend data. Do not run multiple instances, use ephemeral storage, or mount the storage under the static document root. The browser uses same-origin `/api/pilot` routes. Mobile and the existing site keep their current entry points and deploy settings.

- Build with `npm ci && npm run web:pilot:build`. Start with `npm run web:pilot:serve`. Keep deploys and any secrets separate from the public site.
- Set `WEB_PILOT_ORIGIN` to the exact HTTPS origin, with no trailing slash. Set `WEB_PILOT_SUPPORT` to the confirmed mailbox, and `WEB_PILOT_DATABASE` to an absolute path on the private volume. Configure `WEB_PILOT_TRUST_PROXY_HOPS` only after verifying the proxy topology and rate-limit behavior. The default is 0.
- Generate a random 32-byte hex `WEB_PILOT_KEY`, install it as a server-side secret, and keep a separate recovery copy. Use a separate project-scoped `OPENAI_API_KEY`, configured exclusively server-side. The default `WEB_PILOT_MONTHLY_API_BUDGET_USD` is 5 and the web entry point rejects higher amounts.
- For a new, never-used pilot only, run `npm run web:pilot:owner -- init` on the mounted volume. The command refuses to overwrite an existing ledger. A missing ledger for an existing pilot must be recovered. Set `WEB_PILOT_ENABLE=true` only after owner authorization for live requests. The process otherwise refuses to start. No separate payment enablement exists in the app.
- Before selling, validate TLS, proxy/IP behavior, the live model with approved synthetic cases, installs on real phones, a backup/restore drill, support delivery and the provider's test checkout. Check that the proposed support address can send and receive mail.

## Owner-verified fulfillment

Use a trusted private shell with the configured ledger path and key. Never capture command output containing codes in shared logs, CI, or tickets. The CLI is local to the host. No HTTP endpoint grants, revokes or adjusts a purchase.

1. Send invitees the full purchase terms and the hosted Stripe checkout through a private channel only after owner approval. Use Stripe-side purchase limits or individually capped links. Verify that an unapproved share or a concurrent checkout cannot create a payment you cannot fulfill. The app's ten-buyer cap limits access grants. Checkout needs its own cap or a manual refund procedure for extras.
2. In the authenticated live Stripe dashboard, confirm the intended account, product and price, USD total, successful captured payment, and absence of a refund or dispute. Copy the linked Checkout Session and Payment Intent IDs and original checkout email. The application trusts this owner verification. It never accepts a customer screenshot, receipt ID, or a redirect as payment proof.
3. Run `npm run web:pilot:owner -- grant` and provide a JSON object on standard input with `checkout`, `payment`, `email`, `amount` (499 in cents), `currency` ("usd"), and `paid` (true). Supply the JSON privately outside command history. The command emits an order ID and a one-time display of the recovery code. Send the code to the original checkout email only, with the pilot URL and support instructions. The code goes into the app's access form, never into a URL. Record fulfillment completion in the private operational record. Unique checkout, payment, and normalized checkout-email fingerprints prevent repeat grants and the ledger enforces ten lifetime pilot grants.
4. For lost access, locate the original Stripe purchase and check its status. Confirm control by sending a fresh random challenge to the original checkout email and verifying the response. Do not rely on an inbound From header. Run `npm run web:pilot:owner -- rotate ORDER_ID` with a JSON object containing `email` on standard input. Send the replacement to the original address. Rotation invalidates the previous code and session and removes replayable responses. Re-entering a valid code elsewhere transfers the session and preserves the balance. Sign-in sessions last seven days.
5. Reconcile paid, refunded, or disputed orders daily. For refund or dispute, run `npm run web:pilot:owner -- revoke ORDER_ID` to close access, record the decision, and handle the payment in Stripe separately. The CLI does not initiate a refund. Use `list` and `requests ORDER_ID` to see allowance and request metadata without reading text. If a completed reading was never received, an owner can use `recredit ORDER_ID REQUEST_ID` once for that exact request after checking the case. It restores one reading and removes replay access for that request. It does not restore API spend.

## Retries and recovery

A browser retry uses the same random request ID for the same question in its current tab. After a reload in that tab, the buyer can re-enter the exact question to retry. The browser stores a fingerprint and ID for this purpose. It does not store draft text. A valid result is debited and stored encrypted in one SQLite transaction. The same ID can replay the same result for 24 hours without another debit or provider call. Failures before a result is committed release the reading reservation. Uncertain provider usage stays reserved against the monthly ceiling. An interrupted process can leave a pending reservation. If it remains pending and the owner has confirmed the old worker has stopped, run `clear-pending ORDER_ID` after two minutes, then have the buyer retry. Request metadata and allowance records survive restarts.

- Take protected off-volume SQLite backups with `npm run web:pilot:owner -- backup /absolute/private/new-snapshot.sqlite`. This includes spend and allowance data together, handles SQLite WAL, and rejects existing destinations. Keep encrypted backup storage, verify recoverability regularly and set a retention schedule. Never copy just the active database file out from under SQLite. Keep the key separate from the backups.
- On ledger loss, stop service and checkout issuance. Keep the old files for investigation. With `WEB_PILOT_DATABASE` set to a fresh path, run `restore /absolute/private/trusted-snapshot.sqlite`. The command publishes a quarantined copy, with sessions/codes invalidated and purchases awaiting review. It conservatively consumes the full $5 API budget for the restore month. Existing provider-anomaly halts also survive. The service cannot grant or generate while the ledger is quarantined.
- Reconcile against Stripe and any newer trusted operational records, including buyer count, purchases missing from the snapshot, revocations, and recorded usage. For each quarantined order either revoke it or use `reconcile ORDER_ID REMAINING` with a verified remaining balance from zero to five. Use zero when usage cannot be established and resolve the case with support. Keep checkout closed if you cannot reconcile the cohort or restore omitted grants. `resume` requires that all orders in the restored snapshot have been reviewed. Issue replacement codes only after verification. Wait until the next UTC month for generation to resume after a restore, and confirm spend state before inviting buyers again.

The PWA caches only the static shell. Reading/access responses use `no-store`. Only explicitly submitted questions reach the reading service. Echo Journal and Revisit the Pattern entries and notes stay in browser storage, and are separate from purchase restoration. Web support is via the published mailbox.
