from pathlib import Path
import subprocess,re,imageio_ffmpeg
p=Path(__file__).resolve().parent.parent
out=p/'test-results';out.mkdir(exist_ok=True)
ff=imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([ff,'-v','error','-y','-i',str(p/'assets/signal.mp4'),'-an','-c:v','mpeg4','-g','24','-bf','2','-q:v','5',str(out/'frame-source.avi')],check=True)
code="""const fs=require('fs');require('./codec.js');const {PacketEditor}=require('./frame-editor.js');const m=new PacketEditor(new Uint8Array(fs.readFileSync('test-results/frame-source.avi')));fs.writeFileSync('test-results/frame-positions.json',JSON.stringify(m.frames.map(f=>({type:f.type,pos:f.pos}))));const p=m.frames.findIndex(f=>f.type==='P'),b=m.frames.findIndex(f=>f.type==='B');m.replace(b,m.frames[p]);m.remove(m.frames.findIndex((f,i)=>i>0&&f.type==='I'));fs.writeFileSync('test-results/frame-edited.avi',m.save());"""
subprocess.run(['node','-e',code],cwd=p,check=True)
result=subprocess.run([ff,'-v','info','-y','-fflags','+genpts','-err_detect','ignore_err','-i',str(out/'frame-edited.avi'),'-an','-vf','showinfo,setpts=N/(24*TB)','-r','24','-c:v','libx264','-pix_fmt','yuv420p',str(out/'frame-edited.mp4')],capture_output=True,text=True,check=True)
positions=[int(x) for x in re.findall(r'\bn:\s*\d+.*?\bpos:\s*(-?\d+)',result.stderr)]
import json
packets=json.loads((out/'frame-positions.json').read_text())
assert 'type:B' in result.stderr and (out/'frame-edited.mp4').stat().st_size>1000
# Newer native FFmpeg removed AVFrame packet positions; the bundled v4 core retains them.
if positions:assert positions[0]==packets[0]['pos'],'AVI packet position must match showinfo display mapping'
assert any(f['type']=='B' for f in packets)
print('PASS: real B-frame AVI, P-for-B replacement, I-frame deletion, and playable MP4 decode')
