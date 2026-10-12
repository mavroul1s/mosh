/* The frame bar edits codec packets; the MP4 is refreshed only on Apply. */
class PacketEditor {
 constructor(avi,fps=24){this.load(avi,fps);}
 load(avi,fps){const parsed=AVI.parse(avi instanceof Uint8Array?avi:new Uint8Array(avi));this.header=parsed.header;this.frames=parsed.frames.map((f,i)=>({...f,id:i}));this.fps=fps;this.undoStack=[];this.redoStack=[];this.nextId=this.frames.length;this.previewMap=new Map(this.frames.map((f,i)=>[f.id,i]));}
 save(){return AVI.build(this.header,this.frames);}
 checkpoint(){this.undoStack.push(this.frames.slice());if(this.undoStack.length>100)this.undoStack.shift();this.redoStack=[];}
 remove(index){if(this.frames.length===1)throw Error('Keep at least one frame.');if(!this.frames[index])throw Error('Select a frame.');this.checkpoint();this.frames.splice(index,1);}
 replace(index,donor){if(!this.frames[index]||!donor)throw Error('Choose a replacement frame.');if(!donor.data?.length)throw Error('Empty replacement packet.');this.checkpoint();const copy={...donor,id:this.nextId++};this.previewMap.set(copy.id,this.previewMap.get(donor.id)??0);this.frames[index]=copy;}
 undo(){if(!this.undoStack.length)return false;this.redoStack.push(this.frames.slice());this.frames=this.undoStack.pop();return true;}
 redo(){if(!this.redoStack.length)return false;this.undoStack.push(this.frames.slice());this.frames=this.redoStack.pop();return true;}
 get dirty(){return this.undoStack.length>0;}
 setPositions(positions){const byPosition=new Map(this.frames.map((f,i)=>[f.pos,i])),mapped=new Map();for(let n=0;n<positions.length;n++){const i=byPosition.get(positions[n]);if(i!==undefined)mapped.set(this.frames[i].id,n);}if(mapped.size)this.previewMap=mapped;}
}
if(typeof module==='object')module.exports={PacketEditor};
else window.PacketEditor=PacketEditor;

if(typeof document!=='undefined'){
const el=id=>document.getElementById(id);
let model=null,selected=0,clipboard=null,blocked=false,seek=()=>{},apply=()=>{},changed=()=>{};
function info(){const f=model?.frames[selected];el('selectedFrame').textContent=f?`${selected+1} / ${model.frames.length} · ${f.type}`:'—';el('frameJump').max=model?.frames.length||1;if(document.activeElement!==el('frameJump'))el('frameJump').value=selected+1;el('replaceFrom').max=model?.frames.length||1;el('editStatus').textContent=model?.dirty?`${model.undoStack.length} edits · APPLY`:'';el('applyFrames').disabled=blocked||!model?.dirty;el('deleteFrame').disabled=blocked||!model||model.frames.length===1;el('replaceFrame').disabled=blocked||!model;el('copyFrame').disabled=blocked||!model;el('undoFrame').disabled=blocked||!model?.undoStack.length;el('redoFrame').disabled=blocked||!model?.redoStack.length;for(const id of ['previousFrame','nextFrame','frameJump','replaceFrom'])el(id).disabled=blocked||!model;el('frameMap').setAttribute('aria-disabled',String(blocked));}
function paint(){const box=el('frameMap');box.replaceChildren();if(!model){info();return;}const fragment=document.createDocumentFragment();model.frames.forEach((f,i)=>{const b=document.createElement('button');b.id='packet-'+f.id;b.className='packet '+f.type;b.dataset.index=i;b.type='button';b.tabIndex=-1;b.setAttribute('role','option');b.setAttribute('aria-label',`Frame ${i+1}, ${f.type}`);b.setAttribute('aria-selected',String(i===selected));b.title=`${i+1} / ${f.type}`;b.textContent=f.type;fragment.append(b);});box.append(fragment);const count=t=>model.frames.filter(f=>f.type===t).length;el('frameInfo').textContent=`I × ${count('I')} / P × ${count('P')} / B × ${count('B')}`;highlight();info();}
function highlight(){const box=el('frameMap');box.querySelector('.selected')?.classList.remove('selected');box.querySelector('[aria-selected="true"]')?.setAttribute('aria-selected','false');const node=box.children[selected];if(node){node.classList.add('selected');node.setAttribute('aria-selected','true');box.setAttribute('aria-activedescendant',node.id);}}
function select(index,navigate=true){if(blocked||!model||!Number.isFinite(index))return;selected=Math.max(0,Math.min(model.frames.length-1,index));highlight();info();const node=el('frameMap').children[selected];if(node){const box=el('frameMap');if(node.offsetLeft<box.scrollLeft)box.scrollLeft=node.offsetLeft;else if(node.offsetLeft+node.offsetWidth>box.scrollLeft+box.clientWidth)box.scrollLeft=node.offsetLeft+node.offsetWidth-box.clientWidth;}if(navigate){const display=model.previewMap.get(model.frames[selected].id);if(display===undefined)el('editStatus').textContent='Packet has no decoded image';else seek(display/model.fps,selected);}}
function mutate(fn){if(blocked||!model)return;try{fn();selected=Math.min(selected,model.frames.length-1);paint();select(selected);changed(model.dirty);}catch(e){el('editStatus').textContent=e.message;}}
el('frameMap').onclick=e=>{const b=e.target.closest('.packet');if(b){select(+b.dataset.index);el('frameMap').focus({preventScroll:true});}};
el('frameMap').onkeydown=e=>{if(blocked||!model)return;let handled=true;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const direction=e.key==='ArrowLeft'?-1:1;if(e.shiftKey){let i=selected+direction;while(i>=0&&i<model.frames.length&&model.frames[i].type!=='I')i+=direction;if(i>=0&&i<model.frames.length)select(i);}else select(selected+direction);}else if(e.key==='Home')select(0);else if(e.key==='End')select(model.frames.length-1);else if(e.key==='Delete'||e.key==='Backspace')el('deleteFrame').click();else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.shiftKey?el('redoFrame').click():el('undoFrame').click();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y')el('redoFrame').click();else handled=false;if(handled)e.preventDefault();};
el('previousFrame').onclick=()=>{select(selected-1);el('frameMap').focus({preventScroll:true});};el('nextFrame').onclick=()=>{select(selected+1);el('frameMap').focus({preventScroll:true});};
el('frameJump').onchange=()=>select(Math.round(+el('frameJump').value)-1);
el('copyFrame').onclick=()=>{if(blocked||!model)return;clipboard=model.frames[selected];el('replaceFrom').value=selected+1;el('editStatus').textContent=`Copied ${selected+1} / ${clipboard.type}`;};
el('replaceFrom').oninput=()=>{clipboard=null;};
el('deleteFrame').onclick=()=>mutate(()=>model.remove(selected));
el('replaceFrame').onclick=()=>mutate(()=>{const donor=clipboard||model.frames[Math.round(+el('replaceFrom').value)-1];model.replace(selected,donor);});
el('undoFrame').onclick=()=>mutate(()=>model.undo());el('redoFrame').onclick=()=>mutate(()=>model.redo());
el('applyFrames').onclick=()=>{if(!blocked&&model?.dirty)apply(model.save(),model.fps,selected);};
el('frameZoom').oninput=()=>{el('frameMap').style.setProperty('--packet-width',el('frameZoom').value+'px');};
for(const button of document.querySelectorAll('[data-frame-type]'))button.onclick=()=>{if(blocked||!model)return;const type=button.dataset.frameType;for(let n=1;n<=model.frames.length;n++){const i=(selected+n)%model.frames.length;if(model.frames[i].type===type){select(i);el('frameMap').focus({preventScroll:true});return;}}};
window.FrameEditor={
 init(callbacks){({seek,apply,changed}=callbacks);},
 load(avi,fps,positions=[],index=0){model=new PacketEditor(avi,fps);model.setPositions(positions);clipboard=null;selected=Math.max(0,Math.min(index,model.frames.length-1));paint();changed(false);},
 lock(value){blocked=value;info();},
 follow(time){if(!model||blocked||model.dirty)return;const n=Math.floor(time*model.fps);const index=model.frames.findIndex(f=>model.previewMap.get(f.id)===n);if(index>=0){selected=index;highlight();info();}},
 select,raw(){return model?.save();},get dirty(){return !!model?.dirty;},get fps(){return model?.fps||24;},get index(){return selected;}
};
info();
}
