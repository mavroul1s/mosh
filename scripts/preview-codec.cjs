const fs=require('fs');require('../codec.js');
const a=new Uint8Array(fs.readFileSync('assets/signal.avi')),b=new Uint8Array(fs.readFileSync('assets/orbit.avi'));
const r=AVI.mosh(a,b,{allI:true,dropB:false,dropP:0,repeat:1,interval:12});
fs.writeFileSync('assets/preview.avi',r.bytes);fs.writeFileSync('assets/frames.json',JSON.stringify(r.frames));console.log(r.stats);
