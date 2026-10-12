let core,complete,logs=[],positions=[];
function log(s){logs.push(s);if(logs.length>24)logs.shift();const frame=/\bn:\s*(\d+).*\bpos:\s*(-?\d+)/.exec(s);if(frame)positions[+frame[1]]=+frame[2];if(s==='FFMPEG_END'&&complete){complete();complete=null;}}
async function run(args){logs=[];const argv=['ffmpeg','-nostdin','-y',...args];const pointers=argv.map(s=>{const n=core.lengthBytesUTF8(s)+1,p=core._malloc(n);core.stringToUTF8(s,p,n);return p;});const ptr=core._malloc(pointers.length*4);pointers.forEach((p,i)=>core.setValue(ptr+i*4,p,'i32'));try{await new Promise((resolve,reject)=>{complete=resolve;try{core.cwrap('main','number',['number','number'])(argv.length,ptr);}catch(e){complete=null;if(e.status===0)resolve();else reject(e);}});}finally{pointers.forEach(p=>core._free(p));core._free(ptr);}}
function read(name){try{return core.FS.readFile(name);}catch{throw Error(logs.join('\n').slice(-1800)||'Codec failed to produce output');}}
onmessage=async({data:d})=>{try{
 if(d.action==='init'){importScripts(d.coreURL,d.codecURL);core=await createFFmpegCore({wasmBinary:d.wasm,noExitRuntime:true,print:log,printErr:log,mainScriptUrlOrBlob:d.coreURL});postMessage({ready:true});return;}
 if(['render','prepare','edit'].includes(d.action)){
 const o=d.options;
 let result;
 if(d.action==='edit'){const avi=new Uint8Array(d.avi),parsed=AVI.parse(avi);result={bytes:avi,frames:parsed.frames.map(f=>f.type),stats:{removed:0,repeated:0}};}
 else {
 for(let i=0;i<2;i++){
  postMessage({stage:i===0?'Encoding A':'Encoding B',progress:10+i*25});
  core.FS.writeFile('input'+i,new Uint8Array(d.inputs[i]));
  const restore=o.join&&i===1?['-force_key_frames',String(o.overlap)]:[];
  const command=['-ss',String(o.starts[i]),'-i','input'+i,'-t',String(o.lengths[i]),'-an','-vf',`scale=${o.width}:${o.height}:force_original_aspect_ratio=decrease,pad=${o.width}:${o.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${o.fps}`,'-c:v','mpeg4','-q:v',String(o.quality),'-g',String(o.gop),'-bf',String(o.join?0:o.bframes),'-sc_threshold','1000000000',...restore,'-vtag','XVID','-threads','1','-f','avi','clip'+i+'.avi'];
  await run(command);
  read('clip'+i+'.avi');
  if(o.join&&i===1){const countA=AVI.parse(read('clip0.avi')).frames.length,countB=AVI.parse(read('clip1.avi')).frames.length;const actualOverlap=Math.max(0,Math.min(Math.round(o.overlap*o.fps),countA-1,countB-1))/o.fps;if(actualOverlap!==o.overlap){o.overlap=actualOverlap;command[command.indexOf('-force_key_frames')+1]=String(actualOverlap);await run(command);}}
  core.FS.unlink('input'+i);
 }
 postMessage({stage:'Moshing',progress:65});
 const rules=d.action==='prepare'?{...o,allI:false,dropP:0,dropB:false,repeat:1}:o;
 result=(o.join&&d.action!=='prepare'?AVI.joined:AVI.mosh)(read('clip0.avi'),read('clip1.avi'),rules);
 }
 core.FS.writeFile('moshed.avi',result.bytes);
 postMessage({stage:'Rendering',progress:76});
 positions=[];
 await run(['-fflags','+genpts','-err_detect','ignore_err','-i','moshed.avi','-an','-vf',`showinfo,setpts=N/(${o.fps}*TB)`,'-r',String(o.fps),'-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-threads','1','result.mp4']);
 const video=read('result.mp4').slice();if(!video.length||!positions.length)throw Error('No frames could be decoded');const avi=result.bytes;
 postMessage({done:true,video:video.buffer,avi:avi.buffer,stats:result.stats,frames:result.frames,duration:result.duration,overlap:result.overlap,positions},[video.buffer,avi.buffer]);
 for(const n of ['clip0.avi','clip1.avi','moshed.avi','result.mp4'])try{core.FS.unlink(n);}catch{}
 }
}catch(e){postMessage({error:d.action==='edit'?'Unable to decode the edited sequence. Undo or restore an I-frame.':String(e.message||e)});}};


