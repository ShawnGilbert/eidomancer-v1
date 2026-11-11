# Eidomancer mobile launch

## Source and scope

The mobile build and service live alongside the existing React/Vite site and Express service. The separate eidomancer-site repository is a static landing page. The previous website build uses the existing cast and generation routes and references an older Render API. The mobile service has separate, bounded routes and can run in its own process. The existing web build still uses `npm run build`.

The mobile lens applies the repository's Situated Valuation amendment and the evidence, symbolism, and Physics First rules in [Canon v0.3](https://github.com/ShawnGilbert/eidomancer-v1/blob/eidomancer-recovery/EIDOMANCER_CANON_V0.3.md). It applies those principles to a single reading. World lineage, the Soliadic automaton and the speculative Generative Null model stay in the canon. The app opens directly to an offline Daily Signal drawn from a rotating set of 14 editorial reflections. The two personalized experiences use seven structured AI layers, with the most relevant layers visible first. The English MVP targets Android phones and iPhone.

## Store listing draft

| Field | Proposed copy |
| --- | --- |
| Title | Eidomancer: Daily Reflection |
| Apple subtitle | Decisions, habits & patterns |
| Google short description | Daily reflections and AI readings for decisions, relationships, and habits. |
| Apple keywords | daily,journal,insight,mindfulness,choices,relationships,self discovery,guidance,clarity |
| Primary category | Lifestyle |
| Price | Paid download. Set the price after measuring pilot reading volume, cost, and retention. |

**Description**

Start with a Daily Signal. Bring a question to Eidomancer when a decision feels tangled. If the same situation keeps playing out, Reveal the Pattern helps you look at what actually happened, what might explain it, and what you could try next.

- Daily Signal offers a short reflection and something to try today.
- Ask Eidomancer gives you a fresh angle on a question and one practical next step.
- Reveal the Pattern explores recurring choices and experiences, with room for exceptions and uncertainty.

Expand a reading to explore seven layers of interpretation. Daily Signal works offline. Personalized readings use AI and require a connection. No account is required.

**Review instructions**
Lead the review notes with the app’s evidence-aware pattern analysis and its offline Daily Signal. Apple’s guidelines require minimum app functionality and meaningful differentiation in established categories such as fortune telling.

Open the app to see Daily Signal. Choose Ask Eidomancer, enter “I want more flexibility at work, but I rely on a stable paycheck. How can I explore a change without risking that income?”, review the consent text and tick the box, then tap Get a reading. Expand the layers and use Report this reading to verify in-app reporting. Reveal the Pattern can be reviewed with “Twice this month I agreed to cover a shift before checking my schedule and then had to cancel my plans. When I waited to check first, it went better.” The app does not require a reviewer login.

## Build and deployment

1. Install Node 24 and run `npm ci`, `npm run mobile:test`, and `npm run mobile:build`.
2. Provision a separate HTTPS mobile service with build command `npm ci && npm run mobile:build` and start command `npm run mobile:serve`. A single instance with persistent report storage fits the in-memory rate limits. Set the server variables listed in `mobile/server.env.example` using the host's environment settings. Generate a dedicated 32-byte hex report key with `openssl rand -hex 32`. Keep the key and a project-scoped OpenAI API key on the server. Configure proxy hops to match the host's trusted topology. Verify `/health`, `/privacy`, both reading modes, and report persistence. Review the reports regularly and establish a retention period and deletion procedure before publication. Confirm infrastructure logging and OpenAI retention against the final store privacy disclosures.
3. Run `VITE_MOBILE_API_ORIGIN=https://YOUR-HOST npm run mobile:sync` after the HTTPS service is operational. Use the same origin for the privacy and support URL. Register `com.eidomancer.app` under the store owner once its availability is confirmed.
4. Android uses JDK 21 and Android SDK 36. In `android`, `./gradlew assembleDebug bundleRelease` produces the test APK and unsigned AAB. Configure the account owner's upload key and Play App Signing, and validate the signed AAB in Play Console. Install the app on an Android device and exercise all three experiences.
5. On macOS with Xcode 26 or later, open `ios/App/App.xcodeproj`, select the account owner's signing team, run on a device, archive, and upload to App Store Connect. Test on TestFlight. The build uses a Swift Package Manager dependency pinned to the same Capacitor version as the Android shell.
6. The companion Eidomancer store asset pack show the actual mobile layout. Personalized screenshots use sample text and an illustrative reading. Confirm status-bar and safe-area appearance and capture replacement screenshots on native devices as part of final QA if needed.
7. Set up merchant payments and Play Console Data safety, content rating, AI declaration and app access. On Apple, complete the Paid Apps Agreement, tax and banking details, privacy disclosures and age rating. Submit a signed release only after account ownership, pricing, and pilot results are confirmed. Qualifying new personal Play accounts need 12 testers opted in continuously for 14 days before applying for production access.

## Release acceptance

Measure time from first launch to understanding the three choices and time to a completed reading on real phones. Verify the target of 10 seconds to understand the app and 60 seconds to a meaningful reading. Verify that live readings recognize weak evidence, disagreeing examples, one-sided accounts and asymmetric downside, and that guidance remains actionable. Test consent, offline Daily Signal, backend failure and retry, flagged content, reporting persistence, and accessibility with VoiceOver and TalkBack. Use measured live usage to decide whether a paid download can cover recurring API costs. The starter service caps calls per IP and instance and resets its counters at restart. Use provider usage monitoring and a suitable production budget before offering paid downloads.
