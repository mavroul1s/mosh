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
