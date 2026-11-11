# Eidomancer mobile launch

## Product and canon

Daily Signal opens on device with 52 curated readings and a separate prompt for reflection. Ask Eidomancer and Reveal the Pattern offer an evocative title, an image in words, and a concise reading. The deeper view shows seven layers, exact excerpts from the submitted account, and what might change the interpretation.

The Lens applies the November 11 [Situated Valuation amendment](../../docs/canon/SITUATED_VALUATION.md) and the evidence and symbolism rules in [Canon v0.3](https://github.com/ShawnGilbert/eidomancer-v1/blob/eidomancer-recovery/EIDOMANCER_CANON_V0.3.md). The amendment's revealed-pattern rule gives recurring conduct evidentiary weight while preserving uncertainty. The model returns analysis and imagery in separate fields. The server rejects unsupported quotations and recurring classifications with fewer than two conduct excerpts. Semantic accuracy still requires evaluation. The existing web app uses its existing entry point and reading routes.

## Store listing draft

| Field | Proposed copy |
| --- | --- |
| Title | Eidomancer: Daily Reflection |
| Apple subtitle | Personal readings & patterns |
| Google short description | Daily guidance and personal AI readings for decisions, relationships and habits. |
| Apple keywords | daily,guidance,journal,insight,relationships,self discovery,decisions,reflection,habits |
| Primary category | Lifestyle |
| Business model | One-time paid download, pending owner approval of price and reading allowance |

**Description**

Begin with a Daily Signal, a short reflection and a question worth carrying into the day. When a decision feels tangled, ask Eidomancer. When the same situation keeps playing out, Reveal the Pattern helps you see what repeats, what breaks the pattern, and what you could try next.

Open a reading for an evocative image and a practical next step. Explore seven layers to see how the interpretation relates to what you reported, what you value, and which outcomes would cost you most.

Daily Signal works offline. Personalized readings use OpenAI with your permission and require internet access. No Eidomancer account is required. The approved included reading allowance and limits must be stated here and in the app before submission.

**App Review and beta notes**

Explain that Eidomancer works as an offline daily reflection and a personalized decision lens. Its pattern view surfaces evidence and exceptions, and offers a reversible test. For example, enter “Twice I covered a shift before checking my schedule and then had to cancel plans. When I checked first I kept my plans. I still want to help coworkers.” Accept the first-use disclosure, open the deeper layers, and locate the report action. Verify App Review can exercise this flow with its real store environment before submission. A draft reviewer instruction cannot substitute for an available review entitlement.

Use four Google Play 9:16 screenshots and the supported 6.9-inch iPhone portrait format. Refresh the Phase 1 images to show the new disclosure and expanded evidence view from current device builds. Include Play's feature graphic, both store icons, and the privacy and support URL.

## Store access and cost

The paid reading API uses Google Play's app licensing response and Apple's StoreKit AppTransaction and App Attest. On Play, the server verifies the RSA signature, nonce, app package, version, timestamp and license expiry. On Apple, it verifies the signed transaction against Apple's roots and an App Attest proof bound to the challenge and transaction. The Apple environment must match. Challenges expire in two minutes and are consumed on use. A session lasts at most 24 hours. The store's stable purchase identity is HMAC-protected before storage. One purchase shares its allowance across reinstalls and devices of the same platform. The fourth active device replaces the least recently verified session. An installed copy from a different store needs that store's entitlement.

The proposed defaults are 250 delivered personalized readings per purchase, five attempts per UTC day per purchase and three attempts per UTC day per installation. A rejected or failed reading restores its lifetime reservation while keeping the daily attempt charge. A process interruption or a lost response may leave a reserved reading counted. A global daily attempt limit and IP throttling provide additional controls. Persistent SQLite stores quotas and session state. Use one Render instance with a mounted disk and back up the database and entitlement key together. A copied session token can share an installation's allowance until expiry. Renewed verification proves store access again. Confirm refund and revocation behavior on both stores before charging customers, especially Apple cached AppTransactions. Do not describe App Attest or receipt verification as proof of current refund status.

### Price sensitivity

Illustrative U.S. revenue, using 15% and 30% fee scenarios before sales tax effects, refunds, support, and hosting. Actual commission depends on storefront and program enrollment. At the published GPT-4.1 mini rate, a reading with 1,600 input and 600 output tokens costs about $0.0016 in generation. A stress scenario of 2,200 input and 1,050 output tokens is $0.00256. Recheck model availability and pricing before beta because the model page lists GPT-4.1 mini as deprecated.

| Price | After 15% | After 30% | Generation for 250 reads, typical to stress |
| --- | ---: | ---: | ---: |
| $2.99 | $2.54 | $2.09 | $0.40–$0.64 |
| $4.99 | $4.24 | $3.49 | $0.40–$0.64 |

At a 30% fee and stress usage, $2.99 leaves about $1.45 and $4.99 about $2.85 per sale for hosting, refunds, support, and account fees. At 50 sales per month, each $10 of monthly fixed cost consumes $0.20 per sale. Neither margin is validated without real reading costs and sales. Include failures and abuse in operating projections. Start beta with the paid-download design. $4.99 gives more room for low volume and support. $2.99 is plausible if the paid-download conversion improvement and operating margin hold. Free entry could lower the discovery barrier and paid packs could match revenue to usage, with additional purchase flows and restoration work. It is a follow-on experiment requiring owner approval.

Sources: [OpenAI pricing](https://developers.openai.com/api/docs/pricing), [Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/), [Google Play service fees](https://support.google.com/googleplay/android-developer/answer/112622), [Play licensing](https://developer.android.com/google/play/licensing/licensing-reference), [Apple AppTransaction](https://developer.apple.com/documentation/storekit/apptransaction), [Apple App Attest](https://developer.apple.com/documentation/devicecheck/validating-apps-that-connect-to-your-server).

## Render deployment and live verification

1. Use Node 24 and the existing mobile branch. Build with `npm ci && npm run mobile:test && npm run mobile:build`. Start with `npm run mobile:serve` and set the health path to `/health`. Use a dedicated service in the existing Render workspace. The server defaults to requiring store verification and fails startup with missing settings. The loopback-only local mode is for fixtures or authorized synthetic evaluations and is rejected on Render.
2. Use `mobile/server.env.example` as the field list. Set a project-scoped OpenAI key, separate random 32-byte hexadecimal report and entitlement keys, a support email, trusted proxy hops, and database and reports paths under a persistent mount. Upload Apple public root certificates obtained from [Apple PKI](https://www.apple.com/certificateauthority/) and list their mounted paths in `MOBILE_APPLE_ROOT_FILES`. Enter the Apple Team ID, numeric App Store app ID, Play licensing public key, and accepted Android version codes. Preserve the entitlement key with the database across releases. Keep keys and stores out of the public repository.
3. Use the isolated sandbox database and endpoint for TestFlight and signed Play closed-test builds. Keep production credentials, app transactions, and quotas separate. Never point a production build at a sandbox service. Check signed App Store proofs and license-test behavior on actual devices.
4. After the owner approves API spend, run `node mobile/evaluation/run.js --live` against an approved project key. This sends six synthetic cases through the same generation and moderation function as the API. Review each output against its rubric, including the paired housing cases, one-off evidence, the work-duty exception, and the prompt-injection case. Record end-to-end latency on real phones, model token usage, results rejected by grounding, and generation costs. Choose the supported model and cap only after measurements.
5. Validate `/health`, `/privacy`, first use and revoked permission, report storage, allowance exhaustion, store restoration after reinstall, two devices sharing one purchase, refunds, expiry, and unauthorized and tampered proof. Establish report retention and operational privacy handling. No live readings or provider payments are required for CI.

## Signing and owner handoff

- Android uses JDK 21 and Android SDK 36. Run `VITE_MOBILE_API_ORIGIN=https://YOUR-HOST npm run mobile:sync`. Use the upload key registered with Play App Signing. Set `EIDOMANCER_UPLOAD_STORE`, `EIDOMANCER_UPLOAD_PASSWORD`, `EIDOMANCER_UPLOAD_ALIAS`, and `EIDOMANCER_UPLOAD_KEY_PASSWORD` in the signing environment and run `./gradlew bundleRelease` in `android`. Increment version code before a new upload and add it to the server allowlist. Upload to the approved internal or closed track. Qualifying new personal accounts need 12 testers opted in continuously for 14 days before applying for production access.
- On macOS use Xcode 26 or later and open `ios/App/App.xcodeproj`. Use the account owner's team, a provisioning profile with App Attest, and the existing bundle ID. Sync against the approved beta endpoint and archive for TestFlight. Verify on a physical iPhone. Sync against production and create a separate signed archive for submission after approval. Confirm App Review access, including any sandbox behavior, before submission.
- The owner provides Render access and approves any persistent disk or hosting charges, supplies the scoped OpenAI secret and approves the live evaluation budget, grants store access and signs legal agreements, and configures banking and taxes. The owner approves pricing, included reading limits, territories, final screenshots, privacy policy, Play Data safety, age and content ratings, and Apple App Privacy. Review disclosures for submitted text, store and installation identifiers, usage, reports, and infrastructure retention. Submit and publish only after explicit approval.
