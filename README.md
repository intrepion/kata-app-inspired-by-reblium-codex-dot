# Kata Strandloom

**Shape a strand. Find a style.**

An original, local-first 3D hair-grooming study inspired by Reblium’s workflow. This is a separate app, not a Persona Forge feature or patch.

[← Kata Tool Shed](https://intrepion.github.io/tools/)

## Run locally

Requires Node.js 20 or newer and a recent browser with WebGL 2.

```sh
npm run dev
```

Open **http://127.0.0.1:5197/**. Do not open index.html as a file URL. No dependency installation or external CDN is needed. `PORT=5198 npm run dev` selects another local port.

```sh
npm run check
npm run build
```

The static deployment output is `dist/`. This repository and its Tool Shed entry are **unpublished local drafts**. There is no live app URL yet.

## What works

- Original procedural mannequin and four editable strand starting points: side sweep, soft bob, cloud coils and high crest.
- 200–1,800 paired-root strands with 22 segments each, rendered as tapered four-sided tubes. A simple scalp underlay fills the space between sparse study strands.
- Length, volume, curl, density and visual thickness controls.
- Root-to-tip color interpolation and five color pairs.
- Camera orbit, wheel/button zoom, front/side/back and reset views.
- Comb, lengthen/shorten and smooth brushes with screen-space radius, strength, root lock and optional mirrored edits.
- Up to eight reversible brush layers. Add, select, rename, hide, clear and delete them.
- 24-edit undo/redo, including individual brush strokes, preset replacement, layer changes and project import.
- Strictly validated JSON project backups and import; best-effort browser-local autosave.
- PNG viewport export and OBJ hair-polyline export.
- Responsive layout and keyboard-operated controls; pointer-based localized grooming remains a visual interaction.

## A quick session

1. Choose a starting shape and adjust the base sliders.
2. Choose **Comb**, **Length** or **Smooth**, then drag on visible hair. Length grows with an upward drag and shortens with a downward drag.
3. Use **Orbit**, or hold Alt while dragging, to work around the head. Shift temporarily smooths while grooming.
4. Add layers for experiments, and hide them to compare with the base. A hidden selected layer cannot receive strokes.
5. Download a project backup before closing or making a separate version.

Base shape changes rebuild the strands and clear brush layers. If any layer contains edits, the app asks first. Cancel preserves the old groom, and Undo can restore a completed rebuild. Color and thickness changes preserve the layers. Interrupted strokes are rolled back on pointer cancellation, lost capture, Escape or window blur.

### Keyboard

- Tab through controls. Arrow keys adjust native sliders.
- With the preview focused, arrow keys orbit and +/− zoom.
- Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z redoes outside text fields.
- Escape cancels a stroke or dismisses a dialog.

## Export contract

- **Project JSON:** Strandloom format v1. Parameters and reversible layer offsets, including hidden layers. Not a Reblium project. Import is capped at 8 MB.
- **PNG:** Current 3D viewport, including the original mannequin and scalp underlay, without app controls.
- **OBJ:** Hair only, one untextured 3D polyline per strand, Y up, arbitrary units. No mannequin, scalp, colors, thickness, bones or mesh faces. Some OBJ importers ignore line records; use an importer that supports edges/curves. This is not Alembic, FBX or a production groom interchange file.

Browser download behavior varies. The UI reports “download requested” rather than claiming that the file has been saved. See [QA.md](docs/QA.md) for observed native file-flow coverage.

## Honest limits

This is a **stylized procedural exercise**, not photorealistic hair, a digital-human generator, a salon simulation, a production DCC, or a substitute for artist-authored hair. The mannequin is intentionally simple. Presets are approximate shapes; cloud coils are a decorative curl study, not an anatomically accurate model of any hair type.

Brushes deform the sampled strand geometry. Comb does **not** preserve arc length; smooth and length operations are approximations. Roots are fixed and points are projected outside an approximate ellipsoidal head, but there is no full collision system, strand-to-strand collision, physics, self-shadowing groom shader, scalp painting, arbitrary mesh import, strand addition/deletion brush, facial rig, skin system, clothing, animation, hair-card baking, MetaHuman or Unreal integration.

Long or extreme edits may cross, clip ears/neck or overlap. The scalp underlay does not follow edits. Dense hair and large brush strokes may be slow. GPU/browser combinations beyond the tested Mac Chrome are unverified. Narrow-layout QA is desktop emulation, not a physical-phone test.

All project work stays in the browser. No analytics, API, account, upload or network service is used by the app. Autosave is local to this origin and browser, can fail when storage is full/disabled, and is not a durable backup. Undo history does not survive reload. Opening a project or changing a base does not affect Persona Forge.

## Inspiration and provenance

Researched 2026-11-11 from Reblium’s official documentation:

- [Hair tab](https://app.reblium.com/web/docs/hair-overview.html): one hair workspace, editable presets and an object manager.
- [Grooming](https://app.reblium.com/web/docs/grooming.html): hands-on brush editing, length changes, root lock, symmetry and reversible layers.
- [Reblium](https://app.reblium.com/): broader character/grooming product context.

Those ideas informed this original implementation, not its source code, UI artwork or proprietary assets. No Reblium assets or code were copied, and no claim of compatibility, affiliation or endorsement is made. The much broader product’s features are not implied here.

Original code, geometric mannequin, procedural strands, icons and interface: MIT, copyright 2026 intrepion. The locally bundled Three.js renderer has its own MIT notice in `vendor/THREE-LICENSE.txt`. See [THIRD_PARTY.md](docs/THIRD_PARTY.md).

## Development

`src/groom.js` is the pure deterministic model, validation, brushes, layers, OBJ export and history. `src/view.js` is the original Three.js renderer and picking. `src/app.js` handles controls, modal confirmations, input and local persistence. Tests run with Node’s built-in runner, without browser or package dependencies.
