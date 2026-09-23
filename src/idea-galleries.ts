import {galleryFloorHeight,projectFloor,projectPosition,projectTowerId,type LivingProject} from './projects.ts';
import {groundHeight} from './civilization.ts';

export type GalleryFloor={level:number;name:string;project?:LivingProject;exhibit?:LivingProject;reserved?:boolean};
export type IdeaGallery={id:string;name:string;x:number;z:number;base:number;radius:number;floors:GalleryFloor[]};
export function galleryHeight(gallery:IdeaGallery,level:number){return gallery.base+level*galleryFloorHeight;}

/** Existing ground plots remain intact; overflow occupies that district's reserved vertical addresses. */
export function ideaGalleries(projects:LivingProject[]):IdeaGallery[]{
 const towers=new Map<string,IdeaGallery>();
 const dream=projects.find(p=>p.id==='karmic-life');
 if(dream){const p=projectPosition(dream);towers.set('dream-gallery',{id:'dream-gallery',name:'Dream Lab · Future Ideas Mall',x:p.x,z:p.z,base:p.y,radius:6,floors:[
  {level:1,name:'Invention exhibition',exhibit:projects.find(p=>p.id==='windpanel')??dream},
  {level:2,name:'Robotics exhibition',exhibit:projects.find(p=>p.id==='robotics-core')??dream},
  {level:3,name:'Future ideas · space reserved',reserved:true}
 ]});}
 for(const p of projects){const level=projectFloor(p);if(!level)continue;const id=projectTowerId(p),pos=projectPosition(p);
  let tower=towers.get(id);if(!tower){tower={id,name:p.zone+' · Idea galleries',x:pos.x,z:pos.z,base:.35,radius:3,floors:[]};towers.set(id,tower);}
  tower.floors.push({level,name:p.name,project:p});
 }
 for(const tower of towers.values())tower.floors.sort((a,b)=>a.level-b.level);
 return [...towers.values()];
}
export function galleryTiles(tower:IdeaGallery){
 const tiles=new Set<string>(),r=tower.radius;
 for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)if(Math.abs(dx)>2||Math.abs(dz)>2)tiles.add(`${tower.x+dx},${tower.z+dz}`);
 return tiles;
}
export function galleryEntrance(tower:IdeaGallery){return {x:tower.x,z:tower.z+tower.radius};}
export function galleryGround(tower:IdeaGallery){return groundHeight(tower.x,tower.z)+.1;}

/** Decorative visitors walk the perimeter, then ride the same lift to the next deck. */
export function galleryVisitor(tower:IdeaGallery,time:number,phase=0,reduced=false){
 const levels=tower.floors.map(f=>f.level);const period=32,elapsed=reduced?phase*9:Math.max(0,time+phase*9),index=Math.floor(elapsed/period)%levels.length;
 const current=levels[index],next=levels[(index+1)%levels.length],t=elapsed%period,entry=galleryEntrance(tower),r=tower.radius;
 if(t>=26){const mix=(t-26)/6;return {...entry,y:galleryHeight(tower,current)+(galleryHeight(tower,next)-galleryHeight(tower,current))*mix,yaw:Math.PI,moving:false,lift:true};}
 const points=[entry,{x:tower.x+r,z:entry.z},{x:tower.x+r,z:tower.z-r},{x:tower.x-r,z:tower.z-r},{x:tower.x-r,z:entry.z},entry];
 let distance=t/26*r*8;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(a.x-b.x,a.z-b.z);if(distance<=length){const mix=distance/length;return {x:a.x+(b.x-a.x)*mix,z:a.z+(b.z-a.z)*mix,y:galleryHeight(tower,current),yaw:Math.atan2(b.x-a.x,b.z-a.z),moving:!reduced,lift:false};}distance-=length;}
 return {...entry,y:galleryHeight(tower,current),yaw:0,moving:false,lift:false};
}
