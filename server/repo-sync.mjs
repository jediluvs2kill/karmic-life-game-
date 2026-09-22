import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir,access,unlink} from 'node:fs/promises';
import path from 'node:path';
import {withLock,atomicJson} from './repo-store.mjs';
import {compileWorld} from './compile-world.mjs';
const exec=promisify(execFile);
export const managedPaths=['state/events','state/footprints','public/assets/projects'];
export const isManaged=file=>managedPaths.some(p=>file.startsWith(p+'/'));
export async function readSyncStatus(root){try{return JSON.parse(await readFile(path.join(root,'.karmic/sync-status.json'),'utf8'));}catch{return {status:'waiting',message:'Launch Karmic Life to start GitHub sync.'};}}
export async function requestSync(root){await mkdir(path.join(root,'.karmic'),{recursive:true});await writeFile(path.join(root,'.karmic/sync-request'),'1');}
export async function syncRepository(root,{git:customGit}={}){
 const git=customGit??(async args=>(await exec('git',args,{cwd:root,windowsHide:true,timeout:45000,maxBuffer:4*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}})).stdout.trim());
 const status=async(value,message,extra={})=>{const result={status:value,message,checkedAt:new Date().toISOString(),...extra};await atomicJson(path.join(root,'.karmic/sync-status.json'),result);return result;};
 try{return await withLock(root,'git-sync',async()=>{
  const remote=await git(['remote','get-url','origin']);if(!/^https:\/\/github\.com\/jediluvs2kill\/karmic-life-game-(?:\.git)?$/.test(remote)&&remote!=='git@github.com:jediluvs2kill/karmic-life-game-.git')return status('paused','The origin repository changed. Review it before syncing.');
  if(await git(['branch','--show-current'])!=='main')return status('paused','Work is on another branch. Merge it into main to share the world.');
  for(const marker of ['MERGE_HEAD','rebase-merge','rebase-apply']){try{await access(path.join(root,'.git',marker));return status('conflict','Finish the existing Git merge or rebase before syncing.');}catch{}}
  if(await git(['diff','--cached','--name-only']))return status('paused','An agent has staged changes. Commit them before automatic sync.');
  const dirty=[...new Set((await git(['diff','--name-only'])).split('\n').concat((await git(['ls-files','--others','--exclude-standard'])).split('\n')).filter(Boolean))];
  if(dirty.some(p=>!isManaged(p)))return status('paused','An agent is editing code or configuration. Commit that work to resume sync.');
  if(dirty.length){await git(['add','--',...managedPaths]);if(await git(['diff','--cached','--name-only']))await git(['commit','-m','world: save shared contributions and idea assets']);}
  await status('syncing','Checking GitHub for world updates…');await git(['fetch','origin','main']);
  const divergence=(await git(['rev-list','--left-right','--count','HEAD...origin/main'])).split(/\s+/).map(Number),[ahead,behind]=divergence;
  if(behind&&ahead){
   // Git can merge independent event files; overlapping edits remain reviewable.
   try{await git(['merge','--no-edit','origin/main']);}catch{await git(['merge','--abort']);return status('conflict','Both copies changed the same files. Automatic merge was cancelled; ask an agent to resolve it.');}
  }else if(behind)await git(['merge','--ff-only','origin/main']);
  await git(['push','origin','HEAD:main']);const local=await git(['rev-parse','HEAD']),remoteHead=await git(['rev-parse','origin/main']);
  if(local!==remoteHead)return status('pending','GitHub has changed again; sync will retry.');
  if(behind)await compileWorld(root);
  await unlink(path.join(root,'.karmic/sync-request')).catch(()=>{});
  return status('synced','World synced with GitHub',{commit:local,lastSyncedAt:new Date().toISOString()});
 });}catch(e){return status('offline','Sync could not finish. Local work is kept; retrying when GitHub is reachable.',{detail:String(e.message).replace(/https:\/\/[^\s]+/g,'[remote]').slice(0,240)});}
}
