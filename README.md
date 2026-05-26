# Eidomancer V1

## Quick Start

Install dependencies, create a local environment file, then run the frontend and backend in two terminals:

```bash
npm install
cp .env.example .env
npm run server
npm run dev
```

The Vite frontend runs on its normal local dev port and proxies `/api` requests to the Express backend at `http://localhost:3001`.

## Production Runtime Overview

Eidomancer V1 is currently a React/Vite frontend with a small Express backend in `server.js`. The frontend owns the Daily Cast UI, artifact viewer, archive, output tools, and local persistence. The backend owns AI connectivity through `/api/generate`, `/api/cast`, and `/api/ai/status`.

For V1, the recommended deployment direction is hosted frontend plus hosted backend first. Desktop packaging, installers, auth, payment, cloud sync, and image/audio APIs should come later after the core flow is stable.

## Environment Variables

Copy `.env.example` to `.env` for local development. Safe placeholders are provided.

- `OPENAI_API_KEY`: server-side OpenAI API key. Required for live AI responses.
- `OPENAI_MODEL`: optional text model override. Defaults to `gpt-4.1-mini`.
- `PORT`: optional backend port. Defaults to `3001`.

Do not expose `.env` publicly. It is ignored by git.

## AI Connectivity

The active Daily Cast flow sends a structured prompt to `POST /api/generate`. If the backend is unavailable, the API key is missing, or the AI response cannot be used safely, Eidomancer falls back to deterministic local generation and marks the cast metadata as fallback/no-AI.

Package outputs are text-only in V1. Core Card Image Prompt and Echo Prompt prepare future image-generation prompts, but V1 does not call image or audio generation APIs from the active product flow.

## Local Data Storage

V1 stores user data in browser `localStorage`. Current active storage includes daily casts, saved artifacts, generated package outputs stored with artifacts, daily focus state, and local analytics/posture signals. There is no cloud sync or account system yet.

Clearing browser site data can remove local casts and saved artifacts.

## Build & Deploy Notes

Use `npm run build` to create the production frontend bundle in `dist/`. Use `npm run preview` to preview the built frontend locally. Use `npm run server` or `npm run start` to run the Express backend.

For V1, the simplest production shape is one Node web service:

- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Required environment variable: `OPENAI_API_KEY`
- Optional environment variables: `OPENAI_MODEL`, `PORT`

The Express server in `server.js` keeps API routes first, serves the built Vite files from `dist/`, and falls back to `dist/index.html` for app routes. The frontend uses same-origin `/api` routes, so the browser should call the same host for both the app and API.

On Render, create a Web Service from this app directory, set the build and start commands above, and add the environment variables in the Render dashboard. Keep `OPENAI_API_KEY` only on the server host.

## V1 Smoke Test Checklist

- Start the backend with `npm run server` or `npm run start`; confirm `http://localhost:3001/health` returns `{ "ok": true }`.
- Start the frontend with `npm run dev`; confirm the Daily page loads.
- With `OPENAI_API_KEY` configured, generate a Daily Cast and confirm the status shows AI-connected behavior.
- Without `OPENAI_API_KEY` or with the backend stopped, generate a Daily Cast and confirm deterministic fallback still produces a cast.
- Enter a question, tension, or focus and confirm the Daily Cast updates.
- Confirm the artifact image/card renders for the active cast.
- Open Depth Layers and confirm Signal, Tension, Pattern, Echo, and Guidance expand when available.
- Use Copy Layer and Copy All Layers; confirm clipboard text is sectioned and readable.
- Create Echo Prompt, Core Card Image Prompt, Song Package, YouTube Package, and Full Package outputs.
- Copy one individual generated output.
- Use Copy Full Package and Export Full Package; confirm exported `.txt` content is readable.
- Confirm generated artifacts are saved automatically in Saved Artifacts.
- Select a saved artifact and confirm the card, context, and saved outputs restore when available.
- Download the artifact image and confirm a PNG file is produced.
- Refresh the browser and confirm recent casts, saved artifacts, and generated outputs survive through `localStorage`.
- Confirm testers understand that clearing browser site data can remove local casts, artifacts, focus state, and package outputs.

## Private Alpha Release Checklist

- Configure server environment variables: `OPENAI_API_KEY`, optional `OPENAI_MODEL`, and optional `PORT`.
- Deploy the Express backend from `server.js`.
- Deploy the Vite frontend build from `dist/`.
- Confirm `/api` requests from the frontend reach the backend in the hosted environment.
- Confirm `/api/ai/status` reports the expected AI status.
- Test fallback behavior with AI unavailable.
- Confirm `localStorage` behavior is acceptable for private alpha users.
- Review README/user instructions before inviting testers.
- Choose an external payment/access method later; do not block private alpha on in-app payments.
- Confirm no secrets are committed and `.env` remains ignored.

## Eidomancer V1 UX Principle

V1 should use familiar, proven interaction patterns from tarot apps, journaling apps, D&D character sheets, music/content export tools, and cyberpunk dashboards. Do not reinvent basic UX patterns for V1.

Innovation should focus on the meaning layer: symbolic compression, Castfiles, theme translation, and generated package outputs. The interface should feel familiar enough to understand quickly, but distinctive enough to feel like Eidomancer.

## V1 Guided Flow

The intended V1 flow is: enter a question, tension, or focus; generate a Daily Cast; inspect the artifact and depth layers; create package outputs; then save and revisit artifacts through the archive.

## V1 Artifact System

Daily casts create artifacts that can be saved and restored from the archive. Artifacts may include cast context, depth layers, package outputs, mood, and viewing history. Older artifacts may only have partial data and should remain compatible.

## Artifact Normalization

V1 uses `src/lib/normalizeArtifact.js` as a defensive compatibility layer for current and legacy artifact shapes. It supplies safe defaults for rendering, section access, actions, package outputs, metadata, and `artifactVersion: "v1"` without migrating localStorage or rewriting archive history.

## Artifact Presentation Layer

Artifact meaning data should remain stable while presentation and theme layers stay swappable. `src/lib/artifactPresentation.js` begins separating section labels, frame variants, symbolic tones, and presentation tokens from normalized artifact data so future themes can change symbolic framing and visual language while reusing proven V1 UX structures.

## Artifact Text Safety

Generated artifact text can vary in length. V1 uses clamps, wrapping, and overflow safeguards to preserve the card layout. Future image-generation and export work should respect safe text zones.

## V1 Package Outputs

Package outputs are reusable materials derived from a cast: Echo Prompt, Song Package, YouTube Package, and Full Package. They can be copied or exported, and generated outputs can be saved with artifacts when available.

Core Card Image Prompt is a text-only image-generation readiness output. It prepares a tarot-style Core Card prompt from the cast and artifact context, with lightweight metadata such as orientation, intended use, aspect ratio, and rendering style. V1 does not call an image API yet.

## Output Routing

Generated outputs are beginning to use `src/lib/outputRegistry.js` as a lightweight routing registry. The registry keeps output keys, labels, descriptions, and intended uses together so future image, audio, and export actions can attach cleanly without changing the cast or artifact model.

## Artifact Mood Note

Artifact mood is currently lightweight and heuristic-based. It uses existing cast and artifact text to tint subtle UI presentation such as glow, gradient, and small mood badges. It is not yet a deep psychological model.

## Theme Framework Note

V1 currently defaults to the Emergent/Eidomancer visual language. Theme switching is not implemented yet, but visual tokens are beginning to move into `src/lib/themePalettes.js`. Future themes should reuse proven UX patterns while changing symbolic language, tone, palette, and imagery.

## Theme Scaffolding

V1 currently defaults to the Emergent/Eidomancer theme. Theme metadata is being centralized in `src/lib/themePalettes.js` so future user-selected themes can alter symbolic language, visual tone, palette, and artifact framing without changing artifact meaning data.

## Development Session Checklist

- Start the frontend and backend before testing app behavior.
- Make one small change at a time.
- Run `npm run build` after each stabilization pass.
- Commit stable checkpoints.
- Avoid reinventing basic UX patterns for V1.
