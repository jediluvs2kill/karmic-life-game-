import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {access} from 'node:fs/promises';
import {syncRepository} from '../server/repo-sync.mjs';
import {withLock} from '../server/repo-store.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.argv.includes('--once')){console.log(JSON.stringify(await syncRepository(root)));}
else await withLock(root,'sync-worker',async()=>{let last=0;for(;;){const requested=await access(path.join(root,'.karmic/sync-request')).then(()=>true,()=>false);if(requested||Date.now()-last>60000){await syncRepository(root);last=Date.now();}await new Promise(r=>setTimeout(r,10000));}}).catch(e=>{console.error(e.message);process.exitCode=1;});
