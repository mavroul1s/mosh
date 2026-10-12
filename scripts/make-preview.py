import subprocess,pathlib,imageio_ffmpeg
p=pathlib.Path(__file__).resolve().parent.parent
ff=imageio_ffmpeg.get_ffmpeg_exe()
for n in ['signal','orbit']:
 subprocess.run([ff,'-y','-i',str(p/f'assets/{n}.mp4'),'-an','-c:v','mpeg4','-q:v','5','-g','120','-bf','0','-vtag','XVID',str(p/f'assets/{n}.avi')],check=True)
subprocess.run(['node',str(p/'scripts/preview-codec.cjs')],cwd=p,check=True)
(p/'assets/demo-frames.avi').write_bytes((p/'assets/preview.avi').read_bytes())
subprocess.run([ff,'-y','-fflags','+genpts','-err_detect','ignore_err','-i',str(p/'assets/preview.avi'),'-an','-vf','setpts=N/(24*TB)','-r','24','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(p/'assets/preview.mp4')],check=True)
