import type {LifeEvent} from './state.ts';
export const truthStates=['VERIFIED_REALITY','USER_IDEA','AGENT_HYPOTHESIS','AGENT_PROTOTYPE','FANTASY_WORLD','COMPLETED_BUILD'] as const;
export type TruthState=typeof truthStates[number];
export const workTypes=['research','design','prototype','test','shipped'] as const;
export type WorkType=typeof workTypes[number];
export type Work={type:WorkType;evidence:string};
export function truthOf(e:LifeEvent):TruthState{return e.truthState??(e.kind==='agent'?'AGENT_HYPOTHESIS':e.kind==='build'?'COMPLETED_BUILD':'USER_IDEA');}
export function progression(events:LifeEvent[]){
 const work=events.filter(e=>e.work),points=work.reduce((n,e)=>n+({research:1,design:1,prototype:2,test:2,shipped:3}[e.work!.type]),0);
 const milestone=Math.max(1,...work.map(e=>({research:2,design:3,prototype:4,test:5,shipped:6}[e.work!.type])));
 const level=Math.max(milestone,1+Math.min(5,points));return {level,points,sessions:work.length,stage:['Idea seed','Research cabin','Design studio','Prototype workshop','Testing laboratory','Innovation landmark'][level-1]};
}
