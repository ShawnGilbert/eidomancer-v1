export const offer = Object.freeze({ cents: 499, currency: "usd", readings: 5, buyers: 10 });

export const purchaseTerms = [
  "One payment of $4.99 USD includes five personalized seven-layer readings. There is no subscription or automatic renewal. Daily Signal, the fictional sample, and Echo Journal are free.",
  "This pilot is invitation-only. Stripe hosts checkout. After verifying payment, we will email your access code to the address used at checkout within two business days (Monday–Friday, US Eastern time, excluding US federal holidays). Contact support if it has not arrived.",
  "Keep the access code private. Enter it again to recover your remaining readings in another browser. Only one browser is signed in at a time. Contact support from the email address used at checkout if you lose the code. Issuing a replacement invalidates the old code and sessions.",
  "Each completed personalized reading uses one of the five readings. A request that fails validation or generation does not use a reading. If a reading was charged but you could not retrieve it, contact support.",
  "Request a full refund within 14 calendar days of payment if you have used none of the five readings. If we cannot fulfill the purchase or deliver the remaining readings, contact support for a refund or other resolution. A refund closes access to the refunded purchase. Applicable consumer rights still apply.",
  "Readings are for personal reflection. They offer interpretations and possibilities and should not replace professional advice. Temporary pauses can occur when the reading service reaches capacity.",
];

export const privacyTerms = [
  "When you choose to request a reading, Eidomancer sends your submitted question to OpenAI to check it and generate a reading. Leave out identifying or sensitive information. You can withdraw permission for future requests in Privacy & support.",
  "Echo Journal is opt-in. Saved questions, readings and Revisit the Pattern observations stay in this browser. You can delete individual entries or clear the journal. Browser storage has no separate journal encryption and may be cleared by the browser or someone with device access. Purchase recovery does not recover the journal.",
  "To let you retry a completed request without spending another reading, Eidomancer stores the generated response encrypted for up to 24 hours of retrieval. It stores a protected fingerprint of the request and usage records for fulfillment, abuse prevention and reconciliation. Older encrypted responses are purged while the service runs. Protected operational backups can temporarily contain encrypted copies.",
  "Stripe processes payment details and provides the checkout email and payment status for fulfillment and support. Eidomancer stores payment references, a protected email fingerprint, allowance records, and hashed credentials. The support mailbox processes messages you send, including access delivery and recovery.",
  "Eidomancer uses a session cookie for access and temporarily processes connection information to prevent abuse. Its hosting and payment providers process data needed to provide their services. Contact support for privacy requests and purchase help.",
];
