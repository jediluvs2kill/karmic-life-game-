import {createRepoStore} from './repo-store.mjs';
import {compileWorld} from './compile-world.mjs';
import {readSyncStatus,requestSync} from './repo-sync.mjs';
export function worldPlugin(){return {name:'karmic-shared-world',async configureServer(server){
 const root=server.config.root,store=createRepoStore(root);await store.seed();await compileWorld(root);
 server.middlewares.use('/api/world',async(req,res)=>{
  const send=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
  const host=req.headers.host;if(!['127.0.0.1:5174','localhost:5174'].includes(host)||req.headers.origin&&req.headers.origin!=='http://'+host)return send(403,{error:'Local requests only.'});
  try{
   if(req.method==='GET')return send(200,{events:await store.read(),sync:await readSyncStatus(root)});
   if(req.method!=='POST'||!req.headers['content-type']?.startsWith('application/json'))return send(405,{error:'Use a JSON POST.'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>20*1024*1024)return send(413,{error:'World update exceeds 20 MB.'});}
   const input=JSON.parse(body);if(input.action==='sync'){await requestSync(root);return send(202,{queued:true});}
   const result=await store.append(input.events,'World editor');if(result.added){await compileWorld(root);await requestSync(root);}return send(200,{...result,sync:await readSyncStatus(root)});
  }catch(e){send(400,{error:e.message});}
 });
}};}
