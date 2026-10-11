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
