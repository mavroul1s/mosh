/* MPEG-4 Part 2 VOP editing in an indexed AVI container. */
(function(root){
const ascii=(a,p)=>String.fromCharCode(...a.subarray(p,p+4));
const u32=(a,p)=>new DataView(a.buffer,a.byteOffset,a.byteLength).getUint32(p,true);
function put(a,p,n){new DataView(a.buffer,a.byteOffset,a.byteLength).setUint32(p,n,true);}
function tag(s){return Uint8Array.from(s,c=>c.charCodeAt(0));}
function join(parts){const a=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let p=0;for(const b of parts){a.set(b,p);p+=b.length;}return a;}
function chunk(id,data){const h=new Uint8Array(8);h.set(tag(id));put(h,4,data.length);return join([h,data,...(data.length%2?[new Uint8Array(1)]:[])]);}
function type(data){for(let i=0;i+4<data.length;i++)if(data[i]===0&&data[i+1]===0&&data[i+2]===1&&data[i+3]===182)return ['I','P','B','S'][data[i+4]>>6];return '?';}
function parse(a){
 if(ascii(a,0)!=='RIFF'||ascii(a,8)!=='AVI ')throw Error('Expected an AVI container');
 let header,frames=[];
 function walk(start,end,movi=false){for(let p=start;p+8<=end;){const id=ascii(a,p),len=u32(a,p+4),stop=p+8+len;if(stop>end||stop>a.length)throw Error('Truncated AVI');if(id==='LIST'){const kind=ascii(a,p+8);if(kind==='hdrl')header=a.slice(p+8,stop);else if(kind==='movi'||kind==='rec ')walk(p+12,stop,true);}else if(movi&&/^\d\dd[bc]$/.test(id)){const data=a.slice(p+8,stop);if(data.length)frames.push({data,type:type(data),pos:p+8});}p=stop+(len%2);}}
 walk(12,a.length);if(!header||!frames.length)throw Error('No video frames');return {header,frames};
}
function build(header,frames){
 header=header.slice();
 function patch(start,end){for(let p=start;p+8<=end;){const id=ascii(header,p),len=u32(header,p+4);if(id==='avih')put(header,p+8+16,frames.length);if(id==='strh'&&ascii(header,p+8)==='vids')put(header,p+8+32,frames.length);if(id==='LIST')patch(p+12,p+8+len);p+=8+len+(len%2);}}
 patch(4,header.length);let offset=4;const index=new Uint8Array(frames.length*16),packets=[];
 frames.forEach((f,i)=>{const c=chunk('00dc',f.data);packets.push(c);index.set(tag('00dc'),i*16);put(index,i*16+4,f.type==='I'?16:0);put(index,i*16+8,offset);put(index,i*16+12,f.data.length);offset+=c.length;});
 const body=join([tag('AVI '),chunk('LIST',header),chunk('LIST',join([tag('movi'),...packets])),chunk('idx1',index)]);return chunk('RIFF',body);
}
function mosh(a,b,o){
 const A=parse(a),B=parse(b),out=[],stats={I:0,P:0,B:0,removed:0,repeated:0};let first=true;
 for(const [clip,frames] of [[0,A.frames],[1,B.frames]])for(let i=0;i<frames.length;i++){
  const f=frames[i];let action='keep';
  if(f.type==='I'&&!first&&o.allI)action='drop';
  if(f.type==='B'&&o.dropB)action='drop';
  if(clip===1&&f.type==='P'&&o.dropP>0&&i%o.dropP===0)action='drop';
  if(action==='drop'){stats.removed++;continue;}
  out.push(f);first=false;stats[f.type]=(stats[f.type]||0)+1;
  if(clip===1&&f.type==='P'&&o.repeat>1&&i%o.interval===0)for(let j=1;j<o.repeat;j++){out.push(f);stats.P++;stats.repeated++;}
 }
 return {bytes:build(A.header,out),stats,frames:out.map(f=>f.type)};
}
function joined(a,b,o){
 const A=parse(a),B=parse(b);
 if(A.frames.some(f=>f.type==='B')||B.frames.some(f=>f.type==='B'))throw Error('JOIN requires streams without B-frames');
 const overlap=Math.max(0,Math.min(Math.round(o.overlap*o.fps),A.frames.length-1,B.frames.length-1));
 const out=A.frames.slice(0,A.frames.length-overlap),stats={I:0,P:0,B:0,removed:overlap,repeated:0,replaced:0};
 let reference=out[out.length-1];
 for(let i=0;i<B.frames.length;i++){
  let frame=B.frames[i];
  // Preserve the frame slot while preventing an incoming anchor from resetting A.
  if(i<overlap&&frame.type==='I'){frame=reference;stats.replaced++;}
  out.push(frame);reference=frame;
 }
 for(const frame of out)stats[frame.type]=(stats[frame.type]||0)+1;
 return {bytes:build(A.header,out),stats,frames:out.map(f=>f.type),duration:out.length/o.fps,overlap:overlap/o.fps};
}
root.AVI={parse,build,mosh,joined,type};
})(typeof self!=='undefined'?self:globalThis);
