# Strandloom v0.1 QA

Local draft, checked 2026-11-11 on Olivers-MacBook-Air.local. No public repository, push or deployment was performed.

## Automated checks

- `npm run check`: syntax checks and 33 Node tests pass.
- Deterministic generation, all four presets, root anchors, volume behavior, mirrored edits including overlapping hits, layer isolation/visibility, length/smooth math, malformed import rejection, detached JSON round trips, OBJ contiguous indices, history limits, extreme repeated edits and no-op brush handling are covered.
- `npm run build`: static output produced from the final source; no network dependencies or install required.

## Observed browser checks

All app visits used **http://127.0.0.1:5197/**, never file URLs. Chrome rendered the genuine 3D preview on the Mac.

- All four presets render. Side view was visually inspected; reset and zoom controls were exercised. Back was invoked but not independently screenshot-verified.
- Actual native pointer drag with Comb edits 252 strands; undo returns to zero edited, redo restores the edited state.
- Hiding the selected layer removes its contribution and blocks subsequent strokes with a visible message.
- Preset replacement prompts when edits exist. Cancel preserves the selected preset and edits; confirmation rebuilds and clears layers, retaining undo.
- Add layer and rename to “Crown detail” work. Layer state restores on reload.
- Native file chooser successfully loads `tests/import-fixture.json`; app confirmation opens “Coil import check” with the cloud-coils preset. JSON model serialization/validation is tested independently.
- Final project-name persistence fixed to save during typing; “Chestnut study” survives reload.
- Final 390 × 844 CSS-pixel narrow view has document scroll width equal to client width (390); controls stack below the preview. Temporary viewport override reset after the capture.
- Final tab error logs were empty.
- Genuine desktop and narrow full-page JPEG captures are recorded, hashed and captioned in app.json. No screenshot manipulation or generated promotional artwork.

## Verification limits

- Clicking Save project produced the expected download-request status, but the browser download event timed out and completed native download bytes were not verified. PNG and OBJ native download completion also remains unverified. Export encoders, OBJ indices and JSON round trips are covered by model tests; no Blender/DCC import was run.
- Length and Smooth calculations are unit-tested. Their native drag gestures, interrupted pointer-capture cases, maximum-density interactive performance, clear/delete confirmation UI, keyboard orbit, storage failure and disabled-WebGL behavior have not all been independently exercised in the browser.
- Physical touch-device behavior, other GPUs/browsers, accessibility screen-reader experience and low-power performance are unverified. Local browser checks are not a production compatibility claim.
- The mannequin and hair are stylized procedural study assets. Visual inspection does not establish realistic hair quality. Approximate collision, crossing strands and sparse scalp coverage are expected limitations described in README.

## Local files

- App source is self-contained. Browser UI does not modify Persona Forge.
- Combined macOS/Windows/Linux/editor/Node .gitignore and MIT LICENSE included.
- Three.js MIT notice included. All mannequin/strand/interface art is original; no Reblium or Persona Forge character assets included.
- Tool Shed listing remains an unpublished preview with null launch/repository/verified fields.
