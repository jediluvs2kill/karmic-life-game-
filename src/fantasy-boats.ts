import * as THREE from 'three';

export type BoatKind='wind-cutter'|'lotus-skiff'|'turtle-cruiser'|'crystal-catamaran'|'skyfish-sloop'|'rune-barge'|'moon-junk'|'dragon-galley';
export type Fleet='azure'|'coral';
export type BoatRoute='south'|'east'|'north'|'west';
export type BoatPlan={id:string;name:string;kind:BoatKind;fleet:Fleet;route:BoatRoute;phase:number;direction:1|-1;speed:number;lane:number;color:string;accent:string};
export type BoatPose={x:number;y:number;z:number;yaw:number;bob:number};

/** Eight fantasy vessels stage theatrical magical skirmishes around the visible coastline. */
export const fantasyFleet:BoatPlan[]=[
 {id:'boat-nimbus',name:'Nimbus Wind Cutter',kind:'wind-cutter',fleet:'azure',route:'south',phase:.05,direction:1,speed:.055,lane:-1,color:'#d8f6ff',accent:'#54c8eb'},
 {id:'boat-lotus',name:'Lotus Petal Skiff',kind:'lotus-skiff',fleet:'coral',route:'south',phase:.21,direction:-1,speed:.047,lane:1,color:'#ffb5cf',accent:'#ffe295'},
 {id:'boat-turtle',name:'Jade Turtle Cruiser',kind:'turtle-cruiser',fleet:'azure',route:'east',phase:.38,direction:1,speed:.038,lane:-1,color:'#80d1a5',accent:'#f4d76f'},
 {id:'boat-crystal',name:'Crystal Twinrunner',kind:'crystal-catamaran',fleet:'coral',route:'east',phase:.55,direction:-1,speed:.061,lane:1,color:'#bdb1ff',accent:'#70e2ef'},
 {id:'boat-skyfish',name:'Skyfish Sloop',kind:'skyfish-sloop',fleet:'azure',route:'north',phase:.72,direction:1,speed:.052,lane:-1,color:'#8dc7ff',accent:'#fff0a1'},
 {id:'boat-rune',name:'Ember Rune Barge',kind:'rune-barge',fleet:'coral',route:'north',phase:.88,direction:-1,speed:.034,lane:1,color:'#e88765',accent:'#ffd06d'},
 {id:'boat-moon',name:'Moon Lantern Junk',kind:'moon-junk',fleet:'azure',route:'west',phase:.31,direction:1,speed:.043,lane:-1,color:'#c8b8ff',accent:'#fff3a8'},
 {id:'boat-dragon',name:'Dragonwake Galley',kind:'dragon-galley',fleet:'coral',route:'west',phase:.67,direction:-1,speed:.04,lane:1,color:'#ff9b78',accent:'#8cf0cb'}
];

export function sampleBoat(plan:BoatPlan,time:number,reducedMotion=false):BoatPose{
 const clock=reducedMotion?0:Math.max(0,Number.isFinite(time)?time:0),angle=(plan.phase+clock*plan.speed*plan.direction)*Math.PI*2;
 let x=0,z=0,dx=0,dz=0;
 if(plan.route==='south'){x=Math.cos(angle)*34;z=47+plan.lane*2.2+Math.sin(angle)*3;dx=-Math.sin(angle)*34*plan.direction;dz=Math.cos(angle)*3*plan.direction;}
 else if(plan.route==='north'){x=Math.cos(angle)*39;z=-47-plan.lane*2+Math.sin(angle)*2.8;dx=-Math.sin(angle)*39*plan.direction;dz=Math.cos(angle)*2.8*plan.direction;}
 else if(plan.route==='east'){x=47+plan.lane*2+Math.sin(angle)*2.8;z=Math.cos(angle)*32;dx=Math.cos(angle)*2.8*plan.direction;dz=-Math.sin(angle)*32*plan.direction;}
 else{x=-47-plan.lane*2+Math.sin(angle)*2.8;z=Math.cos(angle)*32;dx=Math.cos(angle)*2.8*plan.direction;dz=-Math.sin(angle)*32*plan.direction;}
 return {x,y:-5.48+(reducedMotion?0:Math.sin(clock*1.8+plan.phase*17)*.09),z,yaw:Math.atan2(dx,dz),bob:reducedMotion?0:Math.sin(clock*2.4+plan.phase*23)};
}

export function sampleFleetVolley(time:number,reducedMotion=false){
 if(reducedMotion)return [];
 return fantasyFleet.map((boat,index)=>{
  const target=fantasyFleet[index%2===0?index+1:index-1],from=sampleBoat(boat,time),to=sampleBoat(target,time);
  const travel=(time*.32+boat.phase*3)%1,arc=Math.sin(travel*Math.PI)*2.4;
  return {fleet:boat.fleet,x:from.x+(to.x-from.x)*travel,y:from.y+1.1+arc,z:from.z+(to.z-from.z)*travel};
 });
}

export function createFantasyBoats(scene:THREE.Scene,options:{reducedMotion?:boolean}={}){
 const root=new THREE.Group();root.name='Fantasy boats · theatrical magical skirmish';root.userData.truthState='FANTASY_WORLD';scene.add(root);
 const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.68,metalness:.05}),dark=new THREE.MeshStandardMaterial({color:'#183247',roughness:.72}),sailMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.82,side:THREE.DoubleSide});
 const batches:THREE.InstancedMesh[]=[];
 const batch=(name:string,geometry:THREE.BufferGeometry,mat:THREE.Material,max:number)=>{const mesh=new THREE.InstancedMesh(geometry,mat,max);mesh.name=name;mesh.count=max;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batches.push(mesh);root.add(mesh);return mesh;};
 const hulls=batch('unique fantasy hulls',new THREE.SphereGeometry(1,14,8),material,fantasyFleet.length*2),decks=batch('boat decks and turtle shells',new THREE.SphereGeometry(1,12,8),material,fantasyFleet.length);
 const masts=batch('boat masts',new THREE.CylinderGeometry(1,1,1,8),dark,fantasyFleet.length),sails=batch('boat sails',new THREE.PlaneGeometry(1,1),sailMaterial,fantasyFleet.length);
 const wings=batch('lotus petals and skyfish fins',new THREE.ConeGeometry(1,1,8),material,fantasyFleet.length*2),cannons=batch('magic pulse cannons',new THREE.CylinderGeometry(1,1,1,8),dark,fantasyFleet.length*2);
 const eyes=batch('anime prow eyes',new THREE.SphereGeometry(1,8,6),dark,fantasyFleet.length*2);
 const boltGeometry=new THREE.BufferGeometry(),boltPositions=new Float32Array(fantasyFleet.length*3);boltGeometry.setAttribute('position',new THREE.BufferAttribute(boltPositions,3));
 const bolts=new THREE.Points(boltGeometry,new THREE.PointsMaterial({color:'#fff0a1',size:.72,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));bolts.name='non-destructive magic volleys';root.add(bolts);
 const matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),tintColor=new THREE.Color();
 const tint=(mesh:THREE.InstancedMesh,index:number,value:string)=>mesh.setColorAt(index,tintColor.set(value));
 function place(mesh:THREE.InstancedMesh,index:number,pose:BoatPose,local:[number,number,number],size:[number,number,number],rotation:[number,number,number]=[0,0,0]){const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);position.set(pose.x+local[0]*c+local[2]*s,pose.y+local[1],pose.z-local[0]*s+local[2]*c);quaternion.setFromEuler(new THREE.Euler(rotation[0],pose.yaw+rotation[1],rotation[2]));matrix.compose(position,quaternion,scale.set(...size));mesh.setMatrixAt(index,matrix);}
 fantasyFleet.forEach((boat,i)=>{for(let side=0;side<2;side++){tint(hulls,i*2+side,boat.color);tint(wings,i*2+side,boat.accent);tint(cannons,i*2+side,boat.fleet==='azure'?'#305f88':'#8b3e3d');}tint(decks,i,boat.accent);tint(sails,i,boat.color);});
 for(const mesh of batches)if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 function update(time:number,visible=true){root.visible=visible;if(!visible)return;fantasyFleet.forEach((boat,i)=>{const pose=sampleBoat(boat,time,options.reducedMotion),twin=boat.kind==='crystal-catamaran',wide=boat.kind==='lotus-skiff',armored=boat.kind==='turtle-cruiser',long=boat.kind==='rune-barge'||boat.kind==='dragon-galley',fish=boat.kind==='skyfish-sloop'||boat.kind==='dragon-galley',tall=boat.kind==='wind-cutter'||boat.kind==='moon-junk';
  for(const side of [-1,1]){const k=i*2+(side>0?1:0),offset=twin?side*.72:0;place(hulls,k,pose,[offset,.34,0],twin?[.53,.27,1.42]:side<0?[long?.95:.78,.36,long?2.15:1.7]:[0,0,0]);place(wings,k,pose,[side*(wide?.92:.74),.52,fish?.05:-.1],wide?[.5,.12,.7]:fish?[.44,.12,.8]:[0,0,0],[side*.22,0,side*-.65]);place(cannons,k,pose,[side*.42,.77,.1],[.1,.48,.1],[Math.PI/2,0,0]);place(eyes,k,pose,[side*.24,.52,1.52],[.08,.11,.06]);}
  place(decks,i,pose,[0,.6,-.05],armored?[.72,.55,1]:long?[.7,.24,1.45]:[.62,.23,.9]);place(masts,i,pose,[0,1.2,-.12],[.07,tall?1.65:1.35,.07]);place(sails,i,pose,[0,tall?1.72:1.55,.02],[tall?1.5:1.1,tall?1.7:1.25,1],[0,0,0]);
 });
  const volleys=sampleFleetVolley(time,options.reducedMotion);bolts.visible=volleys.length>0;volleys.forEach((bolt,i)=>{boltPositions[i*3]=bolt.x;boltPositions[i*3+1]=bolt.y;boltPositions[i*3+2]=bolt.z;});boltGeometry.setDrawRange(0,volleys.length);boltGeometry.attributes.position.needsUpdate=true;
  for(const mesh of batches)mesh.instanceMatrix.needsUpdate=true;
 }
 update(0,true);
 return {update,count:fantasyFleet.length,dispose(){scene.remove(root);for(const mesh of batches){mesh.geometry.dispose();mesh.dispose();}material.dispose();dark.dispose();sailMaterial.dispose();boltGeometry.dispose();(bolts.material as THREE.Material).dispose();}};
}
