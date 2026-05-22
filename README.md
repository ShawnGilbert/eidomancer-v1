# React + Vite

## Eidomancer V1 UX Principle

V1 should use familiar, proven interaction patterns from tarot apps, journaling apps, D&D character sheets, music/content export tools, and cyberpunk dashboards. Do not reinvent basic UX patterns for V1.

Innovation should focus on the meaning layer: symbolic compression, Castfiles, theme translation, and generated package outputs. The interface should feel familiar enough to understand quickly, but distinctive enough to feel like Eidomancer.

## V1 Guided Flow

The intended V1 flow is: enter a question, tension, or focus; generate a Daily Cast; inspect the artifact and depth layers; create package outputs; then save and revisit artifacts through the archive.

## V1 Artifact System

Daily casts create artifacts that can be saved and restored from the archive. Artifacts may include cast context, depth layers, package outputs, mood, and viewing history. Older artifacts may only have partial data and should remain compatible.

## Artifact Normalization

V1 uses `src/lib/normalizeArtifact.js` as a defensive compatibility layer for current and legacy artifact shapes. It supplies safe defaults for rendering, section access, actions, package outputs, metadata, and `artifactVersion: "v1"` without migrating localStorage or rewriting archive history.

## Artifact Text Safety

Generated artifact text can vary in length. V1 uses clamps, wrapping, and overflow safeguards to preserve the card layout. Future image-generation and export work should respect safe text zones.

## V1 Package Outputs

Package outputs are reusable materials derived from a cast: Echo Prompt, Song Package, YouTube Package, and Full Package. They can be copied or exported, and generated outputs can be saved with artifacts when available.

Core Card Image Prompt is a text-only image-generation readiness output. It prepares a tarot-style Core Card prompt from the cast and artifact context, with lightweight metadata such as orientation, intended use, aspect ratio, and rendering style. V1 does not call an image API yet.

## Artifact Mood Note

Artifact mood is currently lightweight and heuristic-based. It uses existing cast and artifact text to tint subtle UI presentation such as glow, gradient, and small mood badges. It is not yet a deep psychological model.

## Theme Framework Note

V1 currently defaults to the Emergent/Eidomancer visual language. Theme switching is not implemented yet, but visual tokens are beginning to move into `src/lib/themePalettes.js`. Future themes should reuse proven UX patterns while changing symbolic language, tone, palette, and imagery.

## Development Session Checklist

- Start the frontend and backend before testing app behavior.
- Make one small change at a time.
- Run `npm run build` after each stabilization pass.
- Commit stable checkpoints.
- Avoid reinventing basic UX patterns for V1.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
