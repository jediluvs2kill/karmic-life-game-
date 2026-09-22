import type {LifeEvent,Save,ZoneId} from './state.ts';
import {landmarks,groundHeight} from './civilization.ts';
import {isCivilizationLand} from './island-shape.ts';

export const motifs=['energy','phone','robot','media','health','science','network','temple','logistics','materials','game','garden','workshop'] as const;
export type Motif=typeof motifs[number];
export type Project={id:string;name:string;zone:ZoneId;plot:number;motif:Motif;links:string[]};
export type LivingProject=Project&{events:LifeEvent[];started:string;updated:string};

const districtOrder=['home','wind','knowledge','spirit','agents','ideas','transit','maker','mentor','business','health','creative'] as const;
const districtAnchors:Record<string,{x:number;z:number}>={home:{x:-31,z:-23},wind:{x:-28,z:5},knowledge:{x:2,z:-29},spirit:{x:9,z:29},agents:{x:-2,z:1},ideas:{x:8,z:12},transit:{x:-7,z:43},maker:{x:12,z:24},mentor:{x:-6,z:-22},business:{x:-20,z:-8},health:{x:-18,z:21},creative:{x:28,z:5}};
const districtCapacity:Record<string,number>={home:2,wind:4,knowledge:6,spirit:2,agents:7,ideas:2,transit:1,maker:18,mentor:4,business:10,health:7,creative:14};
const candidates:{x:number;z:number}[]=[];
for(let x=-42;x<=44;x+=7)for(let z=-42;z<=64;z+=7)if(isCivilizationLand(x,z)&&Object.values(landmarks).every(point=>Math.hypot(x-point.x,z-point.z)>6.2))candidates.push({x,z});
const reserved=new Set<string>(),continentPlots=new Map<string,{x:number;z:number}>();
for(const zone of districtOrder){const anchor=districtAnchors[zone];for(let plot=0;plot<districtCapacity[zone];plot++){
 const point=[...candidates].filter(candidate=>!reserved.has(candidate.x+','+candidate.z)).sort((a,b)=>Math.hypot(a.x-anchor.x,a.z-anchor.z)-Math.hypot(b.x-anchor.x,b.z-anchor.z)||a.z-b.z||a.x-b.x)[0];
 if(point){reserved.add(point.x+','+point.z);continentPlots.set(zone+':'+plot,point);}
}}

export function projectsAt(save:Pick<Save,'events'>,date:string):LivingProject[]{
 const map=new Map<string,LivingProject>();
 for(const e of save.events.filter(e=>e.date<=date).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
  if(!e.project)continue;const p=map.get(e.project.id);
  if(p){p.events.push(e);p.updated=e.date;}else map.set(e.project.id,{...e.project,events:[e],started:e.date,updated:e.date});
 }
 return [...map.values()].sort((a,b)=>a.zone.localeCompare(b.zone)||a.plot-b.plot||a.id.localeCompare(b.id));
}

/** Allocation is append-only. Existing project addresses win when imports are merged. */
export function allocateProject(events:LifeEvent[],id:string,name:string,zone:ZoneId,motif:Motif='science'):Project{
 const existing=events.find(e=>e.project?.id===id)?.project;if(existing)return existing;
 const occupied=new Set(events.filter(e=>e.project?.zone===zone).map(e=>e.project!.plot));
 let plot=0;while(occupied.has(plot))plot++;
 return {id,name,zone,plot,motif,links:[]};
}
export function projectPosition(project:Pick<Project,'plot'|'zone'>&{id?:string},_zone?:unknown){
 const landmark=project.id&&landmarks[project.id];
 if(landmark)return {x:landmark.x,y:groundHeight(landmark.x,landmark.z)+.15,z:landmark.z};
 // District neighborhoods now occupy the recognizable continent instead of a
 // circular ring. Plot numbers remain stable; only their visual coordinates move.
 const continent=continentPlots.get(project.zone+':'+project.plot);if(continent)return {...continent,y:.35};
 // Plots beyond the current continent keep expanding outward indefinitely.
 const zoneIndex=Math.max(0,districtOrder.indexOf(project.zone as typeof districtOrder[number])),angle=zoneIndex*Math.PI/6-Math.PI/2,radius=80+Math.floor(project.plot/3)*14,lane=(project.plot%3-1)*8.5;
 return {x:Math.cos(angle)*radius-Math.sin(angle)*lane,y:.35,z:Math.sin(angle)*radius+Math.cos(angle)*lane};
}
export function projectContext(project:LivingProject){return project.events.map(e=>`${e.date}${e.dateEnd?' to '+e.dateEnd:''}: ${e.title}. ${e.summary}`).join('\n').slice(-3000);}
