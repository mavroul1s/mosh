from pathlib import Path
import subprocess, imageio_ffmpeg
p=Path(__file__).resolve().parent.parent
out=p/'test-results';out.mkdir(exist_ok=True)
ff=imageio_ffmpeg.get_ffmpeg_exe()
for i,name in enumerate(['signal','orbit']):
 subprocess.run([ff,'-v','error','-y','-stream_loop','1','-i',str(p/f'assets/{name}.mp4'),'-t','7','-an','-vf','scale=320:180,fps=24','-c:v','mpeg4','-q:v','5','-g','600','-bf','0','-force_key_frames','2' if i else '0','-vtag','XVID',str(out/f'join-{i}.avi')],check=True)
code="""const fs=require('fs');require('./codec.js');const r=AVI.joined(new Uint8Array(fs.readFileSync('test-results/join-0.avi')),new Uint8Array(fs.readFileSync('test-results/join-1.avi')),{fps:24,overlap:2});fs.writeFileSync('test-results/join-native.avi',r.bytes);if(r.frames.length!==288)throw Error('Incorrect frame count');console.log(r.duration);"""
subprocess.run(['node','-e',code],cwd=p,check=True)
subprocess.run([ff,'-v','error','-y','-fflags','+genpts','-err_detect','ignore_err','-i',str(out/'join-native.avi'),'-an','-vf','setpts=N/(24*TB)','-r','24','-c:v','libx264','-pix_fmt','yuv420p',str(out/'join-native.mp4')],check=True)
decoded=subprocess.run([ff,'-v','error','-i',str(out/'join-native.mp4'),'-an','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True).stdout
assert len(decoded)==288*320*180*3, f'Decoded {len(decoded)//(320*180*3)} frames, expected 288'
print('PASS: real MPEG-4 JOIN decodes to a 12-second MP4 (288 frames at 24fps)')
