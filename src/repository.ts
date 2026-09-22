import {importData,type LifeEvent} from './state';
export type SyncStatus={status:string;message:string;commit?:string;lastSyncedAt?:string;checkedAt?:string};
export function connectRepository(events:()=>LifeEvent[],receive:(items:LifeEvent[])=>void,report:(s:SyncStatus)=>void){
 let busy=false,known=new Map<string,string>(),pending=false,live=false,staticLoaded=false;
 const signature=(e:LifeEvent)=>JSON.stringify(e);
 async function tick(){if(busy)return;busy=true;try{
  const edited=events().filter(e=>known.has(e.id)&&known.get(e.id)!==signature(e)),editedIds=new Set(edited.map(e=>e.id));
  const response=await fetch('/api/world');if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('offline');
  const data=await response.json(),incoming=importData({events:data.events});live=true;
  const changed=incoming.some(e=>known.get(e.id)!==signature(e));known=new Map(incoming.map(e=>[e.id,signature(e)]));if(changed)receive(incoming.filter(e=>!editedIds.has(e.id)));
  const additions=events().filter(e=>!known.has(e.id));
  if(additions.length||edited.length){const result=await fetch('/api/world',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:[...additions,...edited]})});const saved=await result.json();if(!result.ok)throw new Error(saved.error??'Could not save to the repository.');const canonical=importData({events:saved.events});known=new Map(canonical.map(e=>[e.id,signature(e)]));receive(canonical.filter(e=>!saved.conflicts.includes(e.id)));if(saved.conflicts.length)report({status:'conflict',message:'An existing event was edited locally. Your draft stays in the local backup/export; record a new development to preserve the shared original.'});else report({status:'pending',message:'Saved in the repository. GitHub sync is queued.'});}
  else{const stale=data.sync.checkedAt&&Date.now()-Date.parse(data.sync.checkedAt)>180000;report(stale?{status:'waiting',message:'Sync worker is not active. Open the desktop launcher to reconnect.'}:data.sync);}
 }catch{live=false;report({status:'offline',message:'Local backup active. Open the desktop launcher to reconnect to the shared repository.'});if(!staticLoaded){staticLoaded=true;try{const r=await fetch(`${import.meta.env.BASE_URL}world-state.json`);if(r.ok)receive(importData(await r.json()));}catch{}}}
 finally{busy=false;if(pending){pending=false;void tick();}}}
 void tick();setInterval(()=>void tick(),5000);
 return {save:()=>{if(busy)pending=true;else void tick();},sync:async()=>{if(live)await fetch('/api/world',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sync'})});void tick();}};
}
