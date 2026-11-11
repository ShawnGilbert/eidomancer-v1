# Eidomancer Android launch audit

November 11, 2026 · `mobile/store-mvp` · Draft PR #1

> This audit captures the prior options. See [Android reading packs](./ANDROID_READING_PACK_PLAN.md) for the chosen free-install direction, current spending guard and launch materials.

## Product slice

Echo Journal uses a familiar save-and-revisit interaction from products such as Labyrinthos. Eidomancer pairs an original interpretation with later observations and asks what held up, what contradicted it, and what would change the reader's mind. The submitted account and all seven layers remain available in the saved original. Journal actions are local, including the act of revisiting. Daily Signal still uses curated local content. [Labyrinthos journal](https://app.labyrinthos.co/)

## Android release gates

| Gate | Branch evidence and remaining work |
| --- | --- |
| Account and test track | Play Console account type, verification, production eligibility and merchant setup are unverified. Confirm them in the owner's account. A new full-distribution Play Console account carries a one-time $25 registration fee. Qualifying personal accounts created after November 13, 2023 need at least 12 testers opted in continuously for 14 days before applying for production access. Start the closed-test clock once a functional build is available. |
| Bundle and signing | Package is `com.eidomancer.app`, target SDK is 36, and version code is 1. Confirm package availability and the last uploaded version code. Use a higher version code if one is already uploaded and update the server allowlist. Generate a signed release AAB with the authorized upload key and configure Play App Signing. Check the release artifact for native libraries and test 16 KB compatibility, install, offline launch and update on Android. |
| Listing and disclosures | Refresh phone screenshots with Daily Signal, the first card, expanded layers and the local revisit flow. Use a brief demo and existing owned channels once approved. Set up App access, content rating, target audience, privacy URL and Data safety before closed distribution. Disclose the actual handling of submitted questions, provider processing, reports, IP and entitlement identifiers. Local notes never enter the API. Confirm retention and deletion handling with the eventual host before filing. |
| AI reporting | The app has in-app reporting, moderation, and a server report store. Verify report delivery and durable storage through the signed release path, then assign a report reviewer and response process. |
| Backend | Use an approved isolated HTTPS endpoint with persistent SQLite and reports. Verify mount and recovery, entitlement expiry and reinstallation, failure behavior, and actual device latency. Production startup currently requires both Android and Apple verifier settings. An Android-only rollout needs explicit per-platform configuration that rejects disabled platforms, or the real Apple settings, before deployment. |

Sources: [Play registration](https://support.google.com/googleplay/android-developer/answer/6112435), [closed testing](https://support.google.com/googleplay/android-developer/answer/14151465), [target SDK](https://support.google.com/googleplay/android-developer/answer/11926878), [16 KB page sizes](https://developer.android.com/guide/practices/page-sizes), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [AI-generated content](https://support.google.com/googleplay/android-developer/answer/13985936).

## Billing options

| Model | Implementation and verification |
| --- | --- |
| Paid download with a finite reading allowance | The branch verifies a signed Play app license and ties quotas to the license holder. Play Store handles the initial purchase. There is no in-app checkout. Prove purchase, install, reinstall, refund and revocation behavior with Play-installed test builds. Set up the merchant payments profile and make the allowance clear on the listing. Internal-test paid-app installs can be free, so they verify access and usability, not willingness to pay. |
| Free entry plus one finite reading pack | The preferred discovery experiment in the Echo & Commerce brief. The branch has neither BillingClient nor a verified pack ledger. Use a supported Billing Library version, a Play one-time consumable, and a server-controlled buyer identity and balance. Verify package, product, purchase state and purchase token on the server. Grant once per verified token in a transaction, consume after granting and retry consumption without granting again. Reconcile refunds and revocations, restore unspent balances across installs, and limit introductory credits against abuse. Test success, pending, cancellation, duplicate token, failed consume, reinstall and refunds before public purchase. |

Paid download is the shorter checkout path if the owner chooses speed and the package is eligible. A free listing removes the purchase barrier to discovery and requires the pack work above before a customer can pay. Google Play requires a new package to switch a previously free app to a paid download. Confirm the launch model before publishing the listing. Paid pricing and pack size remain owner decisions.

Sources: [Play pricing and free-to-paid restriction](https://support.google.com/googleplay/android-developer/answer/6334373), [payments profile](https://support.google.com/googleplay/android-developer/answer/3092739), [test-track payment behavior](https://support.google.com/googleplay/android-developer/answer/9845334), [Billing Library support](https://developer.android.com/google/play/billing/deprecation-faq), [purchase security](https://developer.android.com/google/play/billing/security), [consumable lifecycle](https://developer.android.com/google/play/billing/lifecycle/one-time).

## Cost controls and proposed pilot budget

The branch already limits input to 1,800 characters and output to 1,050 completion tokens, disables automatic provider retries, and gates requests by IP, concurrent request count and entitlement counters. Licensed mode persists install and purchaser daily quotas and the global daily limit. Defaults allow 3 install attempts, 5 purchaser attempts and 400 global attempts per day. Failed readings return a lifetime credit but still count toward daily controls. Usage is logged as model and token counts. There is no application-level monthly dollar ceiling.

The second live batch averaged about $0.00123 per completion in estimated generation cost, including the completions the parser rejected. At the earlier stress estimate of $0.00256 per attempt, 400 attempts per day could model roughly $31.74 over 31 days. These figures exclude hosting and assume the same model and pricing. The current default model is listed as deprecated, so confirm an available model and its prices before enabling live traffic.

Proposed pilot, subject to authorization: **$45 first-month ceiling before tax**, made up of $25 registration if needed, at most $15 for isolated hosting with durable storage, and **$5 per month in API usage**. Verify hosting prices and capacity before purchase. Set the global daily ceiling to 30 for the pilot. At the stated stress rate that models about $2.38 over 31 days, with room for longer requests. Implement a persistent app-side monthly reservation against a conservative model-price and token bound, reserve before calling, settle from returned usage, and retain the conservative debit on ambiguous timeouts. Use a dedicated key restricted to approved endpoints and models. Enable the provider's enforced project spend limit if available and monitor usage. Alerts alone allow requests to continue and provider enforcement can lag.

Sources: [OpenAI model and rates](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [project spend limits](https://help.openai.com/en/articles/9186755-managing-your-work-in-the-api-platform), [Render disk requirements](https://render.com/docs/disks).

## Shortest credible route to one paying customer

1. Verify the Play account and choose the initial sale model. Recruit qualified Android testers from people interested in reflective decision tools, including the existing creator audience where relevant. Aim for enough opted-in testers to cover the applicable closed-test requirement.
2. Get the signed build and isolated backend through the test track. Observe whether people finish a reading, save it, and return with an observation. Ask whether they would pay a stated price for a finite allowance. Treat stated willingness as a signal, and actual checkout as the conversion measure.
3. After testing and owner approval, release to a narrow initial market with one price and allowance or one verified pack. Show the journey in a short listing demo. Share it through an owned channel with a direct store link. Measure impressions, installs, completed readings, revisits and purchases in aggregate. Keep journal content out of measurement.
4. Count a first customer when Play records a genuine paid transaction and the buyer receives their entitlement. Reconcile refunds before judging revenue. Store search is a possible acquisition channel. Repeat use and paid demand remain unmeasured.

Follow the Thread and paid retrospective comparison remain later product slices. No live spending, purchases, store submissions, publishing or deployment were performed for this audit.
