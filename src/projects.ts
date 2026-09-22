import type {LifeEvent,Save,ZoneId} from './state.ts';
import {landmarks,groundHeight} from './civilization.ts';

export const motifs=['energy','phone','robot','media','health','science','network','temple','logistics','materials','game','garden','workshop'] as const;
export type Motif=typeof motifs[number];
export type Project={id:string;name:string;zone:ZoneId;plot:number;motif:Motif;links:string[]};
export type LivingProject=Project&{events:LifeEvent[];started:string;updated:string};

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
 // Each district owns an outward-growing sector. No finite map edge and no
 // re-layout when another project arrives; only occupied plots are rendered.
 const order=['home','wind','knowledge','spirit','agents','ideas','transit','maker','mentor','business','health','creative'];
 const angle=order.indexOf(project.zone)*Math.PI/6-Math.PI/2,radius=52+Math.floor(project.plot/3)*14,lane=(project.plot%3-1)*8.5;
 return {x:Math.cos(angle)*radius-Math.sin(angle)*lane,y:.35,z:Math.sin(angle)*radius+Math.cos(angle)*lane};
}
export function projectContext(project:LivingProject){return project.events.map(e=>`${e.date}${e.dateEnd?' to '+e.dateEnd:''}: ${e.title}. ${e.summary}`).join('\n').slice(-3000);}
