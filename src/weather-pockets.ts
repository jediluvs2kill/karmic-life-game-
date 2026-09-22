import * as THREE from 'three';
import {groundHeight} from './civilization.ts';

export type WeatherKind='rain'|'snow'|'mist'|'petals'|'fireflies';
export type WeatherPocket={id:string;name:string;kind:WeatherKind;x:number;z:number;radius:number;height:number;color:string;count:number};

/** Small fantasy microclimates. They decorate a place without changing global lighting or fog. */
export const weatherPockets:WeatherPocket[]=[
 {id:'wake-rain',name:'Wake Rain',kind:'rain',x:-22,z:-14,radius:7,height:9,color:'#8edcff',count:76},
 {id:'temple-snow',name:'Temple Snow',kind:'snow',x:-4,z:-23,radius:7,height:10,color:'#f4fbff',count:68},
 {id:'bio-mist',name:'Bio Lab Mist',kind:'mist',x:-14,z:15,radius:6,height:3.5,color:'#a8f3ef',count:45},
 {id:'rudraksha-petals',name:'Rudraksha Petals',kind:'petals',x:15,z:11,radius:6,height:7,color:'#ff9fc4',count:56},
 {id:'dream-fireflies',name:'Dream Fireflies',kind:'fireflies',x:15,z:-6,radius:7,height:4.5,color:'#ffe27d',count:52}
];

const fract=(value:number)=>value-Math.floor(value);
const seeded=(index:number,salt:number)=>fract(Math.sin((index+1)*(12.9898+salt*19.19))*43758.5453);

export function sampleWeatherParticle(pocket:WeatherPocket,index:number,time:number,reducedMotion=false){
 const angle=seeded(index,1)*Math.PI*2,radius=Math.sqrt(seeded(index,2))*pocket.radius;
 const baseX=Math.cos(angle)*radius,baseZ=Math.sin(angle)*radius,phase=seeded(index,3);
 const speed=pocket.kind==='rain'?5.8:pocket.kind==='snow'?1.15:pocket.kind==='petals'?.7:pocket.kind==='mist'?.16:.28;
 const clock=reducedMotion?0:Math.max(0,time);
 if(pocket.kind==='fireflies')return {x:baseX+Math.sin(clock*.6+phase*9)*.45,y:.65+phase*pocket.height+Math.sin(clock*1.4+phase*13)*.32,z:baseZ+Math.cos(clock*.5+phase*8)*.45};
 if(pocket.kind==='mist')return {x:baseX+Math.sin(clock*.18+phase*11)*1.1,y:.25+phase*pocket.height*.45,z:baseZ+clock*speed%3-1.5};
 const fall=(phase*pocket.height+clock*speed)%pocket.height;
 const drift=pocket.kind==='snow'?Math.sin(clock*.7+phase*18)*.55:pocket.kind==='petals'?Math.sin(clock+phase*15)*.8:clock*.24;
 return {x:baseX+drift,y:pocket.height-fall,z:baseZ+(pocket.kind==='petals'?Math.cos(clock*.8+phase*12)*.55:0)};
}

export function createWeatherPockets(scene:THREE.Scene,options:{reducedMotion?:boolean}={}){
 const root=new THREE.Group();root.name='Fantasy pocket weather';root.userData.truthState='FANTASY_WORLD';scene.add(root);
 const systems=weatherPockets.map(pocket=>{
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(pocket.count*3);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.PointsMaterial({color:pocket.color,size:pocket.kind==='mist'?.55:pocket.kind==='fireflies'?.2:.16,transparent:true,opacity:pocket.kind==='mist'?.22:.82,depthWrite:false,sizeAttenuation:true,blending:pocket.kind==='fireflies'?THREE.AdditiveBlending:THREE.NormalBlending});
  const points=new THREE.Points(geometry,material);points.name=pocket.name;points.position.set(pocket.x,groundHeight(pocket.x,pocket.z)+.2,pocket.z);points.frustumCulled=false;root.add(points);
  return {pocket,points,positions,geometry,material};
 });
 function update(time:number,visible=true){
  root.visible=visible;if(!visible)return;
  for(const system of systems){
   for(let i=0;i<system.pocket.count;i++){const p=sampleWeatherParticle(system.pocket,i,time,options.reducedMotion);const offset=i*3;system.positions[offset]=p.x;system.positions[offset+1]=p.y;system.positions[offset+2]=p.z;}
   system.geometry.attributes.position.needsUpdate=true;
  }
 }
 update(0);
 return {update,count:weatherPockets.length,dispose(){scene.remove(root);for(const system of systems){system.geometry.dispose();system.material.dispose();}}};
}
