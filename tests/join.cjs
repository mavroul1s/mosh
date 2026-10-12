const fs=require('fs'),assert=require('node:assert/strict');require('../codec.js');
// Indexed AVI fixtures let these checks run without an installed native codec.
const header=new Uint8Array(4+8+56);header.set(Buffer.from('hdrlavih'));new DataView(header.buffer).setUint32(8,56,true);
function packet(t,n){return {type:t,data:Uint8Array.of(0,0,1,182,({I:0,P:1,B:2}[t]<<6),n%256)};}
const a=AVI.build(header,Array.from({length:168},(_,i)=>packet(i===0?'I':'P',i)));
const b=AVI.build(header,Array.from({length:168},(_,i)=>packet(i===0||i===48?'I':'P',i)));
const r=AVI.joined(a,b,{fps:24,overlap:2});
assert.equal(r.duration,12);assert.equal(r.frames.length,288);
assert.equal(AVI.parse(r.bytes).frames.length,288);
assert.equal(r.frames[120],'P','incoming anchor is replaced during transition');
assert.equal(r.frames[168],'I','B restores after the overlap');
assert.equal(r.stats.replaced,1);assert.equal(r.stats.removed,48);
assert.equal(AVI.joined(a,b,{fps:24,overlap:0}).duration,14);
const one=AVI.build(header,[packet('I',0)]);
assert.equal(AVI.joined(one,b,{fps:24,overlap:20}).frames.length,169);
assert.throws(()=>AVI.joined(AVI.build(header,[packet('I',0),packet('B',1)]),b,{fps:24,overlap:1}),/B-frames/);
console.log('PASS: 7s + 7s − 2s = 12s; overlap anchors, restoration, zero overlap, short clips, AVI index');
