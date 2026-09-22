import {mkdir,readFile,readdir,writeFile,rename,open,unlink} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {initial,validateEvent,mergeEvents} from '../src/state.ts';
import {truthOf} from '../src/progression.ts';

export const eventFile=id=>createHash('sha256').update(id).digest('hex')+'.json';
export async function atomicJson(file,data){
 await mkdir(path.dirname(file),{recursive:true});const temporary=file+'.'+randomUUID()+'.tmp';
 try{await writeFile(temporary,JSON.stringify(data,null,2)+'\n');
  // Windows can briefly hold the destination open while Vite serves the file.
  // Retry the atomic rename; never delete the last good copy to make it succeed.
  for(let attempt=0;;attempt++){try{await rename(temporary,file);break;}catch(error){if(attempt>=5||!['EPERM','EBUSY','EACCES'].includes(error.code))throw error;await new Promise(resolve=>setTimeout(resolve,40*2**attempt));}}
 }finally{await unlink(temporary).catch(()=>{});}
}
export async function withLock(root,name,fn){
 const dir=path.join(root,'.karmic');await mkdir(dir,{recursive:true});const file=path.join(dir,name+'.lock');let handle;
 for(let i=0;i<100;i++){try{handle=await open(file,'wx');await handle.writeFile(String(process.pid));break;}catch(e){if(e.code!=='EEXIST')throw e;const pid=Number(await readFile(file,'utf8').catch(()=>''));if(pid){try{process.kill(pid,0);}catch(err){if(err.code==='ESRCH'){await unlink(file).catch(()=>{});continue;}}}await new Promise(r=>setTimeout(r,50));}}
 if(!handle)throw new Error('Another world operation is in progress. Try again shortly.');
 try{return await fn();}finally{await handle.close();await unlink(file).catch(()=>{});}
}
export function createRepoStore(root){
 const directory=path.join(root,'state/events');
 const normalize=e=>{const v=validateEvent(e);return {...v,actor:v.actor??(v.kind==='agent'?'Local agent':'User'),truthState:truthOf(v)};};
 async function read(){await mkdir(directory,{recursive:true});const names=(await readdir(directory)).filter(n=>/^[a-f0-9]{64}\.json$/.test(n)).sort();const events=await Promise.all(names.map(async n=>{const e=normalize(JSON.parse(await readFile(path.join(directory,n),'utf8')));if(eventFile(e.id)!==n)throw new Error('An event filename does not match its ID: '+n);return e;}));return mergeEvents([],events);}
 async function append(incoming,actor='User'){
  if(!Array.isArray(incoming)||incoming.length>50000)throw new Error('Expected up to 50,000 world events.');
  const validated=incoming.map(normalize);
  return withLock(root,'world-write',async()=>{
   const before=await read(),known=new Map(before.map(e=>[e.id,normalize(e)])),merged=mergeEvents(before,validated),requested=new Set(validated.map(e=>e.id)),added=[],conflicts=[];
   for(const raw of merged){if(!requested.has(raw.id))continue;const e=normalize(raw),prior=known.get(e.id);
    if(prior){if(JSON.stringify(prior)!==JSON.stringify(e))conflicts.push(e.id);continue;}
    await atomicJson(path.join(directory,eventFile(e.id)),e);added.push(e.id);
   }
   if(added.length){const id=randomUUID();await atomicJson(path.join(root,'state/footprints',id+'.json'),{id,truthState:'COMPLETED_BUILD',actor:String(actor).slice(0,120),at:new Date().toISOString(),action:'Recorded world contributions',eventIds:added});}
   return {added:added.length,conflicts,events:await read()};
  });
 }
 async function seed(){const current=await read(),ids=new Set(current.map(e=>e.id));return append(initial.events.filter(e=>!ids.has(e.id)),'Karmic Life · public catalogue release');}
 return {read,append,seed};
}
