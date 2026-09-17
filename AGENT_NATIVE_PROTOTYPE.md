# Eidomancer Agent-Native Prototype

## Outcome

This prototype makes the existing Eidomancer meaning layer callable by another
AI agent without requiring the browser UI or an OpenAI API key.

```text
structured input -> intelligence -> Eidomancer lens -> artifact package
```

Two transports share one implementation:

- `POST /api/v1/lens` for HTTP agents.
- `npm run agent -- request.json` (or JSON on stdin) for local agents.

## What already existed

The current repository already contained most of the valuable domain logic:

- A React/Vite Daily Artifact interface and an Express backend.
- `castEngine.js`, the active deterministic symbolic meaning engine. It extracts
  a core tension, locks a Signal/Tension/Pattern/Insight/Echo/Guidance flow, and
  builds a Core Card with lore, visual language, and image-generation metadata.
- `dailyCast.js` and `useDailyCast.js`, the current browser orchestration path.
- Artifact adapters, normalization, presentation, archive storage, and local
  analytics.
- `packageGenerators.js`, a rich but partially dormant expansion layer that
  produces Core Card and Echo image prompts, lyrics, Suno material, YouTube
  metadata, Specterr prompts, and a full text bundle.
- An older open-ended question-to-cast workspace, reducer/context archive shell,
  profile-based daily card experiment, and duplicate image-format concepts.
- Existing `/api/cast`, `/api/generate`, and guarded `/api/image` routes.

The project therefore did not need a new creative engine. It needed a stable,
machine-readable boundary around the meaning and package layers already present.

## Request contract

Minimal request:

```json
{
  "input": {
    "intent": "Turn this tension into a memorable cultural artifact."
  },
  "outputs": ["core_cast", "image_prompts"]
}
```

Full request fields:

- `protocol_version`: optional caller declaration; responses use
  `eidomancer.agent.v0.1`.
- `request_id`: optional caller correlation ID.
- `input.intent`: required question, goal, or tension.
- `input.source_material`: optional transcript, analysis, or raw material.
- `input.context[]`: optional context fragments.
- `input.constraints[]`: optional hard constraints.
- `input.audience`: optional intended audience.
- `intelligence.content`: optional JSON-formatted cast produced by another AI.
- `intelligence.provider` and `intelligence.model`: optional provenance labels.
- `lens.mode`, `lens.tone`, `lens.theme`, and `lens.avoid[]`: lens controls.
- `outputs[]`: any of `core_cast`, `image_prompts`, `song_package`,
  `youtube_package`, or `full_package`.

If `intelligence.content` is absent, the deterministic local engine supplies the
intelligence stage. If it is present but cannot be parsed as a cast, Eidomancer
uses deterministic output and emits a warning instead of failing the package.

## Response contract

Every successful response includes:

- `ok`, `protocol_version`, `request_id`, and `created_at`.
- `pipeline`: ordered stages, intelligence source, lens mode, and lens version.
- `manifest`: stable keys and media types for requested artifacts.
- `artifacts`: typed envelopes containing the actual cast or package.
- `diagnostics`: deterministic mode, intelligence-parse fallback state,
  selected tension profile, and warnings.

Invalid requests return `ok: false`, a stable `INVALID_REQUEST` code, and a list
of validation details. The CLI exits with status 2 for invalid JSON or requests.

## Implementation files

- `src/lib/agentProtocol.js`: validation, normalization, lens orchestration,
  package routing, manifests, and diagnostics.
- `scripts/eidomancer-agent.js`: stdin/file CLI adapter.
- `examples/agent-request.json`: complete example request.
- `test/agentProtocol.test.js`: request validation, deterministic package, and
  caller-intelligence tests.
- `server.js`: thin HTTP adapter at `POST /api/v1/lens`.

## Deliberate prototype limits

The prototype is useful locally but not yet a public commercial agent service.
Remaining work:

1. Add authentication, per-client authorization, rate limits, quotas, billing,
   request-size enforcement at the HTTP boundary, and abuse controls.
2. Publish formal JSON Schema or OpenAPI documents and add contract fixtures for
   every artifact type.
3. Replace free-form `intelligence.content` with provider adapters and strict
   schema-constrained model generation where available.
4. Add persistent job and artifact storage, idempotency keys, retrieval URLs,
   expiration policy, and audit/event records.
5. Add asynchronous jobs for image/audio/video generation. The prototype emits
   prompts and text packages only; it intentionally does not trigger paid media
   generation.
6. Make tone, theme, and `avoid` controls affect every generator explicitly.
   They are preserved in the request and record today, but legacy generators
   vary in how deeply they consume them.
7. Resolve competing legacy data shapes and image-format definitions before
   declaring a stable v1 protocol.
8. Add observability, latency/cost metadata, content-safety policy, caching,
   retries, and deployment tests.

## Verification

Run:

```bash
npm run test:agent
npm run build
npm run agent -- examples/agent-request.json
```

For an HTTP smoke test, start `npm run server`, submit the example to
`/api/v1/lens`, and verify HTTP 200 plus `ok: true`.
