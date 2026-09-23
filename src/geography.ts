import {isCivilizationLand,type MapPoint} from './island-shape.ts';
import {protectedPlots} from './projects.ts';
import {landmarks} from './civilization.ts';

/** Stylized scenery inspired by Himalayan headwaters and the Ganga's eastern delta. */
export const himalayanPeaks=[
 {x:-35,z:-36,height:17,radius:7},{x:-27,z:-39,height:22,radius:7},
 {x:-15,z:-37,height:25,radius:6},{x:-5,z:-39,height:21,radius:6},
 {x:5,z:-40,height:27,radius:6},{x:15,z:-36,height:24,radius:7},
 {x:25,z:-35,height:20,radius:6},{x:35,z:-32,height:16,radius:6}
];
const plots=protectedPlots();
const mountainCache=new Map<string,number>();
export function mountainHeight(x:number,z:number){
 const cacheKey=x+','+z,cached=mountainCache.get(cacheKey);if(cached!==undefined)return cached;
 if(!isCivilizationLand(x,z))return 0;
 let height=0;
 for(const p of himalayanPeaks){const radius=Math.hypot(x-p.x,(z-p.z)*1.25);height=Math.max(height,p.height*Math.max(0,1-radius/p.radius));}
 // Keep established invention plots clear, without moving an idea to make scenery fit.
 const clearance=Math.min(...plots.map(p=>Math.hypot(x-p.x,z-p.z)));
 const result=height*Math.max(0,Math.min(1,(clearance-3)/2));mountainCache.set(cacheKey,result);return result;
}
const key=(p:MapPoint)=>`${Math.round(p.x)},${Math.round(p.z)}`;
const blocked=(x:number,z:number)=>plots.some(p=>Math.abs(x-p.x)<=2&&Math.abs(z-p.z)<=2)||Object.values(landmarks).some(p=>Math.abs(x-p.x)<2.7*p.scale&&Math.abs(z-p.z)<2.4*p.scale);
export const gangaWaypoints:MapPoint[]=[{x:-12,z:-33},{x:-11,z:-24},{x:-4,z:-17},{x:11,z:-17},{x:18,z:-4},{x:25,z:2},{x:32,z:7},{x:38,z:10},{x:40,z:8}];
function nearest(point:MapPoint){
 const candidates:MapPoint[]=[];
 for(let x=-45;x<=48;x++)for(let z=-43;z<=40;z++)if(isCivilizationLand(x,z)&&!blocked(x,z)&&mountainHeight(x,z)<1)candidates.push({x,z});
 return candidates.sort((a,b)=>(a.x-point.x)**2+(a.z-point.z)**2-((b.x-point.x)**2+(b.z-point.z)**2))[0];
}
function riverRoute(){
 const result:MapPoint[]=[];const stops=gangaWaypoints.map(nearest);
 for(let i=1;i<stops.length;i++){
  const start=stops[i-1],end=stops[i],queue=[start],parents=new Map<string,MapPoint|null>([[key(start),null]]);
  for(let q=0;q<queue.length;q++){
   const p=queue[q];if(key(p)===key(end))break;
   const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>({x:p.x+dx,z:p.z+dz})).sort((a,b)=>Math.hypot(a.x-end.x,a.z-end.z)-Math.hypot(b.x-end.x,b.z-end.z));
   for(const next of neighbors)if(!parents.has(key(next))&&isCivilizationLand(next.x,next.z)&&!blocked(next.x,next.z)&&mountainHeight(next.x,next.z)<1){parents.set(key(next),p);queue.push(next);}
  }
  if(!parents.has(key(end)))continue;
  const segment:MapPoint[]=[];for(let p:MapPoint|null=end;p;p=parents.get(key(p))??null)segment.push(p);
  result.push(...segment.reverse());
 }
 return result;
}
export const gangaRoute=riverRoute();
export const gangaCells=new Set<string>();
for(const p of gangaRoute)for(const [dx,dz] of [[0,0],[1,0],[0,1]]){const x=p.x+dx,z=p.z+dz;if(isCivilizationLand(x,z)&&!blocked(x,z)&&mountainHeight(x,z)<1)gangaCells.add(`${x},${z}`);}
export function isGanga(x:number,z:number){return gangaCells.has(`${Math.round(x)},${Math.round(z)}`);}
/** Cross at a few bridges, rather than paving the entire river into a road. */
export const gangaBridges=new Set<string>();
for(let i=8;i<gangaRoute.length;i+=16){const p=gangaRoute[i];for(const cell of gangaCells){const [x,z]=cell.split(',').map(Number);if(Math.hypot(x-p.x,z-p.z)<=3)gangaBridges.add(cell);}}
