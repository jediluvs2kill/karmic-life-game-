const roles=['runner','runner','runner','runner','runner','runner','courier','courier','courier','courier','courier','courier','builder','builder','builder','builder','gardener','gardener','gardener','gardener','player','player','player','player'];
const allowed={runner:['train','explore','greet','rest'],courier:['deliver','inspect','greet','rest'],builder:['build','inspect','greet','rest'],gardener:['garden','inspect','greet','rest'],player:['play','explore','greet','rest']};
const moods={train:'focused',deliver:'focused',build:'focused',garden:'calm',play:'cheerful',inspect:'curious',explore:'curious',greet:'social',rest:'calm'};
const phrases={train:'Training along the living paths',deliver:'Carrying news between idea districts',build:'Improving a fantasy workshop',garden:'Tending the civilization gardens',play:'Playing with a nearby friend',inspect:'Studying an invention landmark',explore:'Exploring a new route',greet:'Stopping to greet a neighbour',rest:'Taking a quiet break'};
const id=index=>'resident-'+String(index+1).padStart(2,'0');
export function fallbackNpcDecisions(epoch=Math.floor(Date.now()/12000)){
 return roles.map((role,index)=>{const actions=allowed[role],action=actions[(epoch+index*3)%actions.length];return {id:id(index),action,mood:moods[action],line:phrases[action],confidence:.62};});
}
export function parseJevAnswers(payload){return payload?.result?.answers??payload?.answers??payload?.data?.answers??payload?.data?.data?.answers;}

function questions(){return Object.fromEntries(Object.entries(allowed).map(([role,actions])=>[role,{type:'choice',instructions:`Choose the most believable next ambient action for a ${role} NPC. The game will validate and animate the choice.`,criteria:Object.fromEntries(actions.map(action=>[action,phrases[action]]))}]));}
export function applyJevAnswers(answers,epoch){const fallback=fallbackNpcDecisions(epoch);return fallback.map((decision,index)=>{const role=roles[index],answer=answers?.[role],choice=typeof answer?.choice==='string'&&allowed[role].includes(answer.choice)?answer.choice:decision.action;return {...decision,action:choice,mood:moods[choice],line:phrases[choice],confidence:Number.isFinite(answer?.confidence)?Math.max(0,Math.min(1,answer.confidence)):decision.confidence};});}

async function callJev(signal){
 const input={state:{world:'Karmic Life fantasy civilization',time:new Date().toISOString(),population:24,principle:'Choose varied peaceful ambient behavior. Never create achievements or change project truth.'},questions:questions()};
 const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
 let url,headers={'Content-Type':'application/json'},body,provider;
 if(account&&token){url=`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run`;headers.Authorization=`Bearer ${token}`;body={model:'typesafe/jev',input};provider='Jev · Cloudflare Workers AI';}
 else if(process.env.JEV_API_URL&&process.env.JEV_API_KEY){url=process.env.JEV_API_URL;headers.Authorization=`Bearer ${process.env.JEV_API_KEY}`;body={model:process.env.JEV_MODEL||'jev-latest',...input};provider='Jev · direct API';}
 else return null;
 const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal});if(!response.ok)throw new Error(`Jev returned HTTP ${response.status}`);
 const data=await response.json(),answers=parseJevAnswers(data);if(!answers)throw new Error('Jev returned no structured answers.');return {provider,answers};
}

export function jevNpcPlugin(){return {name:'karmic-jev-npc-minds',configureServer(server){
 let decisions=fallbackNpcDecisions(),provider='Local behavior simulation',mode='simulation',live=false,lastError='',updatedAt=new Date().toISOString(),active=false,lastAttempt=0;
 const state=()=>({provider,mode,live,updatedAt,decisions,lastError});
 async function refresh(){if(active||Date.now()-lastAttempt<10000)return;active=true;lastAttempt=Date.now();const epoch=Math.floor(Date.now()/12000);try{const result=await callJev(AbortSignal.timeout(4500));if(result){decisions=applyJevAnswers(result.answers,epoch);provider=result.provider;mode='jev';live=true;lastError='';}else{decisions=fallbackNpcDecisions(epoch);provider='Local behavior simulation · Jev adapter ready';mode='simulation';live=false;lastError='';}}catch(error){decisions=fallbackNpcDecisions(epoch);provider='Local behavior simulation';mode='simulation';live=false;lastError=error.message;}finally{updatedAt=new Date().toISOString();active=false;}}
 server.middlewares.use('/api/npc-minds',async(req,res)=>{const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};const host=req.headers.host;if(!['127.0.0.1:5174','localhost:5174'].includes(host)||req.headers.origin&&req.headers.origin!=='http://'+host)return send(403,{error:'Local requests only.'});if(req.method!=='GET')return send(405,{error:'Method not allowed.'});void refresh();return send(200,state());});
 }};}
