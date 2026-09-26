# Step 3C-M — memory-village manual commissioning

**Scope:** one fictional seed, two branches, three manually mediated external-intelligence interactions (B1 generation, B2 generation, one evaluation). No direct model integration, other seeds, 100-Crystal experiment, Git commit, push, or merge. Recovered Git HEAD remains `2221d82c1984507d0c28c974a8adce8f0fcfc5da`.

## Outcome

**Crystal:** `crystal:sha256:4aa872f8a984e052de828e648f93b7888338712876fded39895f7585db654d5d`.

A fresh store instance retrieves this Crystal as **`complete`** with **22 verified required references**. Replaying the three manually supplied response byte files produced exactly the same Crystal ID. This confirms identity and closure of the declared fictional result, not factual truth, novelty superiority, or independent verification of the reported model.

| Branch | Submitted intent / hard constraint | Observed result | Evaluation and audit |
| --- | --- | --- | --- |
| B1 | Public ledger; under unchanged R0 private recall `<= 3`, public inscriptions available | Candidate has recall `3`, check passed; obligations migrate to a ledger and disputes toward record governance | Evaluator said `retain`. Branch retained as an evaluated, fictional successor; ledger governance remains underspecified. |
| B2 | Unexplained private recall on exchange 4; unchanged R0 | Candidate has recall `4`, check failed; attempted transition and model response preserved, **no valid successor World state** | Evaluator said `retain_negative_finding`; branch pruned from the frontier, with evaluation, audit, and **open** fictional inconsistency Crack. Its failure is not evidence that R0 is false or retroactively changed. |

The significant evaluated consequence is the shift from remembering private obligations to governing a shared public ledger: inscription, interpretation, contest, and amendment. The preserved negative territory identifies exactly which branch is unreachable under R0.

## Provenance and resource account

- Adapter-boundary requests, response bytes, content types, encodings, base64, SHA-256, completion statuses and caller-assigned request IDs are retained in immutable `intelligence_response` records. The manually supplied raw text files are in this directory; `replay.mjs` replays their bytes without calling or simulating a model.
- Provider `OpenAI` and model `GPT-5.6 Sol` are **reported by the user**, recorded with `identification_status: caller_reported`; Work did not verify provider identity. The user reported `complete` for all three responses. Provider request IDs and usage were unavailable (`unknown`). Three calls were reported; precise tokens, time, and money are unknown.
- The Work-visible external responses were transcribed as UTF-8 JSON text into the manual adapter. Work cannot verify provider/network transport bytes, the actual external UI submission, or whether the external UI preserved an identical prompt. The initial generation requests sent typed reference IDs; the user-facing transport packets additionally resolved context for the model. This supplemental context is documented in this commissioning report and the request files, but is **not** part of the engine's B1/B2 adapter-boundary request bytes.
- Evaluation was a separate captured `intelligence_response`. The JSON was parsed under the strict profile, checked for the expected fields and decisions, and copied into two append-only `evaluation_record`s through an attributable extraction operation. The manual assembly operation records the authored manifest transformation. No model text was silently corrected.
- B1 request SHA-256 `d6b61161bb22d1d228f821dc71ebc9653e76172913114c6e1bb1185efeac0cc2`; response `8ee017f6eaf46f4226cf9ce0c3cd222e72061457ab1844fa204d9da29df99601`.
- B2 request SHA-256 `b1df8d754529b16c0d1abeeb0bc491bcc89a99b88d3dca341626fc64a714f918`; response `48181959f6a8f82313514fbd22df620e8505f8c17717d1ef7839e94512b17594`.
- Evaluation request SHA-256 `8b9876160d1c0f0704c4fac7e9414ebd237a2892a23e35c798e94fd4e71e79aa`; response `2cba5a3387731d1f5042f512be1ee91a41da666f4225ebab4425f8080b349b0d`.
- Extraction/validation failures: none. Retries: none. The B2 mechanical failure is an expected negative finding, not an extraction failure.

## Interpretation and problems found

1. **Engine/protocol:** the `generateSuccessors` adapter request contains only typed IDs, branch intent and request ID; a model outside the object store cannot interpret these without supplementary resolved records. Manual transport supplied those facts separately. The existing `evaluate()` convenience method points `intelligence_response_ref` to the generating response and has no separate evaluator capture. This run used existing generic records and the capture boundary directly to avoid misattribution. `makeManifest()` hardcodes a fixture source label; manual assembly corrected this **only in this Crystal payload**, with an immutable operation disclosing the correction. No engine module was changed.
2. **External intelligence/adapter:** Work had no directly callable real text-model capability. The user mediated three reported interactions. Original provider transport bytes, submitted UI prompt, provider request ID, usage, and provider identity are unverifiable from Work. The adapter captured exactly the *manually supplied* bytes, not purported network bytes.
3. **Constraints/seed:** R0 has a deliberately simple predicate. B2 was designed to challenge that boundary and therefore failing it does not by itself demonstrate open-ended discovery. The ledger seed leaves governance, amendment, authentication, and dispute resolution unspecified. These remain valid extension questions, not repaired assumptions.
4. **Possible useful novelty:** the B1 response made the governance shift explicit; the B2 path yielded an addressable negative result and Crack. This suggests the bounded exploration can retain useful conditional territory. **No direct-question baseline was run**, and the evaluator's comparison with a *likely* direct answer is speculation, not evidence of superiority. The prior scripted fixture proves plumbing only.

**Smallest justified next changes, proposed only:** expose resolved immutable context to the external model inside a captured adapter-boundary request; add an evaluation capture path that references the actual evaluator response; make the manifest's source-scope label supplied by the caller rather than fixture-specific. These are not implemented here and do not change Canon or Crystal Spec.

## Reproduction

Run `node commissioning/memory-village/replay.mjs` from the repository root. It reads the three `*.response.adapter-boundary.json` files and the saved evaluation request; it does not query a provider. The script verifies B1/B2 record identity, exact R0 rejection, and the complete Crystal closure, and writes `commissioning-result.json`. The store is `commissioning/memory-village/objects-v0.1`. Detailed IDs and checks are in `commissioning-result.json`, `ingest-b1-result.json`, and `ingest-b2-result.json`.

Tests: `node --test test/exploration*.test.js` passed 11/11 after this run. No tracked v0.2 source or frozen evidence was changed.
