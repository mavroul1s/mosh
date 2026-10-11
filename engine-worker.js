let core,complete,logs=[];
function log(s){logs.push(s);if(logs.length>24)logs.shift();if(s==='FFMPEG_END'&&complete){complete();complete=null;}}
async function run(args){logs=[];const argv=['ffmpeg','-nostdin','-y',...args];const pointers=argv.map(s=>{const n=core.lengthBytesUTF8(s)+1,p=core._malloc(n);core.stringToUTF8(s,p,n);return p;});const ptr=core._malloc(pointers.length*4);pointers.forEach((p,i)=>core.setValue(ptr+i*4,p,'i32'));try{await new Promise((resolve,reject)=>{complete=resolve;try{core.cwrap('main','number',['number','number'])(argv.length,ptr);}catch(e){complete=null;if(e.status===0)resolve();else reject(e);}});}finally{pointers.forEach(p=>core._free(p));core._free(ptr);}}
function read(name){try{return core.FS.readFile(name);}catch{throw Error(logs.join('\n').slice(-1800)||'Codec failed to produce output');}}
onmessage=async({data:d})=>{try{
 if(d.action==='init'){importScripts(d.coreURL,d.codecURL);core=await createFFmpegCore({wasmBinary:d.wasm,noExitRuntime:true,print:log,printErr:log,mainScriptUrlOrBlob:d.coreURL});postMessage({ready:true});return;}
 if(d.action==='render'){
 const o=d.options;
 for(let i=0;i<2;i++){
  postMessage({stage:i===0?'Encoding A':'Encoding B',progress:10+i*25});
  core.FS.writeFile('input'+i,new Uint8Array(d.inputs[i]));
  await run(['-ss',String(o.starts[i]),'-i','input'+i,'-t',String(o.lengths[i]),'-an','-vf',`scale=${o.width}:${o.height}:force_original_aspect_ratio=decrease,pad=${o.width}:${o.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${o.fps}`,'-c:v','mpeg4','-q:v',String(o.quality),'-g',String(o.gop),'-bf',String(o.bframes),'-sc_threshold','1000000000','-vtag','XVID','-threads','1','-f','avi','clip'+i+'.avi']);
  read('clip'+i+'.avi');core.FS.unlink('input'+i);
 }
 postMessage({stage:'Moshing',progress:65});
 const result=AVI.mosh(read('clip0.avi'),read('clip1.avi'),o);core.FS.writeFile('moshed.avi',result.bytes);
 postMessage({stage:'Rendering',progress:76});
 await run(['-fflags','+genpts','-err_detect','ignore_err','-i','moshed.avi','-an','-vf',`setpts=N/(${o.fps}*TB)`,'-r',String(o.fps),'-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-threads','1','result.mp4']);
 const video=read('result.mp4').slice();const avi=result.bytes;
 postMessage({done:true,video:video.buffer,avi:avi.buffer,stats:result.stats,frames:result.frames},[video.buffer,avi.buffer]);
 for(const n of ['clip0.avi','clip1.avi','moshed.avi','result.mp4'])try{core.FS.unlink(n);}catch{}
 }
}catch(e){postMessage({error:String(e.message||e)});}};


