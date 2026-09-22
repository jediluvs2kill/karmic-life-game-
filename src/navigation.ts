import {zones, type ZoneId} from './state.ts';
/** Route over the actual rendered land, avoiding buildings, trees and unbridged water. */
export function walkGrid(start:{x:number;z:number},end:{x:number;z:number},tiles:Set<string>){
 const nearest=(p:{x:number;z:number})=>{let best:{x:number;z:number}|undefined,distance=Infinity;for(const k of tiles){const [x,z]=k.split(',').map(Number),d=(p.x-x)**2+(p.z-z)**2;if(d<distance){distance=d;best={x,z};}}return best;};
 const first=nearest(start),last=nearest(end);if(!first||!last)return [];
 const key=(p:{x:number;z:number})=>p.x+','+p.z,queue=[first],parents=new Map<string,{x:number;z:number}|null>([[key(first),null]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(last)){const result=[];let q:typeof p|null=p;while(q){result.push(q);q=parents.get(key(q))??null;}return result.reverse();}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+dx,z:p.z+dz},k=key(q);if(tiles.has(k)&&!parents.has(k)){parents.set(k,p);queue.push(q);}}
 }return [];
}
export function pathBetween(start:{x:number;z:number},end:{x:number;z:number},active:ZoneId[]){
 const areas=zones.filter(z=>active.includes(z.id));
 const walkable=(x:number,z:number)=>{
  const land=x*x/290+z*z/260<1||areas.some(a=>Math.hypot(x-a.x,z-a.z)<4.8);
  const obstructed=areas.some(a=>Math.abs(x-a.x)<2.8&&Math.abs(z-a.z)<2.2);
  return land&&!obstructed;
 };
 const key=(x:number,z:number)=>x+','+z;const first={x:Math.round(start.x),z:Math.round(start.z)},last={x:Math.round(end.x),z:Math.round(end.z)};
 const queue=[first];const parents=new Map<string,{x:number;z:number}|null>([[key(first.x,first.z),null]]);let found=false;
 for(let i=0;i<queue.length&&i<4000;i++){
  const p=queue[i];if(p.x===last.x&&p.z===last.z){found=true;break;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,k=key(x,z);if(!parents.has(k)&&walkable(x,z)){parents.set(k,p);queue.push({x,z});}}
 }
 if(!found)return [];
 const result=[];let p:{x:number;z:number}|null=last;while(p){result.push(p);p=parents.get(key(p.x,p.z))??null;}return result.reverse();
}
