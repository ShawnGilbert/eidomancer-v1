# Eidomancer Agent Protocol v0.2

## Canonical architecture

```text
INPUT
  -> THE EMERGENT ONES (underlying/emergent AI intelligence)
  -> EIDOMANCER (focusing lens)
  -> PRESENTATION (theme, voice, imagery, metaphor, visual language)
  -> ARTIFACT PACKAGE
```

These layers are deliberately non-interchangeable:

- **The Emergent Ones** is the underlying AI intelligence. It is not a theme,
  voice, presentation layer, or interpretive constitution.
- **Eidomancer** is the focusing lens. Physics First, viewpoint, evidence and
  memory discipline, and anti-drift rules belong here.
- **Presentation** controls expression only. It must not alter evidence,
  reasoning, or the meaning selected by the lens.

The executable canon lives in `src/lib/eidomancerCanon.js`.

## Compatibility

- Commit `4894243` remains the known-good v0.1 baseline in Git history.
- `src/lib/agentProtocol.js`, `POST /api/v1/lens`, and default CLI behavior still
  implement `eidomancer.agent.v0.1`.
- v0.2 is isolated in `src/lib/agentProtocolV02.js`.
- Use `POST /api/v2/lens`, `--v0.2`, or set
  `protocol_version: "eidomancer.agent.v0.2"`.

## Execution modes

### `strict_ai` (default)

Requires a complete cast in `intelligence.content`. Missing intelligence returns
`INTELLIGENCE_REQUIRED`; missing cast fields return `INCOMPLETE_INTELLIGENCE`.
The lens never silently substitutes itself for intelligence.

### `hybrid`

Preserves supplied AI fields and deterministically fills missing structure.
Every field identifies whether it was model-generated or deterministically
derived. Diagnostics enumerate the filled fields.

### `deterministic_preview`

Runs without supplied AI for development, demonstrations, and contract testing.
The response explicitly says there was no intelligence source and warns that the
result is a simulation.

## Evidence and memory

Evidence is classified as:

- `facts`
- `reported_claims`
- `inferences`

Memory is classified as:

- `facts`
- `reported_claims`
- `continuity_signals`
- `prior_artifact_ids`

The lens instructions require reported claims to be treated as prior signal,
not independent proof, and prohibit implying access to unsupplied history.

## Cast contract

The v0.2 cast sequence is:

1. Signal
2. Tension
3. Pattern
4. Insight
5. Essence
6. Guidance
7. Echo

Essence is a first-class symbolic compression, not a copy of Echo or Guidance.
At the input boundary, `recommendation`, `advice`, and `next_move` normalize to
Guidance.

The Core Card requires a name, description, and concrete image prompt.

## Outputs

Canonical output keys:

- `lens_instructions`
- `core_cast`
- `image_prompts`
- `song_package`
- `youtube_package`
- `full_package`

Historical aliases remain accepted and normalize to canonical manifest keys:

| Alias | Canonical key |
| --- | --- |
| `cast`, `artifact`, `coreCard` | `core_cast` |
| `imagePrompt` | `image_prompts` |
| `song` | `song_package` |
| `youtube` | `youtube_package` |
| `fullPackage` | `full_package` |

Every artifact envelope carries completion state and provenance. Core Cast
provenance is field-level; derived packages identify their source layers.

## Two-pass agent use

An orchestrating agent can use v0.2 without giving Eidomancer direct model
credentials:

1. Request only `lens_instructions`.
2. Send that instruction package to the chosen AI intelligence.
3. Submit the returned cast as `intelligence.content` in `strict_ai` mode.
4. Request the desired artifact package.

This keeps the intelligence provider replaceable while preserving a stable
Eidomancer lens.

## Verification

```bash
npm run test:agent
npm run build
node scripts/eidomancer-agent.js --v0.2 examples/agent-request-v0.2.json
```
