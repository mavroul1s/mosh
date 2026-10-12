# Validation

Checked on 11 October 2026 with Chromium in the Codex browser, served over localhost:

- Both embedded source clips and the pre-rendered demo load and play.
- Melt renders a playable MP4 with one retained I-frame and 190 P-frames.
- Bloom renders a playable MP4 with 90 repeated prediction frames (281 encoded frames total).
- Rupture, with two B-frames enabled, deletes 135 frames and repeats 8 prediction frames; the rebuilt AVI and decoded MP4 are downloadable.
- MP4 and AVI downloads completed through the visible browser download controls.
- Replacing source A with a local MP4 updates its filename and duration.
- Cancel terminates an active codec render while preserving prior output.
- At a 390px viewport, the document is 375px wide with no horizontal overflow. Desktop and mobile screenshots are included.
- Node codec checks pass for VOP classification, I-frame deletion, P-frame repetition, AVI reconstruction, and invalid-input rejection.
- JavaScript syntax checks pass.

The in-app browser blocks `file://` navigation, so opening by double-click was not directly browser-tested. All media, worker scripts, core JavaScript, and WebAssembly bytes are embedded; no external runtime resources are fetched. `tests/browser.py` is provided for an environment that permits local-file browser tests. An attempted Playwright launch on this Windows host failed with `spawn UNKNOWN`; that script was not claimed as passing.

## Minimal UI / Auto Mosh update

- Auto Mosh applies a balanced configuration and starts the worker in one click, retaining both source clips, their trims, selected size, and frame rate.
- The automatic demo render produced one I-frame and 223 P-frames, with 33 repeated frames. Its MP4 plays (9.33 seconds, readyState 4).
- The auto button and manual controls are disabled during rendering.
- A 390px viewport still has no horizontal overflow (375px document). Updated screenshots are included.

## JOIN and source-preview update — 12 October 2026

- Native MPEG-4 encode → JOIN surgery → MP4 decode produced exactly 288 frames at 24 fps (12 seconds) from two 7-second sources with a 2-second overlap.
- Codec checks cover preserved frame slots, the restored B anchor, zero overlap, short clips, rebuilt AVI index, and rejection of B-frame input for JOIN.
- The WASM browser render of the two 4-second demos produces a playable 6-second MP4 with 2-second overlap (readyState 4).
- Uploaded portrait H.264 MOV and VP9 WebM both appear immediately in the source preview; A/B controls identify the active clip. A JOIN render using both custom clips produced a playable MP4 and completed a download through the visible button.
- JOIN mobile layout has no horizontal overflow at 390px (375px document). `docs/join.png` shows the new mode.

## Direct packet editor — 12 October 2026

- The preloaded demo AVI exposes every packet with I/P/B colors and a real selection cursor. Mouse selection and Right-arrow stepping pause the video and seek to the selected packet's image.
- Delete, Undo, Redo, and Apply were exercised in the browser. Deleting one P-frame produced a refreshed frame bar and playable MP4.
- Load Frames with GOP 24 / B Frames 2 produced **10 I, 56 P, and 126 B packets**. B packet 3 seeks to 0.0625s, reflecting its decoded display position rather than its encoded index.
- Copying a P-frame over a B-frame, then Shift+Right to an I-frame and Delete, produced **9 I, 57 P, 125 B packets**. Applying decoded a playable 7.83s MP4 and the visible download completed as `edit.mp4`.
- Model tests cover raw packet bytes, type inheritance, deletion, undo/redo, invalid donors, last-frame protection, worker ArrayBuffer input, and B-frame display mapping.
- Native codec tests encode real B-frames, replace a B packet with a P packet, remove an I packet, and decode the edited AVI into a playable MP4.
- The frame editor has no horizontal document overflow at 390px (375px document). Its packet bar scrolls independently. Screenshot: `docs/frame-editor.png`.
