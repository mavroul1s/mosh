import base64,json,pathlib,os,tempfile,time
p=pathlib.Path(__file__).resolve().parent.parent
b64=lambda f:base64.b64encode((p/f).read_bytes()).decode()
data={ 'core':(p/'vendor/ffmpeg-core.js').read_text(encoding='utf-8'), 'wasm':b64('vendor/ffmpeg-core.wasm'), 'codec':(p/'codec.js').read_text(encoding='utf-8'), 'worker':(p/'engine-worker.js').read_text(encoding='utf-8'), 'demos':[b64('assets/signal.mp4'),b64('assets/orbit.mp4')], 'preview':b64('assets/preview.mp4'), 'previewAVI':b64('assets/demo-frames.avi'), 'frames':json.loads((p/'assets/frames.json').read_text(encoding='utf-8')) }
html=(p/'app.html').read_text(encoding='utf-8').replace('/*STYLE*/',(p/'style.css').read_text(encoding='utf-8')).replace('/*APP*/',(p/'app.js').read_text(encoding='utf-8')).replace('/*CODEC*/',(p/'codec.js').read_text(encoding='utf-8')).replace('/*FRAME_EDITOR*/',(p/'frame-editor.js').read_text(encoding='utf-8')).replace('/*DATA*/',json.dumps(data,separators=(',',':')).replace('</','<\\/'))
with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=p,suffix='.tmp',delete=False) as f:
 f.write(html)
 staged=pathlib.Path(f.name)
try:
 for attempt in range(10):
  try:
   os.replace(staged,p/'index.html')
   break
  except OSError:
   if attempt==9:raise
   time.sleep(.2)
finally:
 if staged.exists():staged.unlink()
print(f'Built standalone index.html: {len(html)/1048576:.1f} MB')
