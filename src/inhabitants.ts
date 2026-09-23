import * as THREE from 'three';
import {isGanga} from './geography.ts';
import {groundHeight} from './civilization.ts';
import {walkGrid} from './navigation.ts';
import {projectApproach,type LivingProject} from './projects.ts';
import type {NpcDecision} from './npc-minds.ts';

export type ResidentRole='runner'|'courier'|'builder'|'gardener'|'player';
type Point={x:number;z:number};
export type ResidentPlan={id:string;name:string;role:ResidentRole;projectId:string;route:Point[];phase:number;speed:number;pause:number;color:string;pair?:number};
export type ResidentPose=Point&{y:number;yaw:number;gait:number;gesture:number;moving:boolean};
const assignments:[ResidentRole,string][]=[
 ['runner','run-dna'],['runner','creatine'],['runner','run-dna'],['runner','creatine'],['runner','kinetics'],['runner','body-metrics'],
 ['courier','webroker'],['courier','agent-swarm'],['courier','gravity-rail'],['courier','karmic-life'],['courier','solar-sales'],['courier','ministers'],
 ['builder','windpanel'],['builder','robotics-core'],['builder','cooling-stack'],['builder','maker-bay'],
 ['gardener','bio-bottle'],['gardener','rudraksha'],['gardener','green-lab'],['gardener','pet-comfort'],
 ['player','run-dna'],['player','run-dna'],['player','karmic-life'],['player','karmic-life']
];
const colors=['#f17160','#55c8c6','#f1ba4f','#9678d5','#77b650','#e994c2'];
const names=['Aarav','Mira','Kabir','Tara','Vihaan','Diya','Reyansh','Ira','Arjun','Meera','Dev','Saanvi','Rohan','Anaya','Ishaan','Naina','Kiran','Aditi','Neel','Riya','Yuvan','Myra','Advait','Siya'];
const speed:Record<ResidentRole,number>={runner:3.2,courier:1.85,builder:1.15,gardener:1,player:0};
const pauses:Record<ResidentRole,number>={runner:.3,courier:2.4,builder:7,gardener:6,player:1};

function connectedPaths(tiles:Set<string>){
 const unseen=new Set(tiles);let largest=new Set<string>();
 while(unseen.size){
  const first=unseen.values().next().value!,component=new Set([first]),queue=[first];unseen.delete(first);
  for(let i=0;i<queue.length;i++){
   const [x,z]=queue[i].split(',').map(Number);
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const key=(x+dx)+','+(z+dz);if(unseen.delete(key)){component.add(key);queue.push(key);}}
  }
  if(component.size>largest.size)largest=component;
 }
 return largest;
}

/** Fictional residents only: this plan never writes events or advances project progress. */
export function planInhabitants(projects:LivingProject[],walkable:Set<string>,limit=24):ResidentPlan[]{
 if(!projects.length||!walkable.size)return [];
 // Isolated grass pockets can be surrounded by trees. Spawn on the connected
 // promenade network so a resident always has a valid way to leave its doorstep.
 const paths=connectedPaths(walkable);
 const ordered=[...projects].sort((a,b)=>a.id.localeCompare(b.id));
 const count=Math.min(assignments.length,Math.max(0,Math.floor(limit)),Math.max(4,projects.length*3));
 return assignments.slice(0,count).flatMap(([role,preferred],i)=>{
  const project=ordered.find(p=>p.id===preferred)??ordered[(i*7)%ordered.length];
  const front=projectApproach(project);
  const start=walkGrid(front,front,paths)[0];if(!start)return [];
  let end={x:start.x+(i%2?5:-5),z:start.z+(i%3-1)*3};
  if(role==='courier'){
   const destination=ordered.find(p=>p.id===assignments[(i+1)%12][1])??ordered[(i*7+1)%ordered.length];
   end=projectApproach(destination);
  }else if(role==='builder'||role==='gardener')end={x:start.x+(i%2?2:-2),z:start.z+1};
  let route=role==='player'?[start]:walkGrid(start,end,paths);
  if(role!=='player'&&route.length<2){
   let alternative:Point|undefined,best=Infinity;
   for(const key of paths){const [x,z]=key.split(',').map(Number);if(x===start.x&&z===start.z)continue;const distance=(x-end.x)**2+(z-end.z)**2;if(distance<best){best=distance;alternative={x,z};}}
   if(alternative)route=walkGrid(start,alternative,paths);
  }
  return [{id:'resident-'+String(i+1).padStart(2,'0'),name:names[i],role,projectId:project.id,route:route.length?route:[start],phase:i*1.71,speed:speed[role],pause:pauses[role],color:colors[i%colors.length],...(role==='player'?{pair:Math.floor((i-20)/2)}:{})}];
 });
}

// Decks sit above the river surface; normal roads sit just above the grass.
export function footHeight(p:Point){
 return groundHeight(p.x,p.z)+(isGanga(p.x,p.z)?.32:.09);
}

/** A closed, reversible walk over adjacent grid cells; no shortcuts across water or buildings. */
export function sampleInhabitant(plan:ResidentPlan,timeSeconds:number,reducedMotion=false):ResidentPose{
 const time=reducedMotion?0:Math.max(0,Number.isFinite(timeSeconds)?timeSeconds:0),path=plan.route;
 const first=path[0]??{x:0,z:0},distance=Math.max(0,path.length-1),travel=distance/Math.max(.1,plan.speed),cycle=2*(travel+plan.pause);
 let cursor=0,back=false,moving=false;
 if(!reducedMotion&&plan.speed>0&&distance){
  const elapsed=(time+plan.phase)%cycle;
  if(elapsed>=plan.pause&&elapsed<plan.pause+travel){cursor=(elapsed-plan.pause)*plan.speed;moving=true;}
  else if(elapsed>=plan.pause+travel&&elapsed<2*plan.pause+travel)cursor=distance;
  else if(elapsed>=2*plan.pause+travel){cursor=distance-(elapsed-2*plan.pause-travel)*plan.speed;back=true;moving=true;}
 }
 const index=Math.min(Math.floor(cursor),Math.max(0,path.length-2)),a=path[index]??first,b=path[index+1]??a,t=cursor-index;
 const facing=back?-1:1,yaw=Math.atan2((b.x-a.x)*facing,(b.z-a.z)*facing);
 const gait=moving?Math.sin((time+plan.phase)*(plan.role==='runner'?12:7)):0;
 return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:footHeight(a)+(footHeight(b)-footHeight(a))*t,yaw,gait,gesture:reducedMotion?0:Math.sin((time+plan.phase)*(plan.role==='player'?2.2:3.5)),moving};
}

/** Twenty-four people, animated with nine shared instanced draws instead of individual rigs. */
export function createInhabitants(scene:THREE.Scene,options:{reducedMotion?:boolean}={}){
 const group=new THREE.Group();group.name='Fantasy residents · decorative activity';group.userData.truthState='FANTASY_WORLD';scene.add(group);
 const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.88,metalness:0});
 const meshes:THREE.InstancedMesh[]=[];
 const batch=(name:string,geometry:THREE.BufferGeometry,max:number)=>{const mesh=new THREE.InstancedMesh(geometry,material,max);mesh.name=name;mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);meshes.push(mesh);group.add(mesh);return mesh;};
 const torso=batch('resident coats',new THREE.SphereGeometry(1,10,8),24);
 const head=batch('resident faces',new THREE.SphereGeometry(1,10,8),24);
 const hat=batch('resident caps',new THREE.SphereGeometry(1,10,6),24);
 const arms=batch('resident arms',new THREE.CapsuleGeometry(.075,.85,3,6),48);
 const legs=batch('resident legs',new THREE.CapsuleGeometry(.1,.8,3,6),48);
 const shoes=batch('resident shoes',new THREE.SphereGeometry(1,8,6),48);
 const eyes=batch('resident eyes',new THREE.SphereGeometry(1,6,4),48);
 const props=batch('parcels and work tools',new THREE.BoxGeometry(1,1,1),24);
 const balls=batch('playground balls',new THREE.SphereGeometry(1,10,8),2);
 let residents:ResidentPlan[]=[];
 let controlled:{id:string;pose:ResidentPose}|undefined;
 const latest=new Map<string,ResidentPose>(),clocks=new Map<string,number>();
 const returning=new Map<string,{pose:ResidentPose;path:Point[]}>();
 function release(){
  if(!controlled)return;
  const resident=residents.find(r=>r.id===controlled!.id);
  if(resident){const pose={...controlled.pose,y:footHeight(controlled.pose),gait:0,gesture:0,moving:false};returning.set(resident.id,{pose,path:walkGrid(pose,resident.route[0],tiles)});}
  controlled=undefined;
 }
 let tiles=new Set<string>();
 let minds=new Map<string,NpcDecision>();
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),yawRotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const limbStart=new THREE.Vector3(),limbEnd=new THREE.Vector3(),limbDirection=new THREE.Vector3(),limbMid=new THREE.Vector3();
 const color=new THREE.Color();
 const tint=(mesh:THREE.InstancedMesh,index:number,value:string)=>mesh.setColorAt(index,color.set(value));
 function place(mesh:THREE.InstancedMesh,index:number,pose:ResidentPose,local:[number,number,number],size:[number,number,number]){
  const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);
  position.set(pose.x+local[0]*c+local[2]*s,pose.y+local[1],pose.z-local[0]*s+local[2]*c);
  rotation.setFromAxisAngle(up,pose.yaw);matrix.compose(position,rotation,scale.set(...size));mesh.setMatrixAt(index,matrix);
 }
 function limb(mesh:THREE.InstancedMesh,index:number,pose:ResidentPose,a:[number,number,number],b:[number,number,number]){
  const start=limbStart.set(...a),end=limbEnd.set(...b),direction=limbDirection.copy(end).sub(start),length=direction.length();
  const mid=limbMid.copy(start).add(end).multiplyScalar(.5),c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);
  position.set(pose.x+mid.x*c+mid.z*s,pose.y+mid.y,pose.z-mid.x*s+mid.z*c);
  yawRotation.setFromAxisAngle(up,pose.yaw);rotation.setFromUnitVectors(up,direction.normalize()).premultiply(yawRotation);
  matrix.compose(position,rotation,scale.set(1,length,1));mesh.setMatrixAt(index,matrix);
 }
 function rebuild(projects:LivingProject[],walkable:Set<string>){
  controlled=undefined;returning.clear();latest.clear();clocks.clear();tiles=walkable;residents=planInhabitants(projects,walkable);for(const mesh of meshes)mesh.count=0;
  residents.forEach((resident,i)=>{
   tint(torso,i,resident.color);tint(head,i,['#d0a17b','#8a5942','#edc4a0','#ac7955'][i%4]);tint(hat,i,resident.role==='builder'?'#ffd66b':resident.role==='gardener'?'#e7cf91':'#294657');
   for(let side=0;side<2;side++){const k=i*2+side;tint(arms,k,resident.color);tint(legs,k,i%2?'#294a70':'#454661');tint(shoes,k,'#f7ead2');tint(eyes,k,'#1b2b39');}
  });
  for(const mesh of [torso,head,hat])mesh.count=residents.length;
  for(const mesh of [arms,legs,shoes,eyes])mesh.count=residents.length*2;
  for(const mesh of meshes)if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  update(0,0,true);
 }
 function update(timeSeconds:number,_dt:number,visible:boolean){
  group.visible=visible;if(!visible)return;
  let propIndex=0,ballIndex=0;
  const poses=residents.map(resident=>{
   if(controlled?.id===resident.id)return {...controlled.pose};
   const journey=returning.get(resident.id);
   if(journey){
    const next=journey.path[0],pose=journey.pose;
    if(next){const dx=next.x-pose.x,dz=next.z-pose.z,distance=Math.hypot(dx,dz),step=Math.min(distance,Math.max(0,Math.min(_dt,.05))*1.85);
     if(distance<.01)journey.path.shift();else{pose.x+=dx/distance*step;pose.z+=dz/distance*step;pose.yaw=Math.atan2(dx,dz);}
     pose.y=footHeight(pose);pose.moving=step>0;pose.gait=options.reducedMotion?0:Math.sin(timeSeconds*7);return {...pose};
    }
    returning.delete(resident.id);clocks.set(resident.id,timeSeconds);
   }
   const resumedAt=clocks.get(resident.id);
   return sampleInhabitant(resumedAt===undefined?resident:{...resident,phase:0},resumedAt===undefined?timeSeconds:timeSeconds-resumedAt,options.reducedMotion);
  });
  residents.forEach((resident,i)=>latest.set(resident.id,{...poses[i]}));
  residents.forEach((resident,i)=>{
   const pose=poses[i],possessed=controlled?.id===resident.id,mind=possessed?undefined:minds.get(resident.id),working=!possessed&&!pose.moving&&(mind?['build','garden','inspect'].includes(mind.action):resident.role==='builder'||resident.role==='gardener'),playing=!possessed&&!pose.moving&&(mind?mind.action==='play':resident.role==='player'),greeting=!possessed&&!pose.moving&&mind?.action==='greet';
   if(playing){const partner=residents.findIndex(other=>other.pair===resident.pair&&other.id!==resident.id);if(partner>=0)pose.yaw=Math.atan2(poses[partner].x-pose.x,poses[partner].z-pose.z);}
   const bounce=pose.moving?Math.abs(pose.gait)*(resident.role==='runner'?.11:.045):0;
   place(torso,i,pose,[0,1.03+bounce,0],[.26,.37,.17]);place(head,i,pose,[0,1.57+bounce,0],[.2,.22,.19]);place(hat,i,pose,[0,1.72+bounce,-.015],[.215,.105,.205]);
   for(const side of [-1,1]){
    const k=i*2+(side===1?1:0),stride=pose.gait*side*(resident.role==='runner'?.35:.2),foot:[number,number,number]=[side*.14,.13+Math.max(0,stride)*.25,stride];
    limb(legs,k,pose,[side*.14,.76+bounce,0],foot);place(shoes,k,pose,[foot[0],foot[1]-.025,foot[2]+.065],[.115,.08,.19]);
    const handY=working?1.05+(.5+.5*pose.gesture)*.45:playing?1.06+pose.gesture*.2:greeting?1.28+pose.gesture*.22:.72+bounce;
    const hand:[number,number,number]=[side*.31,handY,working||playing?.33:-stride];
    limb(arms,k,pose,[side*.27,1.26+bounce,0],hand);place(eyes,k,pose,[side*.075,1.59+bounce,.176],[.032,.038,.025]);
    if(side===1&&working){place(props,propIndex,pose,[hand[0],hand[1]+.11,hand[2]],[resident.role==='builder'?.28:.19,.14,.13]);tint(props,propIndex++,resident.role==='builder'?'#8bcddd':'#80c475');}
   }
   if(resident.role==='courier'){place(props,propIndex,pose,[0,1.02,.31],[.42,.34,.3]);tint(props,propIndex++,'#d6a36d');}
   if(playing&&i%2===0){
    const partner=poses[i+1];if(partner){const elapsed=options.reducedMotion?0:Math.max(0,Number.isFinite(timeSeconds)?timeSeconds:0),t=(Math.sin(elapsed*1.6+resident.phase)+1)/2;
     const ballPose={...pose,x:pose.x+(partner.x-pose.x)*t,y:pose.y+(partner.y-pose.y)*t,z:pose.z+(partner.z-pose.z)*t};
     place(balls,ballIndex,ballPose,[0,1+Math.sin(t*Math.PI)*.9,0],[.19,.19,.19]);tint(balls,ballIndex++,resident.pair?'#f2ba4d':'#ef7972');
    }
   }
  });
  props.count=propIndex;balls.count=ballIndex;
  for(const mesh of meshes){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 return {rebuild,update,
  get roster(){return residents.map(({id,name,role})=>({id,name,role}));},
  get controlledId(){return controlled?.id;},
  takeControl(id:string){const pose=latest.get(id);if(!pose)return undefined;release();returning.delete(id);controlled={id,pose:{...pose}};return {...pose};},
  moveControlled(pose:ResidentPose){if(controlled){controlled.pose={...pose};latest.set(controlled.id,{...pose});}},
  releaseControl:release,
  setMinds(decisions:NpcDecision[]){minds=new Map(decisions.map(decision=>[decision.id,decision]));},get count(){return residents.length;},get mindCount(){return minds.size;},dispose(){scene.remove(group);for(const mesh of meshes){mesh.geometry.dispose();mesh.dispose();}material.dispose();}};
}
