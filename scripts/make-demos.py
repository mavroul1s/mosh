from pathlib import Path
import imageio_ffmpeg, subprocess
ff = imageio_ffmpeg.get_ffmpeg_exe()
Path('assets').mkdir(exist_ok=True)
filters = [
 'testsrc2=size=640x360:rate=24:duration=4',
 'mandelbrot=size=640x360:rate=24:outer=iteration_count:inner=period:start_scale=2.8:start_x=-0.6:start_y=0.1:end_scale=0.5'
]
for name, source in zip(['signal','orbit'], filters):
 subprocess.run([ff,'-y','-f','lavfi','-i',source,'-t','4','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',f'assets/{name}.mp4'],check=True)

