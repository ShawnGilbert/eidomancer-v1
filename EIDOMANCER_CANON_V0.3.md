# Eidomancer Canon v0.3 — Exploration and Meaning

**Status:** normative conceptual and computational specification for a future implementation; no v0.3 engine or protocol is implemented by this document.  
**Baseline:** recovered clean commit `2221d82c1984507d0c28c974a8adce8f0fcfc5da`.  
**Historical contracts:** `EIDOMANCER_AGENT_V0.2.md`, `src/lib/eidomancerCanon.js`, v0.1/v0.2 agent protocols, and the frozen A/B evaluations remain unchanged.  
**Scope:** exploration state and its handoff to the existing Lens. No blockchain, token, marketplace, payment, or billing design.

## 1. Interpretation and authority

The words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** describe proposed v0.3 conformance, not behavior already present in v0.2. A **canonical contract** is a project design requirement. A **provisional model** is a useful assumption that can be replaced. A **worldbuilding hypothesis** may inspire fictional constraints but cannot establish a scientific fact. An **implementation choice** remains open until a later version fixes it. Every stored assertion MUST identify which kind of claim it is.

The canonical interaction is:

```text
USER → EIDOMANCER EXPLORATION ENVIRONMENT ↔ THE EMERGENT ONES / EXTERNAL INTELLIGENCE
     → EIDOMANCER LENS → PRESENTATION → ARTIFACT
```

The double arrow means repeated requests and responses during exploration. It does not mean that the Exploration Environment is the intelligence. The Environment owns state, declared constraints, displacements, branch and lineage bookkeeping, budgets, storage and retrieval, evaluation procedures, and provenance. A replaceable external AI/agent owns semantic reasoning, domain knowledge, generation of candidate states and interpretations, and judgment under uncertainty. The Environment may execute deterministic validation and transitions over declared data, but MUST label any semantic candidate or judgment supplied by intelligence and MUST NOT describe a deterministic simulation as independent AI reasoning.

The existing **Eidomancer Lens** remains a distinct meaning transformation and symbolic compression layer. It owns Physics First, viewpoint, evidence and memory discipline, anti-drift doctrine, and the functional distinctions Signal, Tension, Pattern, Insight, Essence, Guidance, Echo, and semantic Core Card. Exploration can supply grounded candidate material to that Lens; it does not replace it. Presentation changes expression only. A downstream specialist may create or decline an artifact medium and MUST preserve authoritative meaning.

The exploration path is optional. An ordinary v0.2 Lens request need not create a world, branch, or Crystal. A low-utility task MAY bypass symbolic compression in a future separately specified interface; this document does not alter v0.2's required Cast fields or implement an abstention router.

### External influence and project terminology

Stephen Wolfram's **Ruliad** and multiway computational ideas are external intellectual influences. Eidomancer's **Soliad**, Soliadic terms, Crystals, and their proposed contracts are project constructs; they are not attributed to Wolfram. The Ruliad is used here as a working computational/worldbuilding lens, not an established complete description of physical reality. Nothing here asserts that actual thought, culture, or the universe obeys the proposed Eidomancer data structures.

## 2. Preserved v0.2 doctrine and operating boundary

**Physics First:** for a real-world interpretation, name material constraints, incentives, bodies, time, cost, infrastructure, and cause and effect. A fictional world's declared physics can differ, but its constraints and consequences must be explicit. A metaphor must not erase mechanisms or consequences. A fictional rule MUST NOT be silently applied to real-world evidence.

**Provenance:** retain separate classes for `observed_or_supplied` (including the source and its declared status), `inferred`, and `symbolized`; additionally distinguish `declared_world_assumption`, `generated_candidate`, and `evaluation_judgment` in exploration. “Supplied” does not certify truth. A report, memory continuity signal, or prior Crystal is not independent evidence of the reported event. A generated fictional observation is an observation *within that declared world*, never an empirical observation about ours. Every derived item MUST have links to its inputs and producing operation or intelligence response.

The evidence flow is one-way:

```text
supplied material → qualified inference → structured meaning → symbolization
```

**Symbolization MUST NOT be promoted to source evidence.** Invented scenes can accurately physicalize a tension; their invented details cannot support a later factual or causal conclusion. A retrieved Crystal inherits its original claim classes and uncertainties. Repetition, popularity, attractive presentation, and storage do not upgrade confidence.

**Anti-drift:** The Emergent Ones denotes underlying intelligence, not a theme, voice, oracle, deity, therapist, or final authority. The Lens does not claim supernatural certainty. Presentation cannot reclassify evidence or replace the selected symbolic center. Essence, Echo, Guidance, Core Card description, image prompt, and a downstream song Hook have different jobs and MUST NOT be silently substituted for one another.

The September 17 Operating Envelope, based on three controlled qualitative A/B evaluations, identifies the strongest demonstrated Eidomancer boundary as **authoritative structured meaning and symbolic compression**. In Test #1 the orchard/turnstile added a portable access-rule insight, and the later packaging repair preserved it. In Test #2 symbolic physicalization aided interpretation of ambiguous loss while automatic media underperformed. In Test #3 a direct shelter handout beat additional symbolism and media. These tests do not establish broad superiority, a utility threshold, commercial value, or an automated router. Exploration MUST retain the possibility of an explicit negative evaluation, direct output, and declining symbolic or media work. The frozen evaluations remain historical evidence, not editable training fixtures for an asserted v0.3 success.

## 3. Common machine contract

The following is a **logical representation**, not a finalized JSON Schema or storage implementation. Implementations MUST preserve these distinctions even if field names or encodings change during Step 2.

Every addressable record has a stable ID, schema version, record kind, creation provenance, claim status, explicit references to parent/input IDs, and content or a content hash. Operations create new versioned records; they do not silently mutate the provenance or rules of a past branch. References MUST resolve to immutable versions or report an unresolved reference. A content hash proves byte identity under a named canonicalization procedure, not correctness of the content. An evaluator records its procedure and inputs separately from its conclusion.

Illustrative logical types:

```text
World = {id, version, mode: fictional|hypothetical|real_model,
         state, rule_set_ref, topology_ref, evidence_refs, lineage_refs,
         anomalies, provenance}
Constraint = {id, scope, predicate_or_instruction, hard_or_soft,
              assumptions, provenance, revision_trigger}
Transition = {id, from_world_state, to_world_state, rule_refs,
              intelligence_response_ref?, operation_ref, provenance}
Evaluation = {id, target_ref, procedure_ref, comparator_refs,
              result, uncertainty, evaluator_provenance, limitations}
```

`real_model` means a model *about* the real world and requires real evidence discipline; it does not claim that a World record is reality. A constraint's machine-checkable predicate and a natural-language instruction MUST be marked separately. If a requirement cannot be checked mechanically, the system MUST NOT report it as mechanically verified.

## 4. Primitive catalog

Each entry specifies meaning; machine representation; permitted operations; relationships; status; and a revision trigger. “Falsify” below means disconfirming a proposed Eidomancer modeling claim or its usefulness, not disproving a metaphysical position by software test.

### 4.1 Ruliad and Ruliadic rule set

- **Meaning:** the Ruliad is an external conceptual influence suggesting exploration of possible rule-driven worlds. A *Ruliadic rule set* is Eidomancer's explicitly declared, finite operational approximation for one exploration.
- **Representation:** versioned rule IDs, state domain, transition definitions or instructions, applicability scope, and assumptions; mark each rule as mechanically executable, AI-interpreted, or illustrative.
- **Operations:** declare, validate within stated limits, apply, compare, version, and fork rule sets. Never claim to enumerate the Ruliad itself.
- **Relationships:** a World references a rule set; a Ruliadic displacement creates a successor rule set and world lineage edge; an automaton may iterate compatible transitions.
- **Status:** the data contract is canonical; the broad ontology is provisional and externally inspired.
- **Revision trigger:** rules cannot be stated or applied consistently for the intended domain, or claimed rule-driven value fails comparison with simpler models. Contrary empirical evidence revises a real-world model rather than being edited away.

### 4.2 Soliad and Soliadic state

- **Meaning:** the Soliad is Eidomancer's provisional model of constrained relationships among informational/conceptual structures, including thoughts, symbols, narratives, software, and world concepts. It is not a measured universal space of ideas.
- **Representation:** a versioned, typed, directed graph or other explicitly declared topology of conceptual states, relation types, admissibility constraints, context, and evidence/assumption links. IDs identify recorded representations, not every possible thought.
- **Operations:** add or version states and relations, test declared compatibility, traverse, compare, and propose alternatives through external intelligence; preserve rejected and unknown relations where relevant.
- **Relationships:** neighborhoods, distances, susceptibility, bridges, attractors, and automaton transitions are defined relative to a particular topology and context.
- **Status:** explicit contextual topology is a canonical modeling contract; the assertion that an objective underlying Soliad exists is provisional.
- **Revision trigger:** declared relations fail to reproduce the intended distinctions, yield no measurable advantage over unconstrained generation, or repeatedly collapse unlike concepts into arbitrary proximity.

### 4.3 Soliadic distance

- **Meaning:** task-relative cost, difference, or resistance between two represented conceptual states, not a universal physical separation.
- **Representation:** `(state_a, state_b, topology_version, context, method, value_or_interval, units, provenance)`; specify whether directional, symmetric, metric, or merely ranked. Unknown distance is allowed.
- **Operations:** estimate, compare under the same method/context, recompute after displacement, and challenge. Do not combine incompatible scales without conversion.
- **Relationships:** can help define neighborhoods or choose bridges; does not alone prove influence, susceptibility, or utility.
- **Status:** typed estimate contract canonical; formula and ontological interpretation provisional.
- **Revision trigger:** rankings fail held-out judgments or downstream utility tests, or the method's assumptions (for example, symmetry) are violated.

### 4.4 Soliadic neighborhood

- **Meaning:** states considered locally reachable or relevant under declared relations, constraints, and context.
- **Representation:** center state ID, topology version, membership rule, depth/threshold/budget, member IDs, exclusions or unknowns, and provenance.
- **Operations:** enumerate bounded members, expand, filter, compare versions, and explain membership. An unenumerated neighborhood is not assumed empty.
- **Relationships:** automaton transitions inspect a neighborhood; distance MAY inform membership but is not required.
- **Status:** bounded membership contract canonical; any claim of natural conceptual locality provisional.
- **Revision trigger:** membership is unstable under harmless representation changes or excludes demonstrably useful adjacent candidates under its stated purpose.

### 4.5 Soliadic susceptibility

- **Meaning:** conditional propensity of a represented state or neighborhood to change under a specified influence or displacement; not a universal psychological trait.
- **Representation:** target, influence, context, method, estimated response/range or qualitative category, uncertainty, evidence or simulation refs, and scope.
- **Operations:** hypothesize, estimate, simulate under rules, compare, and revise; never infer a person's real behavior from an unvalidated fictional model.
- **Relationships:** may prioritize branches or identify candidate transitions; an attractor may alter local susceptibility.
- **Status:** conditional record contract canonical; predictive validity provisional.
- **Revision trigger:** prospective or held-out outcomes disagree with predictions, or the variable cannot be defined consistently enough to evaluate.

### 4.6 Soliadic bridge

- **Meaning:** an explicit, justified connection between otherwise distant or incompatible conceptual states or neighborhoods.
- **Representation:** endpoint IDs and versions, direction, mapping/transformation, preserved and changed properties, assumptions, cost, lineage reference, and provenance.
- **Operations:** propose, validate declared invariants, traverse, reject, revise, or compose when interfaces agree. An AI proposal is not a verified bridge.
- **Relationships:** can implement a Soliadic displacement or connect a parent and descendant World; may shorten a task-relative distance.
- **Status:** explicit transition record canonical; claims of natural hidden connectivity provisional.
- **Revision trigger:** the mapping loses a stated invariant, conceals a rule change, or generates incoherent descendants.

### 4.7 Soliadic attractor

- **Meaning:** a recurrent or convergent region observed within a specified transition model and bounded exploration, not destiny.
- **Representation:** topology/rule version, initial-state set, transition trace or sampled branch set, region criterion, frequency or recurrence measure, budget, and uncertainty.
- **Operations:** detect, compare across seeds and rule changes, challenge, and label as unconfirmed if sampling is insufficient.
- **Relationships:** an automaton can generate trajectories used to identify an attractor; lineage records which branches reached it.
- **Status:** detection record canonical; extrapolation to real societies provisional.
- **Revision trigger:** recurrence disappears under small justified changes, greater exploration, or independent replication.

### 4.8 Soliadic automaton

- **Meaning:** bounded, rule-driven evolution of informational states; compatible successor rules may yield multiple branches rather than one predicted future.
- **Representation:** initial state, topology and rule versions, transition relation, branching policy, deterministic/AI-dependent labels, budgets, trace, and stopping conditions.
- **Operations:** enumerate or sample successors, fork, iterate, pause, replay deterministic portions, and record unresolved alternatives. AI-generated successors require intelligence response provenance and are not falsely called deterministic replay.
- **Relationships:** consumes neighborhoods and constraints; yields branches, candidate attractors, anomalies, and lineage edges.
- **Status:** multiway execution contract canonical; psychohistory-like forecasting provisional worldbuilding and subject to separate validation.
- **Revision trigger:** successors cannot be checked against declared local rules, branching is arbitrarily collapsed, or proposed predictive use fails out-of-sample checks.

### 4.9 Ruliadic and Soliadic displacement

- **Meaning:** a controlled change to world rules/constraints (**Ruliadic**) or to conceptual topology/admissible relations (**Soliadic**). Both create a new version and an explicit parent link; neither retroactively edits the parent.
- **Representation:** displacement ID, kind, parent refs, operation and parameters, before/after refs or diff, invariant list, rationale, proposer, validator, and uncertainty.
- **Operations:** propose, type-check, apply to a fork, compare consequences, revert by creating a new successor, and reject. Declare combined changes as separately attributable operations.
- **Relationships:** creates world lineage; may require a bridge; affects distance, neighborhood, susceptibility, and transition results.
- **Status:** explicit versioned operation canonical; whether a displacement is metaphysically possible or socially predictive provisional.
- **Revision trigger:** the operation violates declared invariants, changes undeclared dimensions, or cannot be distinguished from regenerating an unrelated world.

### 4.10 World and world lineage

- **Meaning:** a World is a scoped state under declared rules, conceptual topology, constraints, and claim status. Lineage records how descendants arose from parent versions through specific operations.
- **Representation:** World logical type above; lineage edges store parent/child IDs, displacement or bridge ID, preserved invariants, timestamp/order, and provenance. Support multiple parents only with an explicit merge mapping and conflict record.
- **Operations:** seed, fork, evolve, compare, retrieve, and extend; preserve ancestors and rejected branches by stable reference. Deduplication can identify identical content without erasing distinct provenance.
- **Relationships:** worlds host automata and anomalies and may be summarized by Crystals; Core Casts may interpret their consequences.
- **Status:** lineage bookkeeping canonical; any claim that imagined worlds literally exist provisional.
- **Revision trigger:** a descendant lacks an attributable transition, changes inherited constraints without disclosure, or replay/audit cannot distinguish it from fresh generation.

### 4.11 Constraints and constraint-driven novelty

- **Meaning:** coherent limits on what may occur or be asserted, chosen to make consequential interactions possible. Maxim: **“Interesting events happen between constraints. When all things are possible, nothing really happens.”** Novelty is useful only when a candidate remains coherent and serves the task.
- **Representation:** versioned hard/soft constraints with scope, test method or explicit human/AI judgment, dependencies, exceptions, and provenance; novelty evaluation references a baseline and criterion.
- **Operations:** declare, combine with conflict detection, test, displace, evaluate candidate consequences, and prune with recorded reasons.
- **Relationships:** constrain worlds, automata, bridges, Lens instructions, and downstream symbolic language; cannot override evidence or v0.2 meaning authority.
- **Status:** explicit coherent-constraint contract canonical; the maxim is a design heuristic, not a theorem.
- **Revision trigger:** constraints routinely produce contradictions without informative cracks, or unconstrained/simple baselines outperform them on the stated objective.

### 4.12 Generative Null / Null Instability

- **Meaning:** a provisional metaphysical/worldbuilding hypothesis: absolute nothingness might be unstable or incoherent; describing conceptual null already makes a distinction. This is not established physics and supplies no measured transition probability.
- **Representation:** optional hypothesis record with scope `fictional` or `philosophical`, explicit assumptions, proposed transition rules if used in a World, and a conspicuous `speculative` claim label. It MUST NOT be a default rule of real-world models.
- **Operations:** introduce as a declared seed or constraint, derive conditional fictional consequences, challenge its coherence, or omit it entirely.
- **Relationships:** MAY motivate a Ruliadic displacement or a narrative origin; does not bypass Physics First for real-world claims.
- **Status:** worldbuilding hypothesis only; the labeling and isolation rule are canonical.
- **Revision trigger:** internal contradiction under a declared world model, or failure to generate useful coherent consequences. No software evaluation establishes or refutes absolute nothingness.

### 4.13 Crack / anomaly

- **Meaning:** a preserved mismatch among evidence, assumptions, rules, predictions, or internal world states. **“Cracks are information.”** The lens changes before evidence does.
- **Representation:** ID, conflicting item refs, anomaly kind (`empirical_conflict`, `model_failure`, `fictional_inconsistency`, `unknown`), scope, detection method, severity/uncertainty, status, and competing explanations.
- **Operations:** record, attach to branches and Crystals, investigate, propose revision, mark resolved with an audit trail, or leave open. Never delete or rewrite contrary supplied material merely to restore coherence.
- **Relationships:** can challenge rules, distances, evaluations, and Lens interpretations; a crack is not automatically evidence for a preferred alternative theory.
- **Status:** preservation and revision discipline canonical; any interpretation of a particular anomaly provisional.
- **Revision trigger:** an anomaly is shown to arise from a transcription or model error, in which case record the correction and retain the audit history.

### 4.14 Ring Language

- **Meaning:** a versioned symbolic representation layer in which apparently encoded elements have defined meaning or function. **Nothing symbolic is merely decorative.** Ordinary non-encoded decoration may exist but MUST NOT imply an undocumented code.
- **Representation:** grammar version, token/glyph IDs, semantic definitions, composition and placement rules, rendering mapping, and explicit link to the meaning/World/Crystal refs encoded; reserve unknown/invalid token handling.
- **Operations:** encode, decode where the grammar supports it, validate token use, render, version, and round-trip test defined semantics. Lossy renderings MUST declare what was lost.
- **Relationships:** expresses Lens-selected meaning or declared exploration state downstream; never alters evidence or substitutes a competing Core Card symbol.
- **Status:** semantic accountability canonical; a universal machine-decodable visual language remains an untested design goal.
- **Revision trigger:** tokens are used decoratively without definitions, different meanings map ambiguously without a declared convention, or rendering changes the underlying relation.

### 4.15 Crystal

- **Meaning:** a persistent, addressable unit of *discovered conceptual territory*: enough state, constraints, lineage, emergent consequences, evaluation, and provenance to retrieve, audit, and extend exploration. “Discovered” means discovered **within a declared model/search**, not empirical discovery by default.
- **Representation:** a versioned record or immutable manifest referencing World state and rule/topology versions, seed, displacements/bridges, lineage, evaluated consequences, anomalies, evaluation methods/results, claim classes, intelligence responses, and content identity. It may reference Core Casts and artifacts as separate records. The exact schema, granularity, indexing, retention, and storage backend are Step 2 decisions.
- **Operations:** crystallize from a bounded trace, validate completeness and provenance, store, retrieve by ID or declared query, compare, cite, and extend by creating a descendant; do not rewrite an old Crystal to conceal failed branches or revised judgments.
- **Relationships:** a Crystal preserves exploration for later agents; the Lens MAY interpret retrieved material, and artifacts MAY represent it. It is neither a Core Cast nor a claim of verified truth.
- **Status:** durable identity, auditability, and separation from artifact meaning are canonical; economic value of retrieval remains a testable hypothesis.
- **Revision trigger:** retrieval repeatedly costs as much as regeneration, descendants cannot be reconstructed or checked from stored references, or saved material loses the provenance needed to prevent false certainty.

## 5. Exploration procedure and handoffs

`SEED → CONSTRAINT/DISPLACEMENT → FORK → EVOLVE → EVALUATE → PRUNE → CRYSTALLIZE → RETRIEVE` defines logical operations, not a promise that every task runs every step. A seed includes purpose, domain/claim status, initial state, assumptions, source refs, and desired outputs. The Environment records budget limits (calls, tokens/cost if observable, depth, branches, wall time, storage) and stopping conditions before exploration. Budget exhaustion yields an incomplete trace, never a false claim that the search space was exhausted.

The Environment supplies the current state, constraints, and provenance to replaceable intelligence, receives proposed semantic successors or evaluations, validates checkable invariants, records uncheckable judgments as such, and may repeat. Each fork records its parent and changed dimensions. `EVOLVE` may apply executable rules or request AI reasoning; its trace MUST distinguish them. `EVALUATE` applies a declared procedure with comparator, uncertainty, and negative outcomes. `PRUNE` removes a branch from active search, not from the audit record; the reason remains retrievable. `CRYSTALLIZE` stores a bounded, evaluated territory record. `RETRIEVE` returns it with provenance, assumptions, unresolved cracks, and freshness/revision status. Retrieval alone does not prove reuse value.

An exploration output crosses into the Lens only as a typed, provenance-carrying input. For a fictional World the Lens may interpret emergent narrative meaning under its declared rules; for a real-world model it MUST preserve supplied evidence versus hypothesis and uncertainty. The Lens MAY produce its existing structured meaning package where the Operating Envelope suggests value. Downstream presentation and artifact specialists receive that package as semantic authority, and MAY decline a medium. No exploration branch, symbolic glyph, or finished artifact becomes evidence about the user or external world by virtue of being rendered.

## 6. Evaluation examples and counterexamples

- **Automation and permission (Test #1):** the access-rule insight and orchard/turnstile must survive Lens-to-presentation and package handoffs. A new World exploring alternate access rules may branch from explicit displacements, but cannot retroactively replace the frozen Core Cast with storm imagery.
- **Ambiguous loss (Test #2):** a door held by calendars and narrowing hallway can be valid `symbolized` physicalization. It does not establish literal boxes, obstruction, death, or survival. A Crystal about possible family arrangements must retain `unknown` status and reversible choices.
- **Shelter returns (Test #3):** a faithful leash/timer symbol may still lose to a direct adopter handout. Evaluation must permit low Lens utility and decline song or promotional video. A simulated branch cannot claim that shorter counseling caused the observed returns without suitable evidence.
- **Fictional branching example:** seed a world with scarce computation and rule `memory decays after three exchanges`; fork one branch with a Ruliadic displacement extending memory to four and another with a Soliadic bridge that allows external inscription. Record each descendant's inherited constraints, new consequences, intelligence-supplied interpretations, and evaluation. Neither branch predicts actual civilization.
- **Crack example:** if a branch's declared memory decay forbids recall on the fourth exchange yet its story recalls a private fact, record a `fictional_inconsistency`. Investigate the rule, hidden external memory, or generated text; do not silently relabel the event as a miraculous proof of Generative Null.

## 7. Evaluation, falsification, and economic hypothesis

Compare exploration against direct external-intelligence generation using frozen tasks, budgets, and evaluation procedures. Measure at least coherence, novelty relative to a stated baseline, meaning preservation, provenance fidelity, useful retrieval, extension quality, and compute/time spent; include failures and low-utility tasks. Where possible, use independent evaluators and held-out tasks. The three historical A/B evaluations are qualitative boundary evidence, not proof of exploration-engine performance. An attractor or cultural forecast requires separate prospective validation before predictive claims. Formal thresholds and automated selection policies are not set here.

The longer-term hypothesis is that persistent, useful external conceptual territory can save agents context or compute compared with regeneration. A private accumulated graph and commissioned exploration are possible future products only if retrieval and reuse demonstrate net value. This document establishes no marketplace, cryptocurrency, blockchain, payment, or token architecture.

## 8. Compatibility and implementation boundary

v0.1 default CLI/API behavior and v0.2 `/api/v2/lens`, `eidomancer.agent.v0.2`, its three execution modes, aliases, manifests, and Core Cast authority remain historical contracts. This document does not claim that v0.3 runs through those endpoints or that `src/lib/eidomancerCanon.js` already enforces these new primitives. A future versioned interface must specify request/response schemas, error states, migrations, symbol abstention, and its relation to strict AI without silently changing v0.2. Existing v0.2 tests and the three frozen A/B evaluations serve as non-regression evidence; they must not be rewritten to make v0.3 appear successful.

Before code changes, Step 2 must settle Crystal identity/granularity, minimum stored state versus references, canonical serialization and versioning, claim/evidence provenance, lineage and anomaly retention, evaluation reproducibility, retrieval/extension semantics, and the boundary between stored exploration and the separate Core Cast. Only then should implementation contracts, migration fixtures, and new tests be designed. The approval of this document is not approval to implement an engine.
