# Eidomancer's first web purchase

This document records the initial comparison. See [pilot operations and release gates](./PILOT_OPERATIONS.md) for the implemented manual fulfillment, recovery, and web reading service.

## What exists today

Read-only checks on November 11, 2026 returned HTTPS 200 for both [Eidomancer.com](https://eidomancer.com/) and [its linked app](https://eidomancer-v1.onrender.com/). The apex serves a static marketing page and both responses had Render request headers. The linked app serves a separate client bundle. The root repository's Vite build and Express `server.js` implement the older cast, generate, and image API. Neither public homepage establishes which Git branch, Render plan, disks, DNS records, or secrets are configured. Confirm these in the owner's dashboards before touching production. This audit used GET and HEAD on the homepages.

The Capacitor apps package `mobile/dist`. The same React client already contains the Daily Signal, Ask Eidomancer, Reveal the Pattern, seven-layer display, and local-only opt-in Echo Journal with Revisit the Pattern. The separate mobile Express service contains the canon-aware prompt and parser, moderation, consent, reporting, rate limits, and persistent SQLite spend guard. Its production bootstrap expects both native store verifiers, and the browser has no native store proof. The loopback-only local mode intentionally cannot run as production.

This branch adds a separate browser preview build. It shares the existing UI and uses a labeled fictional reading to demonstrate the seven layers, including behavioral evidence, an exception, and the user's practical cutoff. Its service worker precaches the versioned app shell and static assets, and it ignores API, checkout, and account traffic. Once the shell has loaded and the worker is active, Daily Signal, the example, and journaling work offline. A journal stays with its browser storage and origin, and can disappear when the browser clears storage. Restoring a purchase must be separate from restoring a journal.

```sh
npm ci
npm run mobile:test
npm run web:preview:build
npm run web:preview -- --host 127.0.0.1
```

Open the loopback URL printed by Vite. After the first visit, go offline and reload. Explore all seven layers, save the example, open Echo Journal, add an observation under Revisit the Pattern, reload, then delete the entry. On a future HTTPS test deployment, test Chrome's install action and Safari's Add to Home Screen on phones. The preview does not require credentials. It has no live AI, checkout, or account routes. The normal mobile build still writes to `mobile/dist`.

## What to offer

**Recommended pilot: $4.99 once for five personalized readings.** This is a proposed price and allowance. Start with up to ten invited buyers and one offer per buyer. Daily Signal, the seven-layer sample and local journal are free. Guests can see what they would buy before checkout. Leave out a public free AI allowance in the first experiment so the paid signal is clear and anonymous requests cannot drain the cap. If testing a personalized trial is important, allow at most one owner-issued trial per invite. State the finite allowance, fulfillment time, refund policy, support contact, and journal limits up front. Ask whether buyers return for a second reading or record a new observation. Track invites, checkouts, confirmed payments, successful readings and refunds using operational IDs and counts only.

| | One-time pilot pass | Repeatable reading packs |
|---|---|---|
| Illustrative offer | $4.99 for 5 readings, one pass per invited buyer | $1.99 for 20, repeatable |
| Identity and restoration | Guest checkout, then buyer receives a revocable access code through the checkout email. An owner-assisted verified email recovery can rotate the code. | A stable buyer identity, email verification or magic links, multi-device sessions and a balance display. |
| Fulfillment | Owner verifies payment in Stripe, records one order, and sends access within the advertised window. | A verified payment webhook posts credits exactly once, with per-order grants, retries, reconciliation and automated fulfillment. |
| Refunds | Owner checks provider status and disables access on refund or dispute. No partial refund workflow unless required by the agreed policy. | Refunds/disputes reverse the affected grant, preserve consumption history and reconcile negative balances under a disclosed policy. |
| What it measures | A real decision to buy and early use. | Willingness to refill, after demand warrants the extra engineering. |

Do not sell unlimited access under a $5 shared cap. An owner-run manual pilot should have an advertised fulfillment window and hours, a small issuance limit, a way to deactivate the offer, and a refund path if readings cannot be delivered. Set customer expectations for capacity or service interruptions before purchase.

## Payment and access design

- **Stripe Payment Links** provide hosted card checkout with no setup or monthly fee on standard US pricing. Domestic cards cost 2.9% + $0.30 per successful transaction. The original fees are retained on refund. Stripe lists a $15 dispute-received fee and a separate $15 fee for manually countering a dispute, with the latter returned on a win. Use a recognizable statement descriptor and a clear refund/support path. Stripe is a processor here. The owner must resolve seller, tax, reporting and registration obligations before collecting money. [Pricing](https://stripe.com/pricing) · [Payment Links](https://docs.stripe.com/payment-links) · [Refunds](https://docs.stripe.com/refunds) · [Tax setup](https://docs.stripe.com/tax/set-up)
- **Lemon Squeezy** is a merchant-of-record alternative with a baseline 5% + $0.50 per sale. It handles applicable transaction taxes for supported sales, subject to seller and product approval and published surcharges. At $4.99 that is about $0.75 vs. $0.44 with Stripe domestic cards. At $1.99 it is about $0.60 vs. $0.36. Confirm that a browser-based AI reading service qualifies before depending on approval. [Pricing](https://www.lemonsqueezy.com/pricing) · [Fees](https://docs.lemonsqueezy.com/help/getting-started/fees)
- **Manual grant for the first sale.** The owner verifies the paid session in the provider dashboard, checks the approved product, price and currency and confirms it has not been refunded. A server-side owner command records the unique checkout and payment references with an atomic grant, then produces a cryptographically random recovery code. Send the code only to the address on the verified purchase. Store a hash, accept the code via a rate-limited same-origin POST, issue a revocable Secure, HttpOnly, SameSite cookie and require origin/CSRF protection on state-changing actions. Never use the checkout success URL, payment receipt number, client email field, or screenshots as proof of payment. Do not put the recovery code in URLs or logs. A new browser can use the code to restore access and its remaining count. If the code is lost, the owner can verify the buyer through the original purchase email, rotate the code and revoke old sessions. Keep raw email in the payment provider where practical. Refunds/disputes are checked against the dashboard and reconciled daily during the pilot. Disable the link once the cohort is full or capacity is unavailable. [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page)
- **If demand warrants automatic packs.** Tie Checkout Sessions to a server-owned buyer ID. Use verified webhook signatures over the raw request, retrieve and verify paid state, merchant/account, expected price and currency, and post credits idempotently keyed by purchase. Handle refunds, disputes, duplicate and out-of-order events and reconcile against the provider. Restore credits through verified identity. No card data or journal text belongs in the ledger.
- **Meter reads separately.** Build a web-only server entrypoint with an explicit access interface. Reuse the mobile reading pipeline, keep native proof and loopback configurations intact, and require an active paid entitlement before moderation or generation. Atomically reserve one reading against an authenticated idempotency key, serialize pending requests for the buyer and charge a reading on successful valid output. Release a failed hold without releasing uncertain API spend. Define the handling of lost responses before launch, including an owner recredit path if the result was generated and never reached the buyer. Avoid persisting reading text for this pilot. Deny requests on DB, auth or spend errors. Disable purchases when capacity is unavailable and make a pause/refund workflow available.
- **Reuse the application-level $5 monthly guard.** Place the initialized spend SQLite file on a persistent Render volume and run a single Node 24 instance, with separate durable entitlement and report data. The existing guard reserves up to $0.304725 per in-flight completion and settles against reported usage. Unknown usage remains held, so service can pause before actual spend reaches $5. The cap applies to completions through the metered service, so use a dedicated OpenAI project key for the pilot and exclude unrelated calls or CLI usage. A fresh or rolled-back spend ledger can undercount, so stop generation during recovery and reconcile provider usage before resuming. Keep a verified backup and recovery procedure. Store secrets only server-side.

## Cash estimate

Use a new service in the existing Render workspace, with its own branch, URL, secrets and disk, initially at its Render hostname. This avoids changing the apex, linked app, or their deploy branches. A static service can host a no-cost demonstration after approval. It cannot enforce a paid allowance by itself. A free Render web service has ephemeral local storage and cannot support the existing SQLite cap and purchase ledger. A separate paid instance reuses the stack and security model. [Render compute example](https://render.com/articles/set-up-self-hosted-github-actions-runners-on-render) · [Storage pricing](https://render.com/pricing) · [Disk behavior](https://render.com/docs/disks)

| First-month line item | Planning amount |
|---|---:|
| Render $7 compute and 1 GB persistent disk | $7.25 |
| New domain, transactional email service, paid ads | $0 for the invite pilot |
| 60 model calls including at most 10 optional trials | $0.23 typical / $0.38 stress |
| Maximum metered monthly generation allocation | $5 |
| Cash earmark for hosting plus full allocation | $12.25 |
| One $4.99 refund and one $15 received dispute as a liquidity buffer | About $20 extra |

Expect about $7.48–$7.63 for the illustrative small first month before payment fees, tax, or surprises. Earmark roughly $32 for hosting, generation cap and the buffer if funding all three upfront. Recurring service cost is approximately $7.25 plus actual metered generation and payment fees, assuming the workspace allows this compute/disk combination without a paid workspace upgrade and usage stays inside included quotas. Provider billing or prepayment requirements may affect cash timing. Confirm both dashboards before authorizing spend.

At $0.75/M input and $4.50/M output, the pinned GPT-5.4 mini candidate estimates $0.00390 for 1,600 input / 600 output tokens and $0.006375 for 2,200 / 1,050. These are scenarios from the Android plan, with compatibility covered by contract tests and live quality still unverified on the candidate. [OpenAI model and pricing](https://developers.openai.com/api/docs/models/gpt-5.4-mini)

| Stripe domestic card example | $4.99 pass, 5 readings | $1.99 pack, 20 readings |
|---|---:|---:|
| Proceeds after processing, rounded | $4.55 | $1.63 |
| Contribution after full allowance at stress estimate | $4.52 | $1.50 |
| Sales to cover $7.25 hosting at that contribution | 2 | 5 |
| Sales to cover hosting plus entire $5 API allocation, using proceeds before API | 3 | 8 |

Break-even excludes owner time, refunds, disputes, tax, overages, and marketing. It is a cost threshold, with no claim about conversion or customer demand.

## Release sequence

1. **Owner decision.** Approve the offer, access/restoration terms, refund and delivery window, and initial buyer market. Confirm the selling entity, tax treatment, support mailbox and account ownership. Activate and verify the payment account, payout bank and identity in the provider dashboard when authorized. [Stripe activation](https://docs.stripe.com/get-started/account/set-up)
2. **Finish offline engineering.** Add the independent web startup, durable grant/revoke and spend integration, recovery workflow and a separate non-caching account/checkout path. Test under SQLite restart, duplicate grants, concurrent credit debits, exhausted or missing spend DB, timeout, revoked access, and reinstall recovery. Confirm the same-origin UI can generate through the existing parser without native proof and that the journal never enters requests. Add a server pause that covers both new checkouts and invite issuance. Exercise provider test mode with explicit permission and run a recovery and refund rehearsal before launch.
3. **Owner authorization for hosting and model verification.** Approve the isolated service and budget, give scoped access to Render or provision it personally, and set the dedicated OpenAI key through Render's secret controls. Authorize a small set of live synthetic checks against the pinned candidate. Confirm TLS, origin, reports, logs, backup and restart behavior, and validate installation and offline operation on real phones.
4. **Owner approves publication and live payments.** Publish the pilot terms and disclosures on the isolated origin. Enable the single offer only after the service is ready. Invite a small relevant group with a direct link. No change to Eidomancer.com is needed for the experiment. After the first successful independent payment, grant access from verified payment evidence and confirm the buyer received a useful reading and can return for another.
5. **Review actual behavior.** Compare sample-to-checkout conversion and repeat usage. Expand toward self-service packs only if buyers use the initial offer and ask for more.

Before step 4, adapt the current privacy text for web. Disclose that deliberately submitted reading text goes to Eidomancer and OpenAI, while the journal and Revisit notes stay on the current browser/origin even when a purchase is restored. Explain report opt-in, retention and deletion, billing records and processor handling, recovery email, rate-limit data and support contact. Keep journal controls available without signing in and disclose that clearing site data or moving browsers can remove local entries. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)
