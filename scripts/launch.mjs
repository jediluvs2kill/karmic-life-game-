import {spawn} from 'node:child_process';
import {openSync,readFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),runtime=path.join(root,'.karmic');mkdirSync(runtime,{recursive:true});
function background(script,args,log){const output=openSync(path.join(runtime,log),'a');const child=spawn(process.execPath,[script,...args],{cwd:root,windowsHide:true,detached:true,stdio:['ignore',output,output]});child.unref();}
let worker=false;try{process.kill(Number(readFileSync(path.join(runtime,'sync-worker.lock'),'utf8')),0);worker=true;}catch{}
if(!worker)background(path.join(root,'scripts/sync-worker.mjs'),[],'sync-worker.log');
if(!process.argv.includes('--background')){
 let ready=false;try{const r=await fetch('http://127.0.0.1:5174/api/world',{signal:AbortSignal.timeout(1500)});ready=r.ok&&r.headers.get('content-type')?.includes('application/json');}catch{}
 if(!ready){background(path.join(root,'node_modules/vite/bin/vite.js'),['--host','127.0.0.1'],'desktop-server.log');for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:5174/api/world',{signal:AbortSignal.timeout(1500)});if(r.ok&&r.headers.get('content-type')?.includes('application/json')){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}}
 if(!ready)throw new Error('The world could not start. See .karmic/desktop-server.log.');
 if(process.platform==='win32')spawn('explorer.exe',['http://127.0.0.1:5174/'],{windowsHide:true,detached:true,stdio:'ignore'}).unref();
}
