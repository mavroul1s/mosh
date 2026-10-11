# Codec provenance

The runtime bundles the unmodified single-thread `@ffmpeg/core-st` **0.11.1** distribution from:

- Package: https://www.npmjs.com/package/@ffmpeg/core-st/v/0.11.1
- Exact distribution: https://registry.npmjs.org/@ffmpeg/core-st/-/core-st-0.11.1.tgz
- FFmpeg fork and source/build scripts: https://github.com/ffmpegwasm/FFmpeg
- Browser core build repository: https://github.com/ffmpegwasm/ffmpeg.wasm-core
- FFmpeg upstream: https://ffmpeg.org/
- FFmpeg license/build information: https://ffmpeg.org/legal.html

The package metadata identifies its JavaScript wrapper license as MIT, author Jerome Wu. The embedded FFmpeg codec build includes GPL components such as libx264; the combined binary is distributed under GPL terms. The application uses GPL-3.0-or-later accordingly. The vendored package metadata is preserved in `vendor/package.json`. The scripts and binary are embedded verbatim in `index.html` by `scripts/build.py`.

MIT notice for ffmpeg.wasm (Copyright (c) 2019 Jerome Wu):

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
