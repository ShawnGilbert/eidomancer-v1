# Eidomancer Crystal Specification v0.1

**Status:** Step 2 logical and serialization contract. This document specifies records; it does not implement storage, an exploration engine, a protocol endpoint, or a Lens change.  
**Authority:** subordinate to `EIDOMANCER_CANON_V0.3.md`; historical v0.1/v0.2 behavior and the three frozen A/B evaluations remain unchanged.  
**Versions:** `schema_version = "eidomancer.crystal.schema.v0.1"`, `crystal_version = "0.1"`, and `canonicalization_version = "eidomancer.jcs.v1"` are distinct required fields. A future version changes them explicitly; it does not silently reinterpret old bytes.

## 1. Identity and scope

A Crystal is an **immutable, evaluated, bounded region of explored conceptual territory** anchored to one or more versioned World states. It summarizes significant discoveries and related branches and carries enough meaning to read without downloading a raw trace. It is not a single World, a Core Cast, a finished artifact, or the exhaustive trace. “Discovered” means discovered within a declared model and search; `real_model` still requires independent evidence discipline.

The Crystal boundary MUST name its anchor states, included branch IDs, excluded or pruned branch summaries, coverage limits, and the evaluation that justified retaining the region. Several branches MAY be included when their relationship is itself significant. A branch's inclusion means it was considered; it does not make its candidate successful. Every Crystal MUST have a finite declared boundary and at least one evaluated significant consequence. If evaluation concludes that the territory has no useful discovery, retain that result as a negative evaluation/trace record; create a Crystal only if the bounded **negative finding itself** is useful to retrieve and that reason is stated. No metric threshold for usefulness is asserted by this specification.

Identity is `crystal:sha256:<64 lowercase hex digits>` computed from canonical bytes of the identity payload as defined in §5. The ID is a content address, not a claim of correctness. Changes to canonical content, including corrections, evaluation summaries, lineage, required reference IDs, or unresolved-crack status, produce a new ID. Never edit a Crystal in place. Retrieval metadata such as access count, a newer-version pointer, storage location, or index rank lives outside the identity payload and cannot silently change its meaning.

## 2. Logical manifest

The following shape is normative at the logical level. JSON member names and enum values below are fixed for v0.1. `?` means optional; arrays required below may be empty only where explicitly allowed. `Ref` means an immutable typed reference from §4. The top-level `id` is a derived envelope field and is **excluded** from the identity payload. An implementation may store envelope and payload separately.

```text
CrystalEnvelope = {
  id: CrystalID,                           // derived, verify on retrieval
  payload: CrystalPayload                   // sole hashed content
}

CrystalPayload = {
  schema_version: "eidomancer.crystal.schema.v0.1",
  crystal_version: "0.1",
  canonicalization_version: "eidomancer.jcs.v1",
  purpose: {question: Text, intended_reuse: Text, scope: Text},
  boundary: {inclusion_rule: Text, excluded_scope: Text,
             stopping_reason: Text, search_limitations: [Text]},
  world_mode: "fictional" | "hypothetical" | "real_model",
  assumptions: [Claim],                   // explicit; may be empty
  constraints: [ConstraintSummary],        // at least one declared limit
  anchors: [AnchorSummary],                // at least one
  branches: [BranchSummary],               // at least one
  significant_consequences: [Claim],       // at least one
  unresolved_cracks: [CrackSummary],       // may be empty, never omitted
  evaluation_summary: EvaluationSummary,
  lineage: {parents: [CrystalParent], origin: Ref},
  provenance: ProvenanceSummary,
  required_references: [Ref],              // explicit, may be empty only if
                                           // complete without external records
  optional_references: [Ref]?              // supplemental material
}
```

Every embedded summary MUST be intelligible without fetching a reference. Its corresponding required reference supplies exact state, rule, transition, evidence, or evaluation details needed for audit and legitimate extension. Embedded text cannot silently contradict referenced content. The validated record records the reconciliation if a summary intentionally abstracts or omits detail.

### 2.1 Required embedded subrecords

- `Claim = {id, statement, claim_class, scope, source_refs: [Ref], uncertainty, qualifiers: [Text]}`. `id` is unique within the payload and supports internal links. `uncertainty` is a textual calibrated statement, not an invented probability. A claim with no source refs MUST explicitly say it is a declared assumption or model-generated proposal in its class and provenance; external factual claims cannot have unexplained origin.
- `ConstraintSummary = {id, statement, scope, strength: "hard"|"soft", verification: "mechanical"|"intelligence_judgment"|"unverified", rule_ref: Ref?, inherited_from: Ref?, exceptions: [Text]}`. A natural-language condition without a check is not `mechanical`. IDs are unique.
- `AnchorSummary = {world_state_ref: Ref, role, defining_state: Text, rule_set_ref: Ref, topology_ref: Ref?, claim_class}`. The defining state is a concise semantic summary; the exact immutable state is required by reference.
- `BranchSummary = {id, parent_branch_ids: [Text], entry_state_ref: Ref, outcome_state_refs: [Ref], operation_refs: [Ref], status: "retained"|"pruned"|"rejected"|"unresolved", relationship: Text, significant_result: Text, rationale: Text, trace_ref: Ref?}`. A retained branch is retained for analysis, not automatically endorsed. Pruned/rejected branches MAY appear as summaries or as separate audit records but MUST have a stable immutable audit reference. Parent IDs must resolve within this Crystal or to an explicitly typed branch record.
- `CrackSummary = {id, kind: "empirical_conflict"|"model_failure"|"fictional_inconsistency"|"unknown", statement, conflicting_claim_ids: [Text], conflicting_refs: [Ref], status: "open", candidate_explanations: [Text], effect_on_evaluation: Text, detail_ref: Ref?}`. An unresolved crack has no fabricated resolution. The empty list means explicitly none known within the declared boundary, not proof that none exists.
- `EvaluationSummary = {procedure_ref: Ref, evaluator: Actor, comparator_refs: [Ref], verdict: "retain"|"retain_negative_finding"|"limited"|"reject", findings: [Text], uncertainty: Text, limitations: [Text], why_retained: Text, detail_ref: Ref}`. The procedure and detailed record are immutable required references; the summary cannot replace them. `reject` normally remains in an evaluation/audit record rather than a new Crystal unless the negative territory itself is independently useful, in which case use `retain_negative_finding`.
- `CrystalParent = {crystal_ref: Ref, relation: "extension"|"correction"|"evaluation_revision"|"merge", inherited: [Text], changed: [Text], reconciliation_ref: Ref?}`. A single parent can be a correction or revision. Two or more parents require `relation: "merge"` for each parent and the same required reconciliation record.
- `ProvenanceSummary = {environment: Actor, intelligence: [Actor], operations: [Ref], source_scope: Text, evidence_handling: Text}`. `Actor = {role, provider, model_or_version, identification_status}`. Unknown provider/model MUST be recorded as unknown, not guessed. The Environment manages state and validation; external intelligence generates or judges semantic content. Deterministic operations and AI contributions MUST remain distinguishable in referenced records.

Required `Text` is a nonempty string unless a field's semantics expressly allow the empty string. IDs and enums are exact. Optional values are omitted when unknown; `null` is forbidden in the v0.1 identity payload. Empty arrays have their explicit meanings above. Extension fields require a new schema version rather than silently adding arbitrary members.

### 2.2 Minimum reference closure

`required_references` is the deduplicated, lexicographically sorted union of every Ref in the payload that is necessary to audit or extend it, including anchors and their rules, topology if used, lineage origin and parent Crystals, displacement/bridge operations, branch entry/outcome states, provenance operations, evaluation procedure and detailed evaluation, reconciliation, and any cited source/evidence record whose content is necessary to substantiate a real-world claim. A raw trace MAY be required when it is the only retained account of a transition or pruning reason; otherwise it is normally optional. Other source material, large intelligence responses, raw traces, artifacts, Core Casts, and detailed media outputs should normally be immutable references rather than embedded. All `required_references` MUST be discoverable by traversing the embedded payload; no unexplained extra required item is permitted. An implementation MUST say when such a reference is unavailable and MUST NOT substitute a different object with the same title.

The manifest is readable in isolation, but **auditable extension requires the Crystal plus its required-reference closure**. Fetching that closure MUST NOT require rebuilding the complete original raw trace. Optional references may be unavailable without changing the identity or preventing core extension, provided their absence is reported.

## 3. Claim classes and provenance

`claim_class` MUST be one of:

- `observed_or_supplied`: exact source or caller material with source identity and declared evidential status; supplied does not mean verified.
- `inferred`: interpretation derived from explicit source/claim refs, with uncertainty.
- `symbolized`: deliberately invented image, scene, or compression; never input evidence for a new factual conclusion.
- `declared_world_assumption`: a rule or premise chosen for the World, not an empirical finding.
- `generated_candidate`: a proposed state, event, bridge, or consequence supplied by replaceable external intelligence or a declared executable transition; the producing actor/operation is identified.
- `evaluation_judgment`: a conclusion under a named evaluator and procedure; not an observation merely because it was scored.

For `fictional` Worlds, fictional events may be observed **within the declared model**, but MUST remain `generated_candidate` or explicitly model-scoped inference when exported; they cannot be `observed_or_supplied` evidence about reality. For `real_model`, all external empirical claims require a traceable supplied source and uncertainty. A prior Crystal is contextual memory or a prior result; it is not independent confirmation of a source claim. `symbolized → observed_or_supplied` promotion is forbidden. A correction creates a new immutable claim or record that points to the earlier claim and explains the change. Provenance and claim status must survive retrieval, merging, Lens handoff, presentation, and export.

## 4. Typed immutable references and record kinds

Every `Ref` has `{kind, id, schema_version, required: true|false}`. The `id` is a content address under that kind's declared canonicalization profile, except for an external source lacking stable bytes, in which case a separately immutable captured-source record MUST be created before it can be required. Required refs are content-verified at retrieval; `schema_version` prevents misinterpreting an older record. The `required` flag must agree with membership in `required_references`. An unresolved ref is represented by its **expected typed identity** and explicit resolution status in retrieval diagnostics or a crack; it is not silently dropped or swapped.

Allowed core kinds are `world_state`, `rule_set`, `topology`, `constraint`, `seed`, `operation`, `bridge`, `transition`, `branch_audit`, `evaluation_procedure`, `evaluation_record`, `crack_record`, `intelligence_response`, `exploration_trace`, `captured_source`, `reconciliation`, and `crystal`. Optional downstream kinds include `core_cast` and `artifact`. The record kind is part of the referenced record's identity domain. The exact schema and canonicalization profile of non-Crystal records are later interface work; Step 2 fixes their semantic roles and requires immutable verifiable IDs before they are used as required references. There is no content hash for a non-Crystal record until its own canonical profile is specified.

A reference graph MAY share an object between Crystals. It MUST be acyclic along Crystal parent lineage. Required-reference closure MUST be finite and resolvable for a fully validated `complete` retrieval. An intentionally unresolved expected reference is stored as a typed dangling requirement, yielding `incomplete`, never `complete`. An accidental missing object is reported as integrity failure. These cases cannot be conflated.

## 5. Canonical serialization and hashing

The identity payload is canonical JSON encoded as UTF-8 using **RFC 8785 JSON Canonicalization Scheme (JCS)**, with these v0.1 restrictions: duplicate keys rejected before parsing; no `null`, floating-point numbers, NaN, Infinity, byte strings, or unpaired surrogates; timestamps, if later introduced, are strings in an explicitly versioned format; every string must already be Unicode NFC (reject, do not normalize silently); object keys are restricted to the defined schema; array order is semantic unless a rule below prescribes sorting. JCS fixes object key ordering, string escaping, and byte serialization; do not use locale-dependent sorting or pretty-printed JSON for identity.

Before JCS encoding, validation MUST require these array rules: `required_references` and `optional_references` sorted by the JCS bytes of their typed reference object and deduplicated; `lineage.parents` sorted by parent Crystal ID and deduplicated; all other arrays preserve authored order, including branch order, consequences, assumptions, constraints, cracks, and evaluation findings. Internal IDs MUST be unique and internal links resolvable or explicitly marked external. This deliberately means reordering a semantic list changes identity; callers should not casually reorder one. If ordering should cease to be meaningful, a future canonicalization version must define that change.

Compute `SHA-256(UTF8(JCS(CrystalPayload)))`, encode lowercase hexadecimal, and prefix `crystal:sha256:`. The envelope's `id`, retrieval status, signatures, storage metadata, and mutable catalog aliases are outside the hashed payload. `schema_version`, `crystal_version`, `canonicalization_version`, and every embedded reference ID **are inside**. Verifiers MUST recompute and compare the ID. A hash proves identity of the specified canonical content only; it does not prove truth, source validity, evaluation quality, or availability of referenced records. If a later format uses different canonicalization or hashing, it must use a new explicit profile and must not produce a v0.1 ID from different bytes.

## 6. Lineage, merge, correction, and evaluation revision

`lineage.origin` references the immutable seed/region-origin record. Parentless Crystals identify their origin and initial boundary. A descendant names each parent and precisely states inherited assumptions/constraints/territory and changed versions, operations, evaluations, or cracks. Its own anchors and evaluation are current for its new boundary. A descendant MAY preserve a prior verdict as history, but MUST NOT silently present it as its own current evaluation.

Multiple parent Crystals are allowed only if every parent has an explicit ID and a required `reconciliation` record defines: overlap mapping; incompatible world rules/topologies and claim classes; how anchor states and branches correspond; which constraints are inherited, displaced, or rejected; unresolved conflicts; and why the merged territory is coherent. The resulting Crystal may remain limited or contain cracks. A merge MUST NOT promote consensus between two model-generated claims into independent evidence. A multi-branch Crystal with **one lineage parent** is not a multi-parent merge.

Corrections and evaluations are append-only records. If a correction/revised evaluation materially changes the territory, retention reason, anchor/branch significance, or uncertainty, create a descendant Crystal with `correction` or `evaluation_revision` relation and a new ID. If it changes only an external catalog label, leave the Crystal immutable and record catalog history separately. No old Crystal is deleted or overwritten. A mutable index MAY point users to a successor but MUST expose the superseded ID and reason; retrieval by the old ID still returns the old content and explicit revision status from the catalog.

### Crystal composition / interference compatibility note

The existing `operation`, `intelligence_response`, `evaluation_procedure`, `evaluation_record`, `crack_record`, `seed`, and `crystal` reference kinds can support a future operation tentatively called **Crystal Interference** without changing this manifest schema. **Focus** deliberately selects two or more independently stored Crystals and one explicit common target/query/seed. A **projection** applies each Crystal's structured territory to that same target while keeping the source identity, scope, assumptions, and claim classes attached. **Constructive interference** names compatible structure reinforced by independently derived projections; **destructive interference** names conflicts, constraints, cancellations, or incompatible assumptions and cracks; **novel interference** names a candidate relationship or consequence absent from each source Crystal individually. These are computational metaphors inspired by optics, not assertions that information literally behaves as physical waves. Agreement between projections does not itself provide independent empirical corroboration.

An interference operation MUST preserve the exact source Crystal IDs, target identity, selection/operation and external-intelligence provenance, separate projections, agreements, contradictions, unresolved cracks, generated candidates, and declared evaluation procedure in immutable referenced records. It compares projections **without first merging** source territories. Its output is generated exploration material, neither automatically a Crystal nor a factual discovery. A useful evaluated result MAY subsequently be crystallized as a new bounded region: embed its significant consequences, cracks, evaluation and provenance summaries, and put the source Crystal and interference-operation IDs in `required_references` through the existing origin, operation, claim-source, and provenance links. If the new region genuinely extends one prior Crystal, name that parent under `lineage.parents`; otherwise a parentless Crystal may use an interference-derived immutable origin/seed and reference all source Crystals as inputs. Do **not** label every source a lineage parent merely because it was compared. If territories are later inherited and reconciled into one descendant, the multiple-parent **merge** rule above applies, including its explicit reconciliation record. Source Crystals remain immutable in all cases. The exact projection algorithm, result record schema, and evaluation rubric are future interface choices; no interference execution is specified here.

## 7. Cracks, pruning, and failed territory

Every unresolved contradiction or unexplained observation materially affecting the region MUST appear in `unresolved_cracks`, even when the evaluator considered it tolerable. Its conflict refs and effect on conclusions remain visible. If a new explanation is accepted, create a resolution record; a changed summary becomes a descendant Crystal. Never change supplied evidence to make the world model consistent. An anomaly may invalidate a rule without proving a preferred metaphysical hypothesis.

Pruning removes a branch from **active exploration only**. Each pruned or rejected branch must retain its immutable branch-audit record, parent/operation identity, rejection reason, evaluation procedure or failed constraint, and any relevant cracks. A Crystal MAY summarize such a branch to warn a later agent away from rediscovering a dead end. Its status MUST remain `pruned` or `rejected`, and negative findings MUST NOT be indexed as successful consequences. If a later displacement makes a previously rejected branch viable, create a new branch/descendant citing the old audit record and explaining the changed assumptions; do not revise the old verdict in place.

## 8. Retrieval and extension contract

Retrieval by exact ID verifies payload hash and schema/canonicalization support, then reports one of `complete`, `incomplete_expected`, `integrity_error`, or `unsupported_version`, with a per-reference resolution list. `complete` means all required references resolve and verify; it does **not** mean the claims are true or the evaluation is still current. `incomplete_expected` requires the Crystal itself to identify an expected unresolved reference and its consequence. A missing object that was represented as resolved is `integrity_error`. A retrieval index/search may rank candidates, but MUST return exact IDs, scope, claim classes, limitations, current/superseded catalog status, and verification state. Staleness/recency is catalog information unless explicitly evaluated into a descendant.

Another compatible agent with the Crystal and its required references MUST be able to identify its origin, assumptions, constraints, significant consequences, branch relationship, cracks, evaluation method and retention reason, and the operations needed to create a legitimate descendant **without reconstructing the complete original exploration**. To extend, the agent selects anchor or branch refs, declares inherited and changed constraints, budgets and a new operation, asks replaceable external intelligence for any semantic reasoning, validates the checkable parts, records new provenance and evaluation, and crystallizes a new bounded region referencing its parent. It cannot claim that the Environment itself supplied semantic intelligence, and it cannot carry a parent claim into a new scope without retaining its class and qualifiers. A retrieved Crystal can be supplied to the separate Eidomancer Lens as typed context; it never becomes a Core Cast automatically.

## 9. Validation failures

Validation MUST reject rather than guess when: the identity hash disagrees; a version/profile is unsupported; JSON is noncanonical or violates its restricted types; unknown fields appear; required semantic fields are empty; internal IDs collide; anchors or significant consequences are absent; a branch parent is unresolved without an external typed record; an operation changes constraints without disclosure; a `mechanical` claim has no executable test; a real-world factual claim has no traceable source; a symbolic invention is used as empirical evidence; required references have wrong kind/version/hash; a lineage cycle exists; multiple parents lack reconciliation; unresolved cracks are suppressed; rejected branches appear as successes; an evaluation lacks procedure/detail; or a record claims complete retrieval despite missing required references.

Validation SHOULD produce typed diagnostics indicating the failing path and whether the issue affects canonical bytes, integrity, provenance, coherence, or extension. Unsupported references can produce `incomplete_expected` only when the expected identity and limitation were explicitly stored; otherwise failure is an integrity error. Implementations MUST NOT silently repair these failures by substituting generated prose or another record.

## 10. Worked examples

These examples are **logical excerpts, not valid hash-bearing payloads**. `ref(kind, label)` denotes a fully typed, content-addressed immutable Ref whose actual ID and schema version must be supplied in a real record. Omitted required boilerplate (versions, required-reference closure, provenance details) must be present in actual serialized Crystals. No displayed label is a computed hash.

### 10.1 Simple single-lineage Crystal: the memory village

```text
purpose: Explore how a village maintains obligations when private memory fades.
world_mode: fictional
origin: ref(seed, village-seed)
anchors: [ref(world_state, memory-three-exchanges)]
constraints: [hard: private memory decays after three exchanges;
              hard: public inscriptions persist]
branches: [B0 retained, no parent, outcome ref(world_state, public-ledger)]
significant_consequences: [generated_candidate:
  obligations migrate to a publicly contestable ledger]
unresolved_cracks: []
evaluation: retain; coherent under declared rules, useful for a story about
  memory and governance; limited to this fictional model
lineage.parents: []
required references: seed, state, rules, transition, evaluation procedure,
  detailed evaluation, intelligence response/operation as applicable
```

The Crystal holds a bounded result and why it matters; its full prose conversation and visual artifact remain separate optional records. A later agent can extend B0 from the state and rules without reconstructing every rejected wording of the story.

### 10.2 Multi-branch Crystal: two ways around the forgetting rule

```text
origin: ref(seed, village-seed)
anchors: [ref(world_state, memory-three-exchanges)]
branches:
  B1 retained: Ruliadic displacement extends private memory to four exchanges;
     outcome: obligations shift toward trusted long-memory witnesses
  B2 retained: Soliadic bridge makes public inscriptions locally accessible;
     outcome: obligations shift toward contestable shared records
  B3 rejected: unexplained recall on the fourth exchange with unchanged rules;
     ref(branch_audit, B3-failure), reason: violates hard memory constraint
relationship: B1 changes a world rule; B2 changes conceptual access under the
  original memory rule. Their divergence is the discovery.
significant_consequences: [B1 and B2 yield different authority structures]
unresolved_cracks: [if B3's recall mechanism remains unexplained, explicitly
  record fictional_inconsistency and its effect on evaluation]
evaluation: retain B1/B2 comparison; B3 is a caution, not a successful branch
lineage.parents: [single prior Crystal if extending 10.1]
```

This Crystal includes related branches in one bounded region; raw exhaustive traces remain separate. Branching does not imply a unique predicted future. B3's immutable audit record prevents needless rediscovery without upgrading its failed claim.

### 10.3 Descendant after evaluation/assumption revision: shelter handoff

```text
parent C0: hypothetical real-world model of adoption returns, retained with
  a tentative judgment that shorter counseling is the principal cause
new information: ref(captured_source, later-comparison-data) shows selection
  and follow-up differences; the earlier causal evaluation is too confident
new record: ref(evaluation_record, revised-causal-evaluation)
descendant C1:
  lineage.parents: [{C0, relation: evaluation_revision,
    inherited: [same supplied return-rate observations, intervention options],
    changed: [causal confidence, evaluation, significant consequence]}]
  world_mode: real_model
  assumptions: [the online-adoption and counseling-time changes were concurrent;
    their independent effects remain unknown]
  significant_consequences: [inferred: a thirty-day comparison and a practical
    adopter handout are warranted; causal attribution remains unresolved]
  unresolved_cracks: [empirical_conflict or model_failure if the new data
    conflicts with C0's principal-cause explanation]
  evaluation: retain revised operational finding; decline symbolic media
```

C0 remains retrievable under its old ID with its original uncertainty and a catalog pointer to C1. C1 has a new ID because its evaluated territory materially changed. The later source is not fabricated by the example; a real record would need an actual captured source. This illustrates provenance restraint, not a claim about any actual shelter data or a retroactive rewrite of frozen A/B Test #3.

## 11. Implementation choices left open

The storage backend; reference schemas and hashing profiles for non-Crystal records; indexing and search algorithm; physical packing of manifests and immutable objects; retention/access policy; whether signatures are added outside payload; evaluation rubrics, thresholds and evaluator selection; resource budgets; equivalence/deduplication across distinct provenance; catalog supersession policy; optional trace compression; and agent/API transport remain implementation choices. They MUST respect this specification's identities, references, history, and provenance. Nothing here designs payments, crypto, tokens, or a marketplace.

## 12. Canon v0.3 consistency review

This format implements Canon v0.3's Crystal as an evaluated bounded region with provenance, world anchors, significant consequences, lineage, and unresolved cracks. It retains pruned territory in audit records, keeps symbols from becoming evidence, and keeps the Exploration Environment's bookkeeping distinct from external intelligence's semantic reasoning. Its retrieval and extension boundary supplies typed context to the existing Lens; presentation and artifacts remain downstream. It does not alter v0.2 contracts or assert that a new engine exists. The examples demonstrate a single lineage, meaningful branching, and append-only revision. Future work must specify the non-Crystal reference formats before executable validation of complete closures is possible.
