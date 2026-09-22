import * as THREE from 'three';

export type SkylineTower={x:number;z:number;height:number;width:number;phase:number;color:string};
const fract=(value:number)=>value-Math.floor(value);
const noise=(index:number,salt:number)=>fract(Math.sin((index+1)*(17.17+salt*9.31))*43758.5453);

export const skylineTowers:SkylineTower[]=Array.from({length:28},(_,index)=>({
 x:-58+index*(116/27),z:-56-Math.sin(index*.71)*3,height:10+noise(index,1)*16,width:1+noise(index,2),phase:noise(index,3)*Math.PI*2,color:new THREE.Color().setHSL((index/28+.54)%1,.96,.56).getStyle()
}));

export function sampleSkylineTower(tower:SkylineTower,time:number,reducedMotion=false){
 const clock=reducedMotion?0:Math.max(0,Number.isFinite(time)?time:0),pulse=reducedMotion?1:1+Math.sin(clock*.72+tower.phase)*.055;
 return {x:tower.x,y:-5.65+tower.height*pulse/2,z:tower.z,height:tower.height*pulse,width:tower.width};
}

/** Neon fantasy horizon: decorative city prisms and two slow aurora ribbons. */
export function createTrippySkyline(scene:THREE.Scene,options:{reducedMotion?:boolean}={}){
 const root=new THREE.Group();root.name='Trippy fantasy skyline';root.userData.truthState='FANTASY_WORLD';scene.add(root);
 const palette=['#ff54d8','#8064ff','#2de2e6','#42efa0','#ffe66d','#ff914d','#ff526f'],towerGeometry=new THREE.CylinderGeometry(.55,1,1,6),capGeometry=new THREE.OctahedronGeometry(1,0),perBand=skylineTowers.length/palette.length;
 const towerMaterials=palette.map(color=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7,fog:false,depthWrite:false,toneMapped:false})),capMaterials=palette.map(color=>new THREE.MeshBasicMaterial({color:new THREE.Color(color).offsetHSL(.04,.02,.12),transparent:true,opacity:.96,fog:false,depthWrite:false,toneMapped:false}));
 const towerBands=towerMaterials.map((material,index)=>{const mesh=new THREE.InstancedMesh(towerGeometry,material,perBand);mesh.name=`neon skyline band ${index+1}`;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(mesh);return mesh;}),capBands=capMaterials.map((material,index)=>{const mesh=new THREE.InstancedMesh(capGeometry,material,perBand);mesh.name=`glowing skyline crowns ${index+1}`;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(mesh);return mesh;});
 const ribbonCount=120,ribbonGeometry=new THREE.BufferGeometry(),ribbonPositions=new Float32Array(ribbonCount*3),ribbonColors=new Float32Array(ribbonCount*3);
 for(let i=0;i<ribbonCount;i++){const color=new THREE.Color().setHSL((i/ribbonCount+.48)%1,.9,.67);ribbonColors.set(color.toArray(),i*3);}
 ribbonGeometry.setAttribute('position',new THREE.BufferAttribute(ribbonPositions,3));ribbonGeometry.setAttribute('color',new THREE.BufferAttribute(ribbonColors,3));
 const ribbonMaterial=new THREE.PointsMaterial({size:1.45,transparent:true,opacity:.9,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending,fog:false}),ribbon=new THREE.Points(ribbonGeometry,ribbonMaterial);ribbon.name='animated aurora skyline';ribbon.frustumCulled=false;root.add(ribbon);
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
 function update(time:number,visible=true){root.visible=visible;if(!visible)return;skylineTowers.forEach((tower,index)=>{const pose=sampleSkylineTower(tower,time,options.reducedMotion),band=index%palette.length,slot=Math.floor(index/palette.length);matrix.compose(position.set(pose.x,pose.y,pose.z),rotation,scale.set(pose.width,pose.height,pose.width));towerBands[band].setMatrixAt(slot,matrix);matrix.compose(position.set(pose.x,-5.65+pose.height+.8,pose.z),rotation,scale.set(pose.width*.62,1.2+pose.width*.2,pose.width*.62));capBands[band].setMatrixAt(slot,matrix);});
  const clock=options.reducedMotion?0:Math.max(0,time);for(let i=0;i<ribbonCount;i++){const strand=Math.floor(i/(ribbonCount/2)),point=i%(ribbonCount/2),t=point/(ribbonCount/2-1),x=-62+t*124;ribbonPositions[i*3]=x;ribbonPositions[i*3+1]=24+strand*4+Math.sin(t*12+clock*.35+strand*1.7)*3.2;ribbonPositions[i*3+2]=-62-strand*3+Math.cos(t*8+clock*.22)*2;}
  for(const mesh of [...towerBands,...capBands])mesh.instanceMatrix.needsUpdate=true;ribbonGeometry.attributes.position.needsUpdate=true;
 }
 update(0,true);
 return {update,count:skylineTowers.length,dispose(){scene.remove(root);for(const mesh of [...towerBands,...capBands])mesh.dispose();towerGeometry.dispose();capGeometry.dispose();for(const material of [...towerMaterials,...capMaterials])material.dispose();ribbonGeometry.dispose();ribbonMaterial.dispose();}};
}
