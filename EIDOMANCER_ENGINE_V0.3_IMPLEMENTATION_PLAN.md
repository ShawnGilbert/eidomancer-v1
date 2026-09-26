# Eidomancer v0.3 — Minimum Engine Architecture & Implementation Plan

**Status:** Step 3A implementation plan only; no engine code exists by virtue of this document.  
**Source baseline:** recovered Git HEAD `2221d82c1984507d0c28c974a8adce8f0fcfc5da`, with `EIDOMANCER_CANON_V0.3.md` and `EIDOMANCER_CRYSTAL_SPEC_V0.1.md` as the only new documentation.  
**Authority:** those two approved specifications; v0.2 canon, agent protocol/API/CLI, tests, and frozen A/B evaluations remain intact.  
**MVP scope:** one local, explicit fictional exploration capable of making and extending real v0.1 Crystals. No new public endpoint, UI, artifact generator, or automatic Lens invocation in the first slice.

## 1. Proposed architecture and boundaries

```text
User / local caller
  → Exploration session (budgets, operations, branch state)
       ↔ injected external-intelligence adapter (semantic generation/judgment)
       → immutable object store + Crystal validator/retriever
  → optional later handoff: existing Eidomancer Lens → presentation → artifact
```

The Environment owns seed and World state, constraints, operation log, branching, budget accounting, mechanical validation, provenance, immutable records, evaluation procedure declaration, pruning, crystallization, and reference-closure retrieval. It must not generate semantic successors under the label of external intelligence. The injected adapter supplies candidates or judgments and returns a precisely captured response. It may be a local harness driven by a human/agent for initial execution; a test fake is labeled as a fake and cannot establish AI quality. The existing `src/lib/agentProtocolV02.js`, `src/lib/eidomancerCanon.js`, `server.js`, and CLI are neither modified nor called by the engine MVP. A future typed handoff can pass a verified Crystal to the Lens as context without redefining the Lens.

Keep the exploration API **internal and local** in this phase. One programmatic session runner and a small example runner can exercise it; avoid adding `/api/v3`, credential management, provider SDK coupling, or altering default v0.1/v0.2 selection. This preserves the Operating Envelope: a useful Crystal does not imply every task needs symbolic compression or finished media.

## 2. Exact proposed new files and responsibilities

All paths are proposed additions only; none are created by this plan.

| New path | Responsibility |
| --- | --- |
| `src/lib/exploration/canonicalJson.js` | Strict JSON validation, NFC and duplicate-key rejection, RFC 8785 JCS bytes, SHA-256 IDs for records and Crystals. |
| `src/lib/exploration/recordSchemas.js` | v0.1 generic immutable-record envelope and per-kind payload shape checks; typed Ref construction and claim-class checks. |
| `src/lib/exploration/objectStore.js` | Atomic write-once local object store, read and hash verification, no silent overwrite, explicit missing/corrupt diagnostics. |
| `src/lib/exploration/crystalValidator.js` | Full Crystal Spec v0.1 payload validation, semantic invariants, required-reference closure, lineage/merge checks, and retrieval status. |
| `src/lib/exploration/intelligenceAdapter.js` | Interface and runtime checks for injected `generateSuccessors` and optional `judge`; no provider implementation or hidden fallback. |
| `src/lib/exploration/session.js` | Bounded state machine: seed, displace, fork, evolve, evaluate, prune, crystallize, retrieve, extend; persist immutable operation and audit records. |
| `src/lib/exploration/index.js` | Small explicit local entry point exporting session creation and exact-ID retrieval, without importing existing v0.2 modules. |
| `examples/exploration-memory-village.js` | Executable fictional two-branch fixture driven by an explicitly labeled test adapter; produces a Crystal and a descendant in a disposable store. |
| `test/explorationCanonical.test.js` | Canonical bytes, deterministic identities, malformed input, tampering. |
| `test/explorationRecords.test.js` | Record kinds, provenance, constraints, pruning, cracks, append-only lineage. |
| `test/explorationCrystal.test.js` | Crystal schema/hash, closure statuses, retrieval, extension, end-to-end memory village. |

No existing source or test file changes are planned. Run the existing `npm run test:agent` and `npm run build` as non-regression gates. A separate test invocation such as `node --test test/exploration*.test.js` avoids changing `package.json`; if a script is later wanted, review it separately. The example runner is a test harness, not a claimed production AI integration.

## 3. Minimum immutable record system

Use one generic envelope and one content-addressing algorithm for all MVP non-Crystal records, with kind-specific validated payloads. This avoids one module and storage table per named kind while retaining exact typed identities. The closed set of MVP kinds is:

```text
seed, constraint, rule_set, world_state, operation, transition,
intelligence_response, evaluation_procedure, evaluation_record,
branch_audit, crack_record
```

`crystal` uses the separate approved Crystal Spec envelope and hash. The `constraint` record is used for auditable mechanical/semantic declarations even though the Crystal embeds constraint summaries. `rule_set` may contain a finite declared rule plus references to constraints, not a universal Ruliad. `operation` covers displacement and fork operations with a typed `operation_type`. `transition` links exact predecessor and successor World states. `branch_audit` preserves status and pruning reasons. `crack_record` preserves unresolved inconsistency. The seed supplies `lineage.origin`.

| Named Crystal Spec kind | MVP treatment |
| --- | --- |
| `world_state`, `rule_set`, `constraint`, `seed`, `operation`, `transition`, `branch_audit`, `evaluation_procedure`, `evaluation_record`, `crack_record`, `intelligence_response` | Required as typed payload variants in one generic record envelope and store. |
| `exploration_trace` | Optional generic record; only required if its absence would make a transition or pruning decision unauditable. The MVP's granular operations and audits should make a complete raw trace unnecessary for extension. |
| `topology`, `bridge` | Optional, deferred as independent payload variants. The memory village's conceptual relations are described in states/constraints; no Soliadic metric, topology algorithm, or bridge operation is asserted. A future bridge can be an `operation` only as a versioned compatibility placeholder, not a claim that the full Bridge primitive has been implemented. |
| `captured_source` | Deferred for empirical `real_model` work. MVP refuses external empirical claims lacking captured-source records; the fictional fixture does not require one. |
| `reconciliation` | Deferred until multiple-parent Crystal merges; validator rejects such a merge without a verifiable reconciliation record rather than inventing one. |
| `core_cast`, `artifact` | Optional downstream references, outside MVP. |

The MVP supports *single-parent* extension and a **multi-branch** Crystal, which are not a multiple-parent merge. A generic record envelope can later accept `topology`, `bridge`, `captured_source`, and `reconciliation` through explicitly versioned kind schemas. Do not claim complete closure for a Crystal referencing an unsupported kind.

### 3.1 Generic envelope and common fields

```text
RecordEnvelope = {id: "record:sha256:<64 lowercase hex>", payload: RecordPayload}
RecordPayload = {
  schema_version: "eidomancer.record.schema.v0.1",
  canonicalization_version: "eidomancer.jcs.v1",
  kind: MVPKind,
  body: KindSpecificBody,
  provenance: {actor_role, provider, model_or_version,
               identification_status, input_refs: [Ref], operation_ref?},
  claim_class: ClaimClass,
  refs: [Ref]
}
```

The record ID covers `kind`, version, body, provenance, claim class, and refs. `refs` is the complete sorted/deduplicated set of typed external references appearing in the body or provenance. Internal branch-local labels are allowed only when their meaning and resolution are recorded. `Actor` fields may say `unknown`, never a guessed provider. The environment's operation record and the intelligence's exact-response record are different objects; the former cannot claim the latter's reasoning as its own. All records are write-once. Exact bytes of an external response and a digest are stored in the `intelligence_response` body; no reformatting, selective quotation, or normalization substitutes for the original response. Structured candidate extraction is a distinct operation referencing those bytes. For text responses, capture the actual UTF-8 bytes as base64 text plus a SHA-256 digest and content type; the normalized candidate remains separate. Any secret/credential redaction must occur before submission with its scope recorded; the engine must not silently redact a supposedly exact response.

### 3.2 Minimum kind-specific bodies

| Kind | Required body fields / invariants |
| --- | --- |
| `seed` | Purpose, `fictional` mode, initial state description, initial constraint refs, declared scope, budgets and stop conditions. No empirical authority. |
| `constraint` | Statement, scope, hard/soft, check mode `mechanical`/`intelligence_judgment`/`unverified`, and either a named versioned predicate plus parameters or explicit nonmechanical instruction. A hard mechanical predicate cannot be a free-text claim. |
| `rule_set` | Rule version/description, allowed transition operation names, constraint refs, declared World mode. No claim to enumerate all possible rules. |
| `world_state` | Seed ref, rule-set ref, inherited constraint refs, branch-local state description, structured testable facts, creator-operation and intelligence-response refs when present, claim classes of generated facts. The initial state may have no creator operation. The state does not reference its later transition record. |
| `operation` | Type `displacement`/`fork`/`candidate_selection`/`crystallization`/`extension`, input refs, declared changes, invariants, actor and budget debit. Results live in later transition/audit records. A displacement creates a successor rule/constraint/state; never edits a parent. |
| `transition` | From state ref, optional to-state ref for an accepted successor, rule/operation refs, intelligence-response ref if semantic generation was used, outcome of each mechanical check, unchecked judgments, limitations. A rejected candidate has no valid successor World state and records the attempted candidate via its response/operation refs. |
| `intelligence_response` | Request bytes/content type, response bytes/content type, provider/model identification, caller-assigned request ID, observed usage if supplied, failure/partial status. Preserve exact response bytes and the structured extraction provenance. |
| `evaluation_procedure` | Versioned criteria, comparator/baseline, checkable versus judgment criteria, declared decision procedure, evaluator role, uncertainty/abstention handling. No implicit numerical utility threshold. |
| `evaluation_record` | Target branch/state refs, procedure ref, results per criterion, evaluator response ref if applicable, uncertainty, limitations, verdict, rationale. It is append-only; revisions cite the earlier record. |
| `branch_audit` | Branch ID, seed/parent state, fork/displacement/transition refs, status, evaluation ref, pruning/rejection reason and crack refs. New status is a new audit record; old decisions remain addressable. |
| `crack_record` | Kind, conflicting claim/ref IDs, statement, status `open`, candidate explanations, effect on evaluation, reporter provenance. Resolution later creates a separate record. |

**Acyclicity rule:** content-addressed objects cannot contain each other's as-yet-unknown IDs. Create constraints first, then a seed referencing them, then a rule set and initial state; fork operation references that state; intelligence response references the request inputs; accepted successor `world_state` refers to its creator operation and intelligence response, while `transition` references both states and does not appear inside the successor state. A rejected candidate has an attempted transition but no successor state. Evaluation and branch audit follow; Crystal references them. Avoid storing result refs in an earlier operation if doing so would form a cycle. `operation` records only inputs and declared intent, with outcome in later transition/audit. The validator rejects cycles in required closure and Crystal parent lineage.

## 4. Canonicalization and content addressing

Use exactly the Crystal Spec's `eidomancer.jcs.v1` restrictions for **both** Crystal and MVP records: reject duplicate keys, non-NFC strings, null, floats, NaN/Infinity, byte strings, unpaired surrogates, unknown schema fields; UTF-8 RFC 8785 JCS bytes. IDs and hashes are computed from payload bytes only; the envelope ID and storage metadata are excluded. Record ID is `record:sha256:` + lowercase `SHA-256(JCS(RecordPayload))`; Crystal ID remains `crystal:sha256:` + lowercase `SHA-256(JCS(CrystalPayload))`. The payload includes kind and schema/canonicalization versions to prevent cross-kind identity confusion. IDs are verified on every read.

For records, `refs` is sorted by the JCS bytes of each typed Ref and deduplicated; order of other arrays is semantic. The Crystal Spec's required/optional reference and parent sorting rules remain authoritative. The same payload on repeated writes yields the same ID and is accepted idempotently **only if canonical bytes are identical**; an existing path with different bytes is integrity failure. A change to a claim, evaluation, reference or limitation yields a new record/Crystal. Hashes establish byte identity, not truth. Store the exact response bytes in the record's canonical base64 field so a hash verifies them; extraction and evaluation are independently attributable.

Implementation should use a known conforming JCS implementation or a small audited wrapper with cross-runtime test vectors; ordinary `JSON.stringify` alone is not sufficient. The plan assumes no new dependency until its exact JCS conformance and license are reviewed. Parsing must detect duplicate keys before a normal JavaScript parser discards them. Inputs can be Python/JS objects internally, but a byte-import path still validates duplicate keys and canonical reserialization.

## 5. Persistence and reference closure

Use a local filesystem object store under a caller-provided directory, outside the Git worktree by default. Partition by type and hash prefix, e.g. `objects/record/ab/<hash>.json` and `objects/crystal/cd/<hash>.json`. Write a temporary file, flush, and atomically rename without replacing an existing object; verify bytes after write. Storage path is a lookup detail, never part of identity. The store exposes `putImmutable`, `getVerified`, and `walkRequiredClosure` with exact typed refs. No mutable SQLite index is needed to retrieve by ID in MVP. A disposable catalog of root Crystal IDs may be maintained separately but cannot alter payloads; search is deferred.

`walkRequiredClosure` verifies the Crystal hash, Crystal schema, each required Ref's kind/version/hash, and recursively required `refs` for generic records, with cycle detection and bounded traversal. Distinguish `complete`, `incomplete_expected` (an explicitly recorded expected missing ref and limitation), `integrity_error` (unexpected missing/corrupt/wrong type), and `unsupported_version`. Optional refs report availability without controlling completeness. This must also validate the Crystal's embedded `required_references` against refs discoverable in its payload and needed for audit/extension. For a pruned branch, the Crystal Spec's `BranchSummary.trace_ref` points to an immutable `branch_audit` record in MVP; a complete raw `exploration_trace` stays separate and optional. A record graph may include a parent Crystal, whose own closure is recursively verified. Retrieval by ID returns payload, diagnostics and a minimal closure map, without dumping raw traces.

The MVP does not need network storage, cloud sync, authentication, permissions, jobs, garbage collection, or broad search. Local file persistence is still **real persistence** across process restarts and suitable for the first Crystal. A test store uses a temporary directory; a user's configured directory persists. No source material or API key is written incidentally by logging.

## 6. External-intelligence adapter

The adapter is dependency-injected, with an explicit versioned request and response contract:

```text
generateSuccessors({seed_ref, current_state_ref, rule_set_ref, constraint_refs,
                    branch_id, declared_operation_ref, context_refs,
                    budget_remaining, request_id})
  → {raw_request_bytes, raw_response_bytes, provider, model,
     identification_status, usage?, candidates?, errors?}

judge?(same refs + procedure_ref + candidate_refs + request_id)
  → same provenance envelope + judgment
```

The Environment captures request/response records before accepting a parsed candidate. `candidates` are derived projections of the raw response; validation records the extraction method/version. If no adapter is provided for semantic evolution, the operation fails explicitly; no deterministic fallback is mislabeled AI. A manually supplied external-agent response may be accepted by an adapter that records that fact. Tests use deterministic fixtures only to verify plumbing and must say `provider: "fixture"`, `model: "scripted"`, and `identification_status: "test_double"`. Mechanical constraint results are Environment output; plausibility, novelty and meaning judgments are external intelligence or declared human evaluator output. An evaluator's response is likewise preserved if used.

## 7. Exploration state machine and minimum flow

The session is append-only and reconstructible from records. State transitions are explicitly commanded, not implicit stages required on every run:

| Operation | Preconditions | Record/result |
| --- | --- | --- |
| `seed` | Purpose, fictional mode, budgets and constraints declared | Seed, constraints, rule set, initial state. |
| `displace` | Existing rule/state; explicit change/invariants | New constraint/rule and operation; parent remains immutable. Optional on a given path. |
| `fork` | Live parent state; available branch budget | Two or more uniquely labeled branch intents/operations with parent refs. |
| `evolve` | Live branch and available call/time budget | Adapter call, exact response, selected candidate, new state, transition, check results; errors remain records. |
| `evaluate` | Candidate states, declared procedure and evaluator | Per-branch evaluation records, including uncertainty and negative findings. |
| `prune` | Evaluated branch or explicit mechanical violation | New audit record marking inactive with reason; no deletion; crack remains. |
| `crystallize` | Finite bounded region; at least one significant evaluated consequence; complete required refs, or explicit incomplete-expected status if intentionally permitted | Crystal v0.1 payload, hash, store; no automatic Core Cast or media. For the first success, require `complete`. |
| `retrieve` | Exact Crystal ID | Verify ID and required closure; report status and revisions if catalog has them. |
| `extend` | Retrieved `complete` Crystal and declared inheritance/change | New seed/operation/state/branch/evaluation and a distinct descendant Crystal with one parent; no raw-trace replay. |

Budgets are declared at seed; count external calls, branches and depth, and record observed usage where available. A timeout or exhausted budget yields a partial trace/audit result, never a claim that the search space is exhausted. A constraint marked `mechanical` runs a named, versioned predicate over structured facts. `intelligence_judgment` is recorded separately with evaluator provenance. An unresolved Crack can coexist with a limited retention verdict; the evaluator must state its effect. Pruned branches are omitted from active frontier only, retained in the store and summarized with `pruned`/`rejected` status. Crystal construction uses explicit summaries rather than copying the full trace.

**One-way evidence guard:** transformations preserve `observed_or_supplied`, `inferred`, `symbolized`, `declared_world_assumption`, `generated_candidate`, and `evaluation_judgment`. Fictional generated events remain model-scoped candidates. No operation accepts `symbolized` as a factual source for real-world inference. A prior Crystal is context, not independent confirmation. The MVP fixture stays fictional; `real_model` is rejected as unsupported until captured-source and domain evaluation contracts exist.

## 8. Validation strategy

Validation has distinct passes: (1) parse and canonicalize strict bytes; (2) kind/schema and typed-reference validation; (3) mechanical predicates with exact rule versions; (4) provenance/claim-class and one-way-flow checks; (5) branch, lineage and append-only operation checks; (6) Crystal semantic validation and closure traversal. The system records which pass produced each finding. An intelligence judgment is never reported as a mechanically checked invariant. Unknown predicates fail closed as `unsupported`, not `passed`.

Before write, ensure World states inherit or explicitly displace rules/constraints, transition input/output are coherent, branch IDs are unique, pruned/rejected branches have audit refs, crack summaries match immutable crack records, and evaluation summaries cite the exact procedure/record and limitations. For the first Crystal require a `retain` or `limited` verdict with `why_retained` and an evaluated consequence. Validate Crystal IDs and all refs after restart. For extension, check parent exact ID, inherited/changed declarations, new operation and evaluation, and absence of lineage cycles. Reject multiple-parent merge until reconciliation is implemented.

There is one specification ambiguity to resolve before coding: Crystal Spec §4 permits an explicitly unresolved expected required Ref and §8 calls retrieval `incomplete_expected`, while a *complete* Crystal requires closure. The MVP should allow storing an intentionally incomplete Crystal with conspicuous status, but only a `complete` Crystal can serve as the successful fixture or extension base. Also clarify whether an expected missing ID must still be a hash-valid known object (impossible if bytes never existed) or can be an externally declared expected content address; the proposed implementation treats it as a known expected address whose bytes are currently unavailable, with the limitation embedded in a crack or boundary text. This is a small interpretive decision, not a schema redesign.

## 9. Minimum test plan

| Proof | Focused test |
| --- | --- |
| Deterministic record identity and canonical serialization | Same record with reordered object members yields same canonical bytes/ID; altered semantic array order or field changes ID; reject duplicate keys, non-NFC strings, floats, unknown fields and bad hashes. Include independently computed JCS vectors. |
| Immutable lineage | Descendant references exact parent and changed constraints; parent bytes remain unchanged; wrong parent, cycle, undisclosed displacement, and unsupported multiple-parent merge fail. |
| Provenance preservation | Exact adapter request/response bytes survive store/restart; extracted candidate has source response ref; fixture is labeled `test_double`; mechanics and intelligence judgment remain distinct. |
| One-way evidence | Reject a `symbolized` claim promoted to `observed_or_supplied` or used as factual inference; fictional generated events stay model-scoped; prior Crystal cannot self-corroborate. |
| Pruning without deletion | Pruned branch disappears from active frontier but its transition, evaluation, reason, and branch-audit refs still verify after restart. |
| Crack preservation | Deliberate fourth-exchange recall violates hard rule, creates open crack, remains in Crystal summary and detailed record; cannot be silently resolved. |
| Complete vs incomplete closure | All refs present gives `complete`; expected missing ref gives `incomplete_expected`; unannounced missing/corrupt/wrong-kind ref gives `integrity_error`; unsupported version is distinct. |
| Crystal hash and retrieval | Recompute exact ID from canonical payload; tampering fails; retrieve by ID after process restart with verified recursive closure. |
| Legitimate extension | New seed/operation inherits parent assumptions, changes one rule, obtains new intelligence response and evaluation, creates a new ID; no original raw-trace reconstruction. |
| v0.2 non-regression | Run unmodified `npm run test:agent` and `npm run build`; compare the existing Turnstile regression, strict-AI, default v0.1, and presentation authority tests. Frozen A/B evidence is read-only and not rewritten. |

No tests should mirror an implementation line by line. The end-to-end fixture below is the main behavior proof; small unit tests focus on irreversible data-integrity risks.

## 10. End-to-end fictional memory-village fixture

The seed asks how a village maintains obligations when private memory decays after three exchanges. Hard mechanical constraints: `private_memory_exchanges <= 3` and persistent public inscriptions. Structured state has a `private_recall_after_exchanges` field and an `external_inscription_available` boolean so at least one rule can be checked mechanically; the narrative consequence is judged separately. Create initial state `V0`, rule set `R0`, and two forked intents:

1. **B1 — public ledger:** under unchanged memory rule, a scripted external-intelligence response proposes recording obligations publicly; successor `V1` satisfies the hard check. Evaluation finds a coherent but contested authority structure.
2. **B2 — unaccounted recall:** the independently recorded response claims private recall at exchange four under unchanged `R0`; mechanical check fails. Preserve the raw response, rejected candidate, transition attempt, evaluation, open fictional-inconsistency Crack, and branch audit; prune B2 from active frontier without deleting any record.

Crystallize a bounded region anchored to `V0` and `V1`, with B1 retained and B2 explicitly pruned. Embed purpose, assumptions, constraints, significant public-ledger consequence, branch relation, open Crack and its effect, evaluation limitations and why retained. Reference exact seed, rules, states, operations, responses, procedure, evaluations, branch audits and crack; keep the raw exhaustive trace optional. Compute actual Crystal ID, store, restart, retrieve `complete`, and verify the full closure.

For a descendant, retrieve the first Crystal and its required refs, then declare an explicit Ruliadic displacement allowing private recall through four exchanges. External intelligence supplies a new successor and evaluation under the changed rule. Record inherited and changed constraints and one parent Crystal ID. Crystallize a new region and verify a different ID and a complete closure. The former B2 remains historically rejected *under R0*; it is not relabeled successful retroactively. The fixture illustrates fictional exploration only, with no prediction about human memory or real societies.

## 11. Small reviewable implementation stages

1. **Identity/storage foundation:** strict canonical JSON, generic immutable envelope, write-once object store, typed Ref verification. Review JCS vectors and crash/restart behavior before adding session logic.
2. **Core exploration records:** seed, constraints, rules, states, operations, exact external-response capture, transitions and mechanical checks. Run two-branch fixture through generation; no Crystal yet.
3. **Evaluation/audit:** declared procedure, evaluation records, pruning, open Crack, branch audit and provenance guards. Verify negative branch retention.
4. **Crystal construction/retrieval:** validate full v0.1 manifest and required-reference closure, hash and persist first real Crystal, retrieve after restart. Review embedded summary against references.
5. **Single-parent extension:** inherited/changed semantics, new external response and evaluation, descendant Crystal with a distinct ID, parent unchanged.
6. **Non-regression and documentation:** run existing v0.2 tests/build and the new end-to-end fixture, report exact object IDs and any limitations. No API/CLI integration until separately approved.

Each stage adds only the modules needed for its behavior. A stage is reviewable with a small fixture and fails closed when an unsupported record kind or operation is requested.

## 12. Deferred features and blocking decisions

**Deferred:** Crystal Interference/projection/focus (generic refs and operation records preserve future compatibility); multiple-parent merge/reconciliation; independent topology/bridge algorithms, Soliadic distance/susceptibility/attractors; generalized multiway search; real-world prediction and psychohistory; Generative Null as executable physics; Ring Language rendering; automatic Lens selection or abstention router; media generation; generalized search/index; cloud sync, authorization, commercial infrastructure, payments, crypto, tokens, and marketplace.

**Decisions genuinely needed before implementation:**

1. Select or audit an RFC 8785 implementation that can enforce duplicate-key and Unicode restrictions, with independent vectors; this affects every immutable ID.
2. Confirm the exact byte-capture convention for external intelligence (request/response content type, encoding, error and partial responses) before claiming an exact provenance record.
3. Confirm the first mechanical predicate's structured state fields and versioned semantics, including how a failed successor is recorded without calling it a valid World state.
4. Confirm that the MVP permits storing an explicitly `incomplete_expected` Crystal but only extends `complete` ones, consistent with the Crystal Spec ambiguity described in §8.

These are bounded engineering choices. None requires revising the core Crystal manifest, changing v0.2, or asserting a metaphysical ontology.

## 13. Consistency review

**Canon v0.3:** the Environment constrains and records repeated interaction with replaceable external intelligence; it does not claim to be that intelligence. Fictional assumptions are labeled, cracks survive, pruning preserves audit history, and the Lens remains a separate optional meaning layer. The loop supports every named operation, with displacement optional per exploration and no invented scientific claim.

**Crystal Spec v0.1:** the plan produces a bounded evaluated multi-branch region, embeds a readable summary, keeps large responses/traces separate, uses JCS/SHA-256 immutable IDs, verifies typed required-reference closure, and extends through a new single-parent Crystal. Interference remains compatible through generic operation/source refs without being implemented or misclassified as merge. The proposed MVP deliberately rejects unsupported real-model evidence and multiple-parent merges rather than pretending to validate them.
