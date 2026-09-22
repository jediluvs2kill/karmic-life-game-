import {inventionEvents,inventionProjects,legacyProjectIds} from './inventory.ts';
import {motifs,type Project} from './projects.ts';
import {truthStates,workTypes,progression,type TruthState,type Work} from './progression.ts';
export type ZoneId = 'home'|'wind'|'knowledge'|'spirit'|'agents'|'ideas'|'transit'|'maker'|'mentor'|'business'|'health'|'creative';
export type Kind = 'idea'|'conversation'|'agent'|'build';
export type LifeEvent = {id:string; date:string; dateEnd?:string; title:string; summary:string; zone:ZoneId; kind:Kind; sourceTitle:string; sourceId?:string; project?:Project; actor?:string; truthState?:TruthState; work?:Work};
export type Save = {version:1; events:LifeEvent[]; visited:ZoneId[]; night:boolean};
export const zones: {id:ZoneId; name:string; color:string; x:number; z:number; style:string; description:string}[] = [
 {id:'home',name:'Home & Companions',color:'#edb890',x:0,z:4,style:'home',description:'A little home at the heart of a much bigger story.'},
 {id:'wind',name:'WindPanel Bay',color:'#a0dfd5',x:-11,z:-6,style:'wind',description:'A coastal laboratory for your wind-energy ideas.'},
 {id:'knowledge',name:'Knowledge Temple',color:'#e0ca84',x:0,z:-11,style:'temple',description:'Books, discoveries, and questions worth keeping.'},
 {id:'spirit',name:'Dharma Shrine',color:'#ffa274',x:10,z:-8,style:'shrine',description:'A quiet garden for RUDRAA, reflection, and practice.'},
 {id:'agents',name:'Agent Headquarters',color:'#aeabff',x:11,z:1,style:'tower',description:'The future home of your research and building companions.'},
 {id:'ideas',name:'Idea Forest',color:'#c6e795',x:-10,z:4,style:'forest',description:'Every curious thought has room to take root.'},
 {id:'transit',name:'Gravity Transit',color:'#edc882',x:-19,z:0,style:'transit',description:'A miniature railway inspired by your gravity freight concept.'},
 {id:'maker',name:'Maker Workshop',color:'#94c9ef',x:19,z:1,style:'maker',description:'A place for thermal cameras, devices, and experiments.'},
 {id:'mentor',name:'Mentor Hall',color:'#d4b5eb',x:5,z:12,style:'temple',description:'Good questions, useful guidance, and new perspectives.'},
 {id:'business',name:'Webroker Quarter',color:'#86c9b5',x:-7,z:13,style:'town',description:'A small city for your property and business projects.'},
 {id:'health',name:'Body Garden',color:'#b5dc8a',x:-16,z:12,style:'garden',description:'Space for movement, rest, and everyday wellbeing.'},
 {id:'creative',name:'Story Studio',color:'#f1a1a1',x:16,z:12,style:'home',description:'Stories and games become places you can explore.'}
];
export const initial:Save = {version:1,night:false,visited:[],events:mergeEvents([],inventionEvents)};
export function dayNumber(date:string){return Math.floor((Date.parse(date+'T00:00:00Z')-Date.parse('2026-09-22T00:00:00Z'))/86400000)+1;}
export function validDate(date:unknown):date is string{return typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date;}
export function validateEvent(e:unknown):LifeEvent{
 if(!e || typeof e!=='object')throw new Error('Each event must be an object.');
 const v=e as LifeEvent;
 for(const key of ['id','title','summary','sourceTitle'] as const)if(typeof v[key]!=='string'||v[key].length>5000||!v[key].trim())throw new Error('An event has a missing or oversized '+key+'.');
 if(!validDate(v.date)||!zones.some(z=>z.id===v.zone)||!['idea','conversation','agent','build'].includes(v.kind))throw new Error('An event has an invalid date, district, or type.');
 if(v.dateEnd!==undefined&&(!validDate(v.dateEnd)||v.dateEnd<v.date))throw new Error('An event has an invalid date range.');
 if(v.actor!==undefined&&(typeof v.actor!=='string'||!v.actor.trim()||v.actor.length>120))throw new Error('Invalid contributor name.');
 if(v.truthState!==undefined&&!truthStates.includes(v.truthState))throw new Error('Invalid truth state.');
 if(v.work&&(!workTypes.includes(v.work.type)||typeof v.work.evidence!=='string'||!v.work.evidence.trim()||v.work.evidence.length>3000))throw new Error('Work entries need a work type and a description or reference for what changed.');
 let project:Project|undefined;
 if(v.project!==undefined){const p=v.project;if(!p||typeof p.id!=='string'||!p.id.trim()||p.id.length>500||typeof p.name!=='string'||!p.name.trim()||p.name.length>200||!zones.some(z=>z.id===p.zone)||!Number.isSafeInteger(p.plot)||p.plot<0||p.plot>100000||!motifs.includes(p.motif)||!Array.isArray(p.links)||p.links.length>100||p.links.some(l=>typeof l!=='string'||l.length>500))throw new Error('An event has invalid project metadata.');project={id:p.id,name:p.name,zone:p.zone,plot:p.plot,motif:p.motif,links:[...new Set(p.links)]};}
 return {id:v.id,date:v.date,title:v.title,summary:v.summary,zone:v.zone,kind:v.kind,sourceTitle:v.sourceTitle,...(typeof v.sourceId==='string'?{sourceId:v.sourceId}:{}),...(v.dateEnd?{dateEnd:v.dateEnd}:{}),...(project?{project}:{}),...(v.actor?{actor:v.actor}:{}),...(v.truthState?{truthState:v.truthState}:{}),...(v.work?{work:{type:v.work.type,evidence:v.work.evidence}}:{})};
}
export function mergeEvents(current:LifeEvent[],incoming:LifeEvent[]){
 const map=new Map(current.map(e=>[e.id,validateEvent(e)]));
 for(const raw of incoming){const e=validateEvent(raw),old=map.get(e.id);map.set(e.id,{...e,...(!e.project&&old?.project?{project:old.project}:{})});}
 const registry=new Map<string,Project>(),occupied=new Set<string>();
 function register(p:Project){const prior=registry.get(p.id);if(prior)return prior;let plot=p.plot;while(occupied.has(p.zone+':'+plot))plot++;const result={...p,plot};registry.set(p.id,result);occupied.add(p.zone+':'+plot);return result;}
 // An existing address is never moved by another import. Reserve catalogue plots
 // even on historical snapshots so new inventions cannot displace later entries.
 current.forEach(e=>{if(e.project)register(e.project);});inventionProjects.forEach(register);
 const events=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 return events.map(e=>{let p=e.project??registry.get(legacyProjectIds[e.id]);
  if(!p&&(e.kind==='idea'||e.kind==='conversation')){const id=e.kind==='conversation'&&e.sourceId?'conversation:'+e.sourceId:'project:'+e.id;p=registry.get(id)??{id,name:e.title.slice(0,200),zone:e.zone,plot:0,motif:'science',links:[]};}
  if(!p)return e;p=register(p);return {...e,zone:p.zone,project:p};
 });
}
export function classify(title:string):ZoneId{
 const groups:[ZoneId,RegExp][]=[['wind',/wind|turbine|energy/i],['spirit',/rudra|jaap|dharma|hanuman|meditat/i],['transit',/gravity|transit|logistic/i],['business',/webroker|estate|business|startup|stakeholder/i],['health',/health|breath|training|exercise|sleep|food/i],['home',/family|father|cat |milo|pet/i],['mentor',/guru|mentor|loop|guidance/i],['maker',/thermal|cooling|hardware|camera|device/i],['knowledge',/book|reading|learn|knowledge|git /i],['creative',/game|story|design|image|art|poster/i],['agents',/agent|automation| ai /i]];
 return groups.find(([,re])=>re.test(title))?.[0]??'ideas';
}
export function importData(input:unknown):LifeEvent[]{
 if(input && typeof input==='object' && !Array.isArray(input) && 'events' in input){const data=input as {events:unknown};if(!Array.isArray(data.events)||data.events.length>50000)throw new Error('Expected up to 50,000 events.');return data.events.map(validateEvent);}
 if(!Array.isArray(input)||input.length>50000)throw new Error('Choose a Karmic save or ChatGPT conversations JSON.');
 const result:LifeEvent[]=[];
 for(const raw of input){
  if(!raw||typeof raw!=='object'||typeof raw.title!=='string'||!raw.mapping||typeof raw.mapping!=='object')throw new Error('This is not a ChatGPT conversation export.');
  const conversationId=String(raw.id??raw.conversation_id??raw.title);
  for(const [nodeId,node] of Object.entries(raw.mapping) as [string,any][]){
   const m=node?.message;if(m?.author?.role!=='user')continue;
   const parts=m.content?.parts;if(!Array.isArray(parts))continue;
   const content=parts.filter((p:unknown)=>typeof p==='string').join('\n').trim();if(!content)continue;
   const timestamp=Number(m.create_time??raw.create_time);if(!Number.isFinite(timestamp)||timestamp<=0)continue;
   const date=new Date(timestamp*1000+19800000).toISOString().slice(0,10);
   result.push(validateEvent({id:`chat:${conversationId}:${m.id??nodeId}`,date,title:raw.title.slice(0,200),summary:content.slice(0,1800),zone:classify(raw.title),kind:'conversation',sourceTitle:raw.title.slice(0,200),sourceId:conversationId}));
  }
 }
 if(!result.length)throw new Error('No dated user text messages were found in that export.');
 return result;
}
export function worldAt(save:Save,date:string){return zones.map(z=>{const events=save.events.filter(e=>e.zone===z.id&&e.date<=date);return {...z,events,level:events.length?progression(events).level:0};});}
export function readSave():Save{try{const raw=localStorage.getItem('karmic-public-world-v1');if(raw){const s=JSON.parse(raw);if(s.version!==1)throw new Error('version');return {version:1,events:mergeEvents(initial.events,importData(s)),visited:Array.isArray(s.visited)?s.visited.filter((id:ZoneId)=>zones.some(z=>z.id===id)):[],night:!!s.night};}}catch{ /* Preserve corrupt data; next write is user-initiated. */ }return structuredClone(initial);}
