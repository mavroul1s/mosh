# MOSH / Frame surgery

**[Open the app →](https://mavroul1s.github.io/mosh/)**

A minimal, local video datamoshing desk. Actual MPEG-4 I/P/B-frame editing, two built-in clips, preview, and MP4 / raw AVI downloads. No account, uploads, server, or CDN.

![The editing desk](docs/desktop.png)

## Open locally

Download **[index.html](https://github.com/mavroul1s/mosh/releases/latest/download/index.html)** and double-click it. All scripts, the single-thread WebAssembly codec, and demo videos are embedded in this one file (~34 MB). Use current desktop Chrome or Edge for the best performance. You can also clone or download this repository and open `index.html` directly.

## Use

1. The demo opens with both videos loaded and a finished effect ready to play or download.
2. Replace A (the seed image) and B (the motion donor), or drop a video onto either source. Set IN and LEN in seconds.
3. Press **Auto Mosh** to choose balanced settings and render immediately. For manual control, pick **Melt**, **Bloom**, or **Rupture**. Adjust frame deletion, P-frame repeats, repeat interval, and B-frame deletion. Expand **Output** for size, FPS, GOP, B-frame encoding, and MPEG-4 quantizer.
4. Press **Mosh**. The frame map describes the resulting encoded stream. Download the preview as MP4, or download the damaged AVI for further editing.

Space toggles playback. The `?` button contains help. Changes apply on render; the prior output remains available until the next render succeeds.

## What the engine does

Both sources are trimmed and normalized to the same dimensions, frame rate, aspect ratio, and MPEG-4 Part 2 codec. They are encoded into video-only AVI containers. The parser walks RIFF chunks and classifies MPEG-4 VOPs from their `00 00 01 B6` start codes. It keeps the first anchor, optionally deletes later I-frames, drops selected P/B-frames, and duplicates selected P-frames from B. It rebuilds the AVI frame counts, `movi` chunks, and `idx1` index. FFmpeg then decodes the damaged prediction chain and renders an H.264 MP4 with new timestamps.

This is compressed-frame manipulation, rather than a canvas glitch simulation. Results depend on the footage and motion vectors; MPEG-4 corruption is deliberately unpredictable. Deleting I-frames is the main transition effect. Repeating P-frames blooms the accumulated motion. Disabling I-frame deletion retains the original anchors.

## Practical limits

- Exports are **silent**. Audio tracks are not included.
- Trims are 0.2–30 seconds per source; input files are capped at 150 MB each. The browser holds input and codec buffers in memory. Short clips and 640 × 360 are fastest.
- Common browser/FFmpeg-compatible formats are accepted, including MP4, WebM, MOV, MKV, and AVI. Unavailable codecs or damaged inputs produce an error without replacing the previous result.
- Aspect ratio is preserved with letterboxing to the selected 16:9 output. More repeated frames lengthen the output.
- There is no timeline scrubbing of individual source packets or direct hand editing of original codec frames as in Avidemux. Source video is re-encoded into a consistent MPEG-4 stream before surgery.
- Raw damaged AVI may display differently across decoders. The MP4 is the exact output shown by the preview.
- Rendering can take time on slower devices. Cancel terminates the worker; renders have a three-minute limit. Mobile memory limits may prevent larger renders.

## Build and verify

The project intentionally uses plain HTML, CSS, and JavaScript with no frontend build dependency.

```sh
python scripts/build.py
```

This embeds the source files, vendored codec, and demo assets into `index.html`. To regenerate the synthetic demo clips and their corrupted preview:

```sh
python -m pip install imageio-ffmpeg
python scripts/make-demos.py
python scripts/make-preview.py
python scripts/build.py
```

Node.js is needed for the AVI manipulation step. To run the browser integration checks:

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser.py
```

The tests open the standalone HTML through `file://`, exercise all three presets through the actual WASM codec, download MP4 and AVI, check cancellation, and check mobile layout. The two synthetic demo videos are generated specifically for this project with FFmpeg filters, without third-party footage.

## Credits and licenses

Application source: GPL-3.0-or-later. See [LICENSE](LICENSE). The bundled codec is `@ffmpeg/core-st` 0.11.1; see [THIRD_PARTY.md](THIRD_PARTY.md) for upstream source, build information, and license notices.
