import base64,json,pathlib
p=pathlib.Path(__file__).resolve().parent.parent
b64=lambda f:base64.b64encode((p/f).read_bytes()).decode()
data={ 'core':(p/'vendor/ffmpeg-core.js').read_text(encoding='utf-8'), 'wasm':b64('vendor/ffmpeg-core.wasm'), 'codec':(p/'codec.js').read_text(encoding='utf-8'), 'worker':(p/'engine-worker.js').read_text(encoding='utf-8'), 'demos':[b64('assets/signal.mp4'),b64('assets/orbit.mp4')], 'preview':b64('assets/preview.mp4'), 'frames':json.loads((p/'assets/frames.json').read_text(encoding='utf-8')) }
html=(p/'app.html').read_text(encoding='utf-8').replace('/*STYLE*/',(p/'style.css').read_text(encoding='utf-8')).replace('/*APP*/',(p/'app.js').read_text(encoding='utf-8')).replace('/*DATA*/',json.dumps(data,separators=(',',':')).replace('</','<\\/'))
(p/'index.html').write_text(html,encoding='utf-8')
print(f'Built standalone index.html: {len(html)/1048576:.1f} MB')
