const $=id=>document.getElementById(id),data=JSON.parse($('runtime-data').textContent);
function bytes(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
function blobURL(content,type){return URL.createObjectURL(new Blob([content],{type}));}
const demos=data.demos.map(bytes),inputs=demos.map(a=>a.slice()),sourceURLs=demos.map(a=>blobURL(a,'video/mp4'));
let outputURL=blobURL(bytes(data.preview),'video/mp4'),aviURL=null,worker=null,busy=false,renderTimer=null;
const output=$('output'),original=$('original');
output.src=outputURL;original.src=sourceURLs[0];
for(let i=0;i<2;i++){$('thumb'+i).src=sourceURLs[i];$('thumb'+i).addEventListener('loadeddata',()=>{try{$('thumb'+i).currentTime=.7;}catch{}});}
output.play().catch(()=>{$('play').textContent='PLAY';});
function notice(s){$('notice').textContent=s;}
function activeVideo(){return original.hidden?output:original;}
function stamp(t){return Number.isFinite(t)?`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`:'00:00';}
for(const v of [output,original]){v.addEventListener('timeupdate',()=>{if(v===activeVideo())$('time').textContent=`${stamp(v.currentTime)} / ${stamp(v.duration)}`;});v.addEventListener('play',()=>{$('play').textContent='PAUSE';});v.addEventListener('pause',()=>{$('play').textContent='PLAY';});}
$('play').onclick=()=>{const v=activeVideo();v.paused?v.play().catch(e=>notice(e.message)):v.pause();};
$('restart').onclick=()=>{activeVideo().currentTime=0;};
$('fullscreen').onclick=()=>document.querySelector('.monitor').requestFullscreen?.().catch(e=>notice(e.message));
function view(source){activeVideo().pause();original.hidden=!source;output.hidden=source;$('sourceView').classList.toggle('active',source);$('effectView').classList.toggle('active',!source);$('mode').textContent=source?'SOURCE / A':'OUTPUT / MOSHED';activeVideo().play().catch(()=>{});}
$('effectView').onclick=()=>view(false);$('sourceView').onclick=()=>view(true);
function map(frames){const box=$('frameMap');box.replaceChildren();const stride=Math.max(1,Math.ceil(frames.length/220));for(let i=0;i<frames.length;i+=stride){const t=frames[i],el=document.createElement('i');el.className=t;el.title=`Frame ${i+1} / ${t}`;box.append(el);}const count=t=>frames.filter(x=>x===t).length;$('frameInfo').textContent=`I × ${count('I')} / P × ${count('P')} / B × ${count('B')}`;}
map(data.frames);
function update(){for(const id of ['repeat','interval','dropP'])$(''+id+'Val').textContent=id==='repeat'?$('repeat').value+'×':id==='dropP'&&$('dropP').value==='0'?'OFF':$(id).value+' frames';}
for(const id of ['repeat','interval','dropP'])$(id).oninput=()=>{update();dirty();};
function dirty(){if(!busy)notice('Rules changed. Press Datamosh to apply.');}
for(const el of document.querySelectorAll('aside input, aside select, .trim input'))el.addEventListener('change',dirty);
const presets={melt:{repeat:1,interval:12,dropP:0,dropB:false,bframes:0},bloom:{repeat:7,interval:6,dropP:0,dropB:false,bframes:0},rupture:{repeat:3,interval:7,dropP:4,dropB:true,bframes:2}};
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{for(const [k,v]of Object.entries(presets[b.dataset.preset]))typeof v==='boolean'?$(k).checked=v:$(k).value=v;$('allI').checked=true;document.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('active',x===b));update();dirty();});
async function replace(i,file){if(!file||busy)return;if(file.size>150*1024*1024){notice('Use a clip under 150 MB. Trim large files first.');return;}try{const a=new Uint8Array(await file.arrayBuffer());inputs[i]=a;URL.revokeObjectURL(sourceURLs[i]);sourceURLs[i]=blobURL(a,file.type||'video/mp4');$('thumb'+i).src=sourceURLs[i];if(i===0)original.src=sourceURLs[i];$('name'+i).textContent=file.name;$('meta'+i).textContent=`${(file.size/1048576).toFixed(1)} MB / ${i?'motion donor':'seed image'}`;$('in'+i).value=0;$('thumb'+i).onloadedmetadata=()=>{const dur=$('thumb'+i).duration;if(Number.isFinite(dur)){$('len'+i).value=Math.min(4,dur).toFixed(1);$('meta'+i).textContent=`${dur.toFixed(1)}s / ${i?'motion donor':'seed image'}`;}};notice('Clip ready. Set the trim, then Datamosh.');}catch(e){notice('Could not read clip: '+e.message);}}
for(let i=0;i<2;i++){$('file'+i).onchange=e=>replace(i,e.target.files[0]);const zone=document.querySelector(`[data-slot="${i}"]`);zone.ondragover=e=>{e.preventDefault();zone.classList.add('drag');};zone.ondragleave=()=>zone.classList.remove('drag');zone.ondrop=e=>{e.preventDefault();zone.classList.remove('drag');replace(i,e.dataTransfer.files[0]);};}
$('reset').onclick=()=>{if(busy)return;for(let i=0;i<2;i++){inputs[i]=demos[i].slice();URL.revokeObjectURL(sourceURLs[i]);sourceURLs[i]=blobURL(inputs[i],'video/mp4');$('thumb'+i).src=sourceURLs[i];$('name'+i).textContent=i?'LIQUID ORBIT':'SIGNAL TEST';$('meta'+i).textContent=`4.0s / ${i?'motion donor':'seed image'}`;$('in'+i).value=0;$('len'+i).value=4;$('file'+i).value='';}original.src=sourceURLs[0];document.querySelector('[data-preset="melt"]').click();setResult(bytes(data.preview),null,data.frames);notice('Demo restored. Ready to break.');};
function options(){const width=+$('size').value;const o={width,height:width*9/16,fps:+$('fps').value,gop:+$('gop').value,bframes:+$('bframes').value,quality:+$('quality').value,allI:$('allI').checked,dropB:$('dropB').checked,repeat:+$('repeat').value,interval:+$('interval').value,dropP:+$('dropP').value,starts:[+$('in0').value,+$('in1').value],lengths:[+$('len0').value,+$('len1').value]};if(o.starts.some(x=>!Number.isFinite(x)||x<0)||o.lengths.some(x=>!Number.isFinite(x)||x<.2||x>30)||!Number.isInteger(o.gop)||o.gop<2||o.gop>600||o.quality<2||o.quality>31)throw Error('Check trims (0.2–30s), GOP (2–600), and quantizer (2–31).');return o;}
function lock(b){busy=b;$('processing').hidden=!b;for(const el of document.querySelectorAll('aside input, aside select, .trim input, .presets button, #render, #reset, #file0, #file1'))el.disabled=b;}
function setResult(video,avi,frames){if(outputURL)URL.revokeObjectURL(outputURL);outputURL=blobURL(video,'video/mp4');output.src=outputURL;if(aviURL)URL.revokeObjectURL(aviURL);aviURL=avi?blobURL(avi,'video/x-msvideo'):null;$('downloadAvi').hidden=!aviURL;map(frames);view(false);}
let runtimeURLs=[];
function teardown(){worker?.terminate();worker=null;runtimeURLs.forEach(URL.revokeObjectURL);runtimeURLs=[];clearTimeout(renderTimer);}
$('render').onclick=async()=>{if(busy)return;let o;try{o=options();}catch(e){notice(e.message);return;}lock(true);activeVideo().pause();$('stage').textContent='Starting local codec';$('progress').style.width='3%';notice('Encoding on your device. Keep this tab open.');renderTimer=setTimeout(()=>{teardown();lock(false);notice('Render timed out. Try shorter trims or 640 × 360.');},180000);
try{if(!worker){const coreURL=blobURL(data.core,'application/javascript'),codecURL=blobURL(data.codec,'application/javascript'),workerURL=blobURL(data.worker,'application/javascript');runtimeURLs=[coreURL,codecURL,workerURL];worker=new Worker(workerURL);worker.onerror=e=>{teardown();lock(false);notice('Engine error: '+e.message);};worker.onmessage=({data:r})=>{if(r.ready){worker.postMessage({action:'render',inputs:inputs.map(x=>x.slice().buffer),options:o});}else if(r.stage){$('stage').textContent=r.stage;$('progress').style.width=r.progress+'%';}else if(r.error){teardown();lock(false);notice('Render failed: '+r.error);}else if(r.done){clearTimeout(renderTimer);lock(false);setResult(r.video,r.avi,r.frames);$('stats').textContent=`${r.stats.removed} deleted / ${r.stats.repeated} repeated`;$('resolution').textContent=`${o.width} × ${o.height}`;notice('Done. Preview and MP4 are the same render.');teardown();}};const wasm=bytes(data.wasm);worker.postMessage({action:'init',coreURL,codecURL,wasm},[wasm.buffer]);}}catch(e){teardown();lock(false);notice('Unable to start codec: '+e.message);}};
$('cancel').onclick=()=>{teardown();lock(false);notice('Render cancelled. Previous output retained.');};
function download(url,name){if(!url)return;const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();}
$('download').onclick=()=>download(outputURL,'mosh.mp4');$('downloadAvi').onclick=()=>download(aviURL,'mosh-raw.avi');
$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|SELECT|BUTTON/.test(e.target.tagName)&&!$('helpDialog').open){e.preventDefault();$('play').click();}});
update();

