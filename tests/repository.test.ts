import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRepoStore} from '../server/repo-store.mjs';
import {syncRepository} from '../server/repo-sync.mjs';
import {inventionEvents} from '../src/inventory.ts';

async function fixture(fn:(root:string)=>Promise<void>){const prefix=path.join(tmpdir(),'karmic-test-'),root=await mkdtemp(prefix);try{await fn(root);}finally{assert.ok(path.resolve(root).startsWith(path.resolve(prefix)));await rm(root,{recursive:true,force:true});}}
test('repository events survive restart, deduplicate, and retain conflicting versions for review',()=>fixture(async root=>{
 const first=createRepoStore(root),event=inventionEvents[0];assert.equal((await first.append([event],'Test author')).added,1);
 const reopened=createRepoStore(root);assert.equal((await reopened.read()).length,1);assert.equal((await reopened.append([event])).added,0);
 const conflict=await reopened.append([{...event,summary:'A conflicting overwrite'}]);assert.deepEqual(conflict.conflicts,[event.id]);assert.equal((await reopened.read())[0].summary,event.summary);
 const files=await readdir(path.join(root,'state/footprints'));assert.equal(files.length,1);assert.equal(JSON.parse(await readFile(path.join(root,'state/footprints',files[0]),'utf8')).actor,'Test author');
}));
test('concurrent contributors preserve both independent events',()=>fixture(async root=>{
 const store=createRepoStore(root);await Promise.all([store.append([{...inventionEvents[0],id:'first'}],'Alpha'),store.append([{...inventionEvents[0],id:'second'}],'Beta')]);assert.equal((await store.read()).length,2);
}));
const baseAnswers:Record<string,string>={'remote get-url origin':'https://github.com/jediluvs2kill/karmic-life-game-.git','branch --show-current':'main','diff --cached --name-only':'','diff --name-only':'','ls-files --others --exclude-standard':'','rev-list --left-right --count HEAD...origin/main':'0 0','rev-parse HEAD':'abc','rev-parse origin/main':'abc'};
test('sync never stages or pushes unfinished code',()=>fixture(async root=>{const calls:string[]=[];const result=await syncRepository(root,{git:async(args:string[])=>{const k=args.join(' ');calls.push(k);return k==='diff --name-only'?'src/world.ts':baseAnswers[k]??'';}});assert.equal(result.status,'paused');assert.ok(!calls.some(k=>k.startsWith('add ')||k.startsWith('push ')));}));
test('sync aborts only its own failed merge and never force-pushes',()=>fixture(async root=>{const calls:string[]=[];const result=await syncRepository(root,{git:async(args:string[])=>{const k=args.join(' ');calls.push(k);if(k==='merge --no-edit origin/main')throw new Error('conflict');return k==='rev-list --left-right --count HEAD...origin/main'?'1 1':baseAnswers[k]??'';}});assert.equal(result.status,'conflict');assert.ok(calls.includes('merge --abort'));assert.ok(!calls.some(k=>k.startsWith('push ')));}));
test('sync commits only managed world paths and verifies the pushed revision',()=>fixture(async root=>{let staged=false;const calls:string[]=[];const result=await syncRepository(root,{git:async(args:string[])=>{const k=args.join(' ');calls.push(k);if(k.startsWith('add '))staged=true;if(k==='diff --cached --name-only')return staged?'state/events/a.json':'';if(k==='diff --name-only')return 'state/events/a.json';return baseAnswers[k]??'';}});assert.equal(result.status,'synced');assert.ok(calls.includes('add -- state/events state/footprints public/assets/projects'));assert.ok(calls.includes('push origin HEAD:main'));assert.ok(!calls.some(k=>k.includes('--force')));}));
