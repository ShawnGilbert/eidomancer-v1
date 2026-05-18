# Eidomancer Historical Architecture Inventory

This document maps the major architectural layers currently present in the
repository. Its purpose is to reduce cognitive load and make future cleanup
intentional.

Do not treat every dormant file as worthless. Some files are abandoned
implementation experiments, while others preserve useful product philosophy,
presentation patterns, or future feature ideas.

## Current Active Architecture

The active runtime path is intentionally narrow:

```text
src/main.jsx
  -> src/App.jsx
    -> src/pages/DailyPage.jsx
```

The current product architecture is the Daily Artifact flow:

- `src/pages/DailyPage.jsx`
  - Main current page.
  - Coordinates today's cast, artifact conversion, saved artifacts, focus input,
    recent daily casts, and daily sidebar UI.

- `src/hooks/useDailyCast.js`
  - Current daily-cast orchestration hook.
  - Loads today's cast, regenerates when focus changes, retries after offline
    fallback, logs local analytics, and handles sharing.

- `src/lib/dailyCast.js`
  - Current daily-cast generation wrapper.
  - Builds daily metadata, engagement mode, resonance seed, and delegates core
    meaning generation to `castEngine.js`.

- `src/lib/castEngine.js`
  - Current core meaning engine.
  - This is active and should not be touched casually.

- `src/lib/dailyCastStorage.js`
  - Current localStorage layer for daily casts.

- `src/lib/dailyFocusStorage.js`
  - Current localStorage layer for daily focus text.

- `src/lib/artifactAdapter.js`
  - Converts a generated cast into the artifact shape consumed by the artifact UI.

- `src/lib/artifactStorage.js`
  - Current localStorage layer for saved artifacts.
  - Owns artifact load, save, delete, and dedupe behavior.

- `src/components/daily/*`
  - Current daily cast UI.

- `src/components/artifact/*`
  - Current artifact display, save, download, and saved-artifact panel UI.

- `src/components/CoreCard.jsx` and `src/components/CardFrame.jsx`
  - Shared current presentation components used by the Daily UI.

## Dormant Subsystems

These files are not currently reachable from `src/main.jsx`, but they represent
historical product directions.

### General Question-to-Cast Workspace

Likely intended as an open-ended casting workspace rather than a daily-only
experience.

Representative files:

- `src/hooks/useEidomancerStore.jsx`
- `src/components/QuestionPanel.jsx`
- `src/components/ActiveCastCard.jsx`
- `src/components/RecentCastsPanel.jsx`
- `src/components/GeneratedOutputsPanel.jsx`
- `src/components/PackageActionsPanel.jsx`
- `src/lib/storage.js`
- `src/data/starterPrompts.js`

Observed design:

- User asks an arbitrary question.
- App generates a cast.
- Cast is stored in a recent-casts list.
- Additional assets can be generated from the cast.

Overlap with current architecture:

- Competes with the current daily-only flow.
- Uses different storage from current daily casts.
- Has its own AI status handling.
- Has its own recent-cast model.

### Reducer/Context Archive Shell

Likely an earlier app architecture based on global reducer state.

Representative files:

- `src/legacy/reducer-context-archive-shell/state/EidomancerContext.jsx`
- `src/legacy/reducer-context-archive-shell/state/eidomancerReducer.js`
- `src/legacy/reducer-context-archive-shell/state/initialState.js`
- `src/legacy/reducer-context-archive-shell/components/cast/CastInputPanel.jsx`
- `src/legacy/reducer-context-archive-shell/components/cast/CastResultPanel.jsx`
- `src/legacy/reducer-context-archive-shell/components/archive/ArchivePanel.jsx`

Observed design:

- A global provider owns input, active cast, raw response, status, and archive.
- Cast results are archived through reducer actions.
- UI is panel-based and appears older than the current Tailwind Daily Artifact flow.

Overlap with current architecture:

- Competes with `useDailyCast.js` as an application state model.
- Uses a separate archive storage namespace.
- Some files appear malformed or stale and should be handled cautiously.

### Generated Asset / Content Package System

Dormant, valuable, and intentionally preserved in place for now. This is not an
archive candidate during stabilization.

Representative files:

- `src/lib/packageGenerators.js`
- `src/components/GeneratedOutputsPanel.jsx`
- `src/components/PackageActionsPanel.jsx`
- `src/components/OutputSection.jsx`
- `src/lib/imageFormats.js`
- `src/lib/formatImage.js`

Observed design:

- Converts a cast into derived media packages:
  - Core Card
  - Echo image
  - Lyrics
  - Suno prompt
  - YouTube package
  - Specterr image prompt
  - Full package
- Expands one cast into reusable media outputs that could be copied, shared,
  prompted into image generation, or used as song/video packaging.

Why it may matter:

- This layer captures a strong future product direction: turning a symbolic cast
  into reusable creative artifacts.
- It may be worth preserving as reference even if not restored soon.
- `src/lib/packageGenerators.js` is especially valuable because it contains the
  richest expression of this product idea: cast flattening, format-specific
  prompts, image-format intent, lyrics, Suno prompt generation, YouTube metadata,
  Specterr-safe prompt language, and a full export bundle.
- The likely future version of this could become an "Expand Cast" or
  "Generate Media Package" feature.

Overlap with current architecture:

- Current Daily Artifact flow already creates and saves visual artifacts.
- This subsystem uses a broader asset-package model than the current artifact
  model.
- Do not merge this subsystem into the active Daily Artifact flow casually. It
  changes product scope from daily reflection/artifact preservation into
  multi-format content production.

Preserve in place for now:

- `src/lib/packageGenerators.js`
- `src/components/GeneratedOutputsPanel.jsx`
- `src/components/PackageActionsPanel.jsx`
- `src/components/ActiveCastCard.jsx`
- `src/components/TarotSectionCard.jsx`
- `src/data/sampleArtifact.js`
- `src/data/starterPrompts.js`

Lower-value duplicate candidates for later review:

- `src/lib/imageFormats.js`
- `src/lib/formatImage.js`
- `src/components/OutputSection.jsx`

## Legacy Experimental Systems

### Profile-Based Daily Card Prototype

Likely predates the current `dailyCast.js` architecture.

Representative files:

- `src/legacy/profile-daily-card-prototype/generateDailyCast.js`
- `src/legacy/profile-daily-card-prototype/defaultProfile.js`
- `src/legacy/profile-daily-card-prototype/store.js`
- `src/legacy/quarantined-dormant/DailyCardView.jsx.txt`
- `src/legacy/quarantined-dormant/DailyCardResult.jsx.txt`

Observed design:

- Generates a deterministic daily card from profile fields such as mood,
  energy, and focus.
- Stores cards and notes by day.
- Includes Suno-style prompt generation.

Overlap with current architecture:

- Competes directly with current `src/lib/dailyCast.js`.
- Uses a different daily-card storage model.
- Uses profile-driven inputs instead of the current focus/history/resonance
  approach.

### Quarantined Dormant Files

Located at:

- `src/legacy/quarantined-dormant/`

These were moved because they were clearly dormant or broken prototypes. They
are preserved for reference and should not be treated as deleted history.

## Storage Namespaces

Current active storage:

- `eidomancer_daily_casts_v1`
  - Owned by `src/lib/dailyCastStorage.js`.
  - Stores current daily casts.

- `eidomancer_daily_focus_v1`
  - Owned by `src/lib/dailyFocusStorage.js`.
  - Stores current daily focus text by date.

- `eidomancer_artifact_history_v1`
  - Owned by `src/lib/artifactStorage.js`.
  - Stores saved artifacts.

- `eidomancer_local_analytics_v1`
  - Owned by `src/lib/localAnalytics.js`.
  - Stores local analytics events.

- `eidomancer_last_visit_date_v1`
  - Owned by `src/lib/localAnalytics.js`.
  - Tracks return visits.

Dormant or legacy storage:

- `eidomancer_recent_casts_v1`
  - Owned by `src/lib/storage.js`.
  - Used by the dormant general question-to-cast workspace.

- `eidomancer-archive-v1`
  - Owned by `src/legacy/reducer-context-archive-shell/state/EidomancerContext.jsx`.
  - Used by the dormant reducer/context archive shell.

- `eidomancer_card_` and `eidomancer_note_`
  - Owned by `src/legacy/profile-daily-card-prototype/store.js`.
  - Used by the older profile-based daily card prototype.

## Competing Architectures Still Present

1. Current Daily Artifact architecture
   - `src/pages/DailyPage.jsx`
   - `src/hooks/useDailyCast.js`
   - `src/lib/dailyCast.js`
   - `src/lib/artifactAdapter.js`
   - `src/lib/artifactStorage.js`

2. Dormant open-ended question/cast workspace
   - `src/hooks/useEidomancerStore.jsx`
   - `src/components/QuestionPanel.jsx`
   - `src/components/ActiveCastCard.jsx`
   - `src/components/RecentCastsPanel.jsx`
   - `src/lib/storage.js`

3. Dormant reducer/context/archive app shell
   - `src/legacy/reducer-context-archive-shell/*`

4. Older profile-based daily-card system
   - `src/legacy/profile-daily-card-prototype/generateDailyCast.js`
   - `src/legacy/profile-daily-card-prototype/store.js`
   - `src/legacy/profile-daily-card-prototype/defaultProfile.js`

5. Duplicate server concepts
   - `server.js` is the active package script target.
   - `server.mjs` appears to be an older image-only server.

6. Multiple image-format definitions
   - `src/lib/packageGenerators.js`
   - `src/lib/imageFormats.js`
   - `src/lib/formatImage.js`

## Classification

### Active Core

Do not archive or rewrite without a focused plan:

- `src/main.jsx`
- `src/App.jsx`
- `src/pages/DailyPage.jsx`
- `src/hooks/useDailyCast.js`
- `src/lib/dailyCast.js`
- `src/lib/castEngine.js`
- `src/lib/dailyCastStorage.js`
- `src/lib/dailyFocusStorage.js`
- `src/lib/artifactAdapter.js`
- `src/lib/artifactStorage.js`
- `src/lib/engagementMode.js`
- `src/lib/resonanceEngine.js`
- `src/lib/shareText.js`
- `src/lib/localAnalytics.js`
- `src/lib/freemiumGate.js`
- `src/components/daily/*`
- `src/components/artifact/*`
- `src/components/CoreCard.jsx`
- `src/components/CardFrame.jsx`
- `server.js`

### Archive Candidates

Likely safe to quarantine later after a confirmation pass:

- `src/legacy/quarantined-dormant/*`
- `src/legacy/profile-daily-card-prototype/*`
- `src/legacy/reducer-context-archive-shell/*`
- `server.mjs`
- `src/App.css`
- `src/assets/react.svg`

### Valuable References

Dormant, but preserve as product/design reference until deliberately mined:

- `src/lib/packageGenerators.js`
- `src/components/GeneratedOutputsPanel.jsx`
- `src/components/PackageActionsPanel.jsx`
- `src/components/OutputSection.jsx`
- `src/components/ActiveCastCard.jsx`
- `src/components/TarotSectionCard.jsx`
- `src/components/CardFrame.jsx`
- `src/components/CoreCard.jsx`
- `src/data/sampleArtifact.js`
- `src/data/starterPrompts.js`
- `src/lib/imageFormats.js`
- `src/lib/formatImage.js`

### Dangerous To Touch Prematurely

Avoid changing these until the surrounding behavior is tested and understood:

- `src/lib/castEngine.js`
  - Core meaning engine.

- `src/lib/dailyCast.js`
  - Current bridge between daily context and the core meaning engine.

- `src/hooks/useDailyCast.js`
  - Current orchestration layer with async generation, retry, focus, history,
    analytics, and share behavior.

- `src/lib/dailyCastStorage.js`
  - Current user-facing daily history storage.

- `src/lib/artifactStorage.js`
  - Current saved artifact storage.

- `src/components/CoreCard.jsx`
  - Shared by current Daily UI.

- `src/components/CardFrame.jsx`
  - Shared by current Daily UI.

- `server.js`
  - Current backend for AI status and generation.

## Recommended Future Cleanup Order

1. Keep this inventory current.
   - Update it whenever files are quarantined or restored.

2. Add comments or a README inside `src/legacy/quarantined-dormant/`.
   - Clarify why those files were quarantined and when.

3. Keep the old profile-based daily-card prototype archived.
   - Current location: `src/legacy/profile-daily-card-prototype/`.
   - Mine it only if mood/energy/focus profiles, streaks, notes, or music prompt
     ideas return to the product.

4. Keep the reducer/context archive shell archived.
   - Current location: `src/legacy/reducer-context-archive-shell/`.
   - Treat malformed files carefully if this shell is ever inspected or restored.

5. Evaluate the generated asset package system.
   - Decide whether to archive, revive, or adapt it into the current artifact
     model.
   - Do not merge it into current runtime casually.

6. Resolve duplicate image-format definitions.
   - Only after deciding whether the package system survives.

7. Review server duplication.
   - Confirm whether `server.mjs` is unused outside package scripts before
     quarantine.

8. Only then consider deeper refactors around `castEngine.js`.
   - Any work there should have a focused test/verification plan.
