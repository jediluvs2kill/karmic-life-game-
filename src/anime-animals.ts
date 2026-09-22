import * as THREE from 'three';
import {groundHeight,landmarks} from './civilization.ts';
import {walkGrid} from './navigation.ts';
import {projectPosition,type LivingProject} from './projects.ts';

export type AnimalKind='cloud-fox'|'lotus-cat'|'star-deer'|'river-kirin'|'moon-bunny'|'moss-sprite';
type Point={x:number;z:number};
export type AnimalPlan={id:string;name:string;kind:AnimalKind;projectId:string;route:Point[];phase:number;speed:number;color:string;accent:string};
export type AnimalPose=Point&{y:number;yaw:number;gait:number};

const cast:{name:string;kind:AnimalKind;project:string;color:string;accent:string}[]=[
 {name:'Nimbus',kind:'cloud-fox',project:'windpanel',color:'#eaf8ff',accent:'#69cde0'},
 {name:'Tara',kind:'star-deer',project:'guru-engine',color:'#f4d6a7',accent:'#ffe279'},
 {name:'Mala',kind:'lotus-cat',project:'rudraksha',color:'#f3b4cd',accent:'#fff0b3'},
 {name:'Ripple',kind:'river-kirin',project:'bio-bottle',color:'#8ae4df',accent:'#6eb6ff'},
 {name:'Lumi',kind:'moon-bunny',project:'religion-earths',color:'#d9d3ff',accent:'#fff1a6'},
 {name:'Minto',kind:'moss-sprite',project:'green-lab',color:'#8ed18a',accent:'#f7da72'},
 {name:'Comet',kind:'cloud-fox',project:'gravity-rail',color:'#ffd2a8',accent:'#ff8f77'},
 {name:'Pixel',kind:'moon-bunny',project:'karmic-life',color:'#a8d8ff',accent:'#e5a8ff'}
];

function connectedWalkable(tiles:Set<string>){
 const unseen=new Set(tiles);let largest=new Set<string>();
 while(unseen.size){const first=unseen.values().next().value!,part=new Set([first]),queue=[first];unseen.delete(first);for(let i=0;i<queue.length;i++){const [x,z]=queue[i].split(',').map(Number);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const key=`${x+dx},${z+dz}`;if(unseen.delete(key)){part.add(key);queue.push(key);}}}if(part.size>largest.size)largest=part;}
 return largest;
}

/** Fictional decorative creatures only; they never create evidence or project progress. */
export function planAnimeAnimals(projects:LivingProject[],walkable:Set<string>):AnimalPlan[]{
 if(!projects.length||!walkable.size)return [];
 const paths=connectedWalkable(walkable),ordered=[...projects].sort((a,b)=>a.id.localeCompare(b.id));
 return cast.flatMap((animal,index)=>{
  const project=ordered.find(p=>p.id===animal.project)??ordered[index%ordered.length],position=projectPosition(project),scale=landmarks[project.id]?.scale??1;
  const startTarget={x:position.x+(index%2?2.4:-2.4),z:position.z+3.5*scale};
  const start=walkGrid(startTarget,startTarget,paths)[0];if(!start)return [];
  const endTarget={x:start.x+(index%2?5:-5),z:start.z+((index%3)-1)*4};
  let route=walkGrid(start,endTarget,paths);
  if(route.length<2){const alternative=[...paths].map(key=>{const [x,z]=key.split(',').map(Number);return {x,z,d:(x-endTarget.x)**2+(z-endTarget.z)**2};}).filter(p=>p.x!==start.x||p.z!==start.z).sort((a,b)=>a.d-b.d)[0];if(alternative)route=walkGrid(start,alternative,paths);}
  return [{id:`animal-${index+1}`,name:animal.name,kind:animal.kind,projectId:project.id,route:route.length?route:[start],phase:index*2.17,speed:.72+(index%3)*.12,color:animal.color,accent:animal.accent}];
 });
}

export function sampleAnimeAnimal(plan:AnimalPlan,time:number,reducedMotion=false):AnimalPose{
 const path=plan.route,first=path[0]??{x:0,z:0},distance=Math.max(0,path.length-1),travel=distance/plan.speed,pause=2.5,cycle=Math.max(1,2*(travel+pause));
 const elapsed=reducedMotion?0:(Math.max(0,time)+plan.phase)%cycle;let cursor=0,back=false;
 if(elapsed>pause&&elapsed<pause+travel)cursor=(elapsed-pause)*plan.speed;else if(elapsed>=pause+travel&&elapsed<2*pause+travel)cursor=distance;else if(elapsed>=2*pause+travel){cursor=distance-(elapsed-2*pause-travel)*plan.speed;back=true;}
 const index=Math.min(Math.floor(cursor),Math.max(0,path.length-2)),a=path[index]??first,b=path[index+1]??a,t=cursor-index,facing=back?-1:1;
 return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:groundHeight(a.x,a.z)+.12,yaw:Math.atan2((b.x-a.x)*facing,(b.z-a.z)*facing),gait:reducedMotion?0:Math.sin((time+plan.phase)*7)};
}

export function createAnimeAnimals(scene:THREE.Scene,options:{reducedMotion?:boolean}={}){
 const root=new THREE.Group();root.name='Imaginary anime animals';root.userData.truthState='FANTASY_WORLD';scene.add(root);
 const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.72,metalness:0});
 const dark=new THREE.MeshStandardMaterial({color:'#172435',roughness:.65});
 const gold=new THREE.MeshStandardMaterial({color:'#ffe078',roughness:.55,emissive:'#8b5c12',emissiveIntensity:.12});
 const batches:THREE.InstancedMesh[]=[];
 const batch=(name:string,geometry:THREE.BufferGeometry,mat:THREE.Material,max:number)=>{const mesh=new THREE.InstancedMesh(geometry,mat,max);mesh.name=name;mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batches.push(mesh);root.add(mesh);return mesh;};
 const body=batch('round animal bodies',new THREE.SphereGeometry(1,12,9),material,8),head=batch('oversized anime heads',new THREE.SphereGeometry(1,12,9),material,8);
 const ears=batch('expressive animal ears',new THREE.ConeGeometry(1,1,8),material,16),tails=batch('fluffy tails',new THREE.SphereGeometry(1,10,8),material,8);
 const eyes=batch('large anime eyes',new THREE.SphereGeometry(1,8,6),dark,16),horns=batch('fantasy horns',new THREE.ConeGeometry(1,1,8),gold,8),wings=batch('tiny spirit wings',new THREE.SphereGeometry(1,10,6),material,16);
 const matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),color=new THREE.Color(),up=new THREE.Vector3(0,1,0);
 let animals:AnimalPlan[]=[];
 const tint=(mesh:THREE.InstancedMesh,index:number,value:string)=>mesh.setColorAt(index,color.set(value));
 function place(mesh:THREE.InstancedMesh,index:number,pose:AnimalPose,local:[number,number,number],size:[number,number,number],tilt=0){const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);position.set(pose.x+local[0]*c+local[2]*s,pose.y+local[1],pose.z-local[0]*s+local[2]*c);quaternion.setFromEuler(new THREE.Euler(tilt,pose.yaw,0));matrix.compose(position,quaternion,scale.set(...size));mesh.setMatrixAt(index,matrix);}
 function rebuild(projects:LivingProject[],walkable:Set<string>){animals=planAnimeAnimals(projects,walkable);for(const mesh of batches)mesh.count=0;animals.forEach((animal,i)=>{tint(body,i,animal.color);tint(head,i,animal.color);tint(tails,i,animal.accent);for(let side=0;side<2;side++){tint(ears,i*2+side,animal.accent);tint(wings,i*2+side,animal.accent);}});body.count=head.count=tails.count=animals.length;ears.count=eyes.count=wings.count=animals.length*2;horns.count=animals.length;for(const mesh of batches)if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;update(0,true);}
 function update(time:number,visible=true){root.visible=visible;if(!visible)return;animals.forEach((animal,i)=>{const pose=sampleAnimeAnimal(animal,time,options.reducedMotion),bounce=Math.abs(pose.gait)*.07,earTall=animal.kind==='moon-bunny'?.42:.25;
  place(body,i,pose,[0,.38+bounce,0],[.42,.3,.54]);place(head,i,pose,[0,.76+bounce,.25],[.37,.38,.35]);place(tails,i,pose,[0,.46+bounce,-.52],animal.kind==='cloud-fox'?[.34,.3,.48]:[.25,.25,.25],-.25);
  for(const side of [-1,1]){const k=i*2+(side>0?1:0);place(ears,k,pose,[side*.2,1.03+bounce,.21],[.13,earTall,.13],side*.12);place(eyes,k,pose,[side*.12,.81+bounce,.565],[.065,.095,.045]);place(wings,k,pose,[side*.43,.49+bounce,-.02],[.18,.08,.3],side*.32);}
  const hasHorn=animal.kind==='star-deer'||animal.kind==='river-kirin';place(horns,i,pose,[0,1.1+bounce,.31],hasHorn?[.1,.34,.1]:[0,0,0]);
 });for(const mesh of batches)mesh.instanceMatrix.needsUpdate=true;}
 return {rebuild,update,get count(){return animals.length;},dispose(){scene.remove(root);for(const mesh of batches){mesh.geometry.dispose();mesh.dispose();}material.dispose();dark.dispose();gold.dispose();}};
}
