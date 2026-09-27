# Step 3E — frozen controlled direct-baseline comparison

Protocol frozen before any Step 3E intelligence call. Parent checkpoint: `f349f37b602f8eb5e6a6ad1abba0e391c14d4c80`. No Step 3C-M output is a prompt, exemplar, or target.

## Methodological note

Both arms intentionally use the same structured candidate output contract. Therefore this experiment tests the added value of Eidomancer's constrained branch/state/evaluation structure, not the value of structured output formatting versus ordinary prose prompting.

## Premise (verbatim in both arms)

> In this fictional village, a person can privately recall an interpersonal exchange through at most three subsequent interpersonal exchanges. After that, its details cannot be privately recalled. The village has one communal inscription room. Each resident may enter it once per day for at most ten minutes. Writing made in that room persists and can be read on later visits. No other durable records exist. Explore consequences under these rules; do not silently change them.

The three-exchange private-recall ceiling is R0, mechanically enforced by Eidomancer. The room-access and no-other-durable-records restrictions are declared narrative rules; this engine cannot mechanically check them. Both arms' critiques must check them.

## Neutral aims (verbatim in both arms)

1. Coordination: “Explore a consequence of people coordinating an activity across repeated exchanges.”
2. Failure: “Explore a possible failure of a shared arrangement and what follows from it.”

Neither aim may be changed after any response. Both aims are disclosed to both arms. No desired consequence or previous memory-village result is provided.

## Invocation and order

Use GPT-5.6 Sol through the same user-mediated interface throughout, with caller-reported model/provider identification unless independently verifiable. If unavailable, stop and record the deviation before either arm; never substitute silently. Use fresh context for each generation and evaluation call. Run direct first: coordination generation, failure generation, coordination critique, failure critique. Then Eidomancer: coordination generation, failure generation, coordination captured evaluation, failure captured evaluation. Give each arm two generation and two critique/evaluation calls, no retries, replacements, rescue calls, or compensating calls. Aim for at most approximately 450 words of substantive description per generation response and 250 words per critique. Record actual usage or unknown.

Generation calls receive the full premise, both aims, the currently applicable aim, and the same output contract: return only one JSON object with `description` (nonempty substantive narrative), `private_recall_after_exchanges` (nonnegative integer), and `external_inscription_available` (boolean). Direct calls receive those facts as ordinary text; Eidomancer calls receive the corresponding resolved records and branch intent in the canonical request envelope. Record exact visible text and adapter-boundary bytes. Any separate interface instruction to produce JSON is identical and recorded verbatim for both arms; it is not claimed as provider transport evidence.

Evaluation calls receive the full premise, both aims, the applicable aim, the corresponding candidate, and these same criteria: assess constraint coherence (R0 and room restrictions separately), causal depth, non-obvious consequences not supplied by premise, substantive branch diversity rather than paraphrase, internal consistency, and usefulness as descendant material. Return only JSON with `verdict` (`retain`, `limited`, `reject`, or `retain_negative_finding`), `rationale`, `uncertainty`, `limitations` (array of strings), and `judgment`. Address evidence, weaknesses, and counterexamples qualitatively; no aggregate score. Preserve exact visible evaluator submission and returned content. Compare substantive results blindly if practical; inspect provenance/recoverability separately afterward.

## Classification and integrity

Positive: Eidomancer produces at least one defensible consequential discovery or useful negative boundary absent from direct exploration, without comparable coherence loss. Negative: direct reaches the same or better substantive territory with equal or less effort, or Eidomancer branches mainly paraphrase one another. Ambiguous: territory is similar, subjective judgment dominates, or asymmetry prevents meaningful comparison. One paired run is diagnostic, not general evidence of superiority or inferiority.

No modification of world rules, aims, evaluation dimensions, budgets, or run order after responses. Record deviations without compensating. Make a Crystal only if the frozen retention procedure warrants one. Preserve exact submissions and outputs where visible, model status, call order and resource estimates, direct transcript, Eidomancer responses/extractions/evaluations/audits, any Crystal, and deviations as new Step 3E artifacts. Preserve historical Step 3C-M evidence unchanged. After execution, prepare blinded Output Sets X and Y and store the mapping separately; do not classify or reveal it before external blind review.
