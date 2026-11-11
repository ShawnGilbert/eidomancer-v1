# Eidomancer — Echo & Commerce MVP (draft scope)

Status: design and implementation brief only. No release, purchase, billing, or API spend authorized.

## Product identity
Eidomancer is a symbolic lens for navigating a person's situated Ruliad. It is not fortune-telling, a generic chatbot, or a therapy substitute. The user supplies an account; the lens distinguishes observed conduct, declared intentions, exceptions, asymmetric costs, and unknowns. Its reading offers Signal, Tension, Pattern, Insight, Essence, Echo, and Guidance. "Cracks are information." A reading is a provisional interpretation, not a verdict.

## Core journey
1. **Daily Signal**: free, offline, deterministic daily symbolic observation. Existing implementation should be retained and visually elevated, not replaced by a paid model call.
2. **Ask Eidomancer / Reveal the Pattern**: two existing paths, simple prompts, one compelling front-card Insight, progressive seven-layer reveal, explicit uncertainty and evidence.
3. **Echo Journal**: explicit Save action after a reading; locally store original question, full generated reading, date, and optional notes. Never silently save sensitive inputs. Show list, reopen, delete, clear all; no account required. Disclose local storage and backup/privacy limits. No new API calls.
4. **Pattern Revisited**: from a saved reading ask "What happened?", "What held up?", "What contradicted it?", "What would change your mind?" Notes are user-authored, never automatically promoted to proof. Later offer optional paid comparison only with explicit consent and fresh moderation.
5. **Follow the Thread**: optional follow-up using the original account and reading plus the user's new evidence; preserve source provenance and calibrated uncertainty. Each follow-up is a separately metered API call. Defer until a real paid entitlement system exists.
6. **Monetization**: free Daily Signal and limited introductory reading; test finite paid reading packs rather than unlimited subscriptions. Prices are hypotheses, not promises. Implement no fake paywall and no client-trusted credits. Billing must be verified server-side with idempotent grants, abuse controls, refund handling, and per-user spend ceilings before launch.

## Flavor and visual design
Familiar oracle-card silhouette, unfamiliar epistemology. Deep midnight field, restrained warm metal, fine-line sigil, one evocative concrete image per reading. Never imply supernatural certainty. Favor evocative labels: Daily Signal, Ask Eidomancer, Reveal the Pattern, Echo Journal, Revisit the Pattern, Follow the Thread. A short image opens the door; evidence and actionable guidance do the work. Do not clone competitor artwork, copy, or decks.

## Launch/discovery hypothesis
Audience: people browsing tarot/oracle, journaling, reflective decision, and AI-reading categories, particularly tech-mystic audiences. Android store search can provide *potential* discovery, not guaranteed traffic. Produce honest listing screenshots, a 15–30 second product demo, relevant keyword research, and a public no-payment explanation page. Track listing impressions -> installs -> first completed reading -> revisit -> paid purchase. Do not buy ads before observing conversion. Use owned creator channels carefully; do not confuse existing followers with qualified customers.

## Gate before implementation
Audit current mobile/store-mvp for existing capabilities and Android package readiness. Check actual Play Console account, current publishing/testing requirements, billing and privacy policy compliance, developer registration cost, and server deployment options. Report a fixed cash budget and monthly API cap. Obtain explicit approval before any fees, external deployment, API tests, store submissions, or production payment integration.

## Prioritized implementation slices
A. Local Echo Journal and Revisit notes, with automated storage/privacy tests and no API calls.
B. Daily Signal visual polish and coherent Eidomancer home navigation.
C. Android release audit and no-cost store listing assets.
D. Server-side usage budget and entitlement design; only implement payment flows after price and store approval.
E. Follow the Thread and paid retrospective comparison after evidence of user demand.

## Acceptance criteria
- Journal works offline; saving is opt-in; no sensitive reading is sent to analytics.
- Delete and clear work; corrupted local storage fails safely; storage quota errors are visible.
- Existing six live-reading replay fixtures still pass; no unapproved live API calls.
- Daily Signal remains free of generation cost.
- No merged PR, production website changes, public deployment, billing activation, or app submission without owner approval.
- Reports separate parser reliability, qualitative reading quality, acquisition, retention, and paid conversion.
