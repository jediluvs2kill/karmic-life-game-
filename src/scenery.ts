import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const ids=['oak','birch','pine','rock','rockTall','bush','flowers','bridge','roof','window','door','fountain','stall','cart','lantern','bench','ship','palm','harbourRock','tower','barrel','crate'] as const;
export type SceneryId=typeof ids[number];
type Part={geometry:THREE.BufferGeometry;material:THREE.Material|THREE.Material[]};

/** Share model geometry and use one instanced draw per primitive, including repeated trees. */
export function createScenery(){
 const templates=new Map<SceneryId,Part[]>(),placements=new Map<SceneryId,THREE.Matrix4[]>();
 const loader=new GLTFLoader();
 async function load(){
  const results=await Promise.allSettled(ids.map(async id=>{
   const gltf=await loader.loadAsync(`${import.meta.env.BASE_URL}assets/kenney/${id}.glb`);
   gltf.scene.updateMatrixWorld(true);const parts:Part[]=[];
   gltf.scene.traverse(node=>{if(node instanceof THREE.Mesh){const geo=node.geometry.clone().applyMatrix4(node.matrixWorld);geo.computeBoundingBox();geo.computeBoundingSphere();parts.push({geometry:geo,material:node.material});node.geometry.dispose();}});
   if(!parts.length)throw new Error('Empty scenery model: '+id);templates.set(id,parts);
  }));
  return {loaded:templates.size,total:ids.length,failed:results.filter(r=>r.status==='rejected').length};
 }
 function place(id:SceneryId,x:number,y:number,z:number,size:number|[number,number,number],rotation=0){
  if(!templates.has(id))return false;
  const scale=typeof size==='number'?new THREE.Vector3(size,size,size):new THREE.Vector3(...size);
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation),scale);
  if(!placements.has(id))placements.set(id,[]);placements.get(id)!.push(matrix);return true;
 }
 function flush(parent:THREE.Group){for(const [id,matrices]of placements){for(const part of templates.get(id)!){const mesh=new THREE.InstancedMesh(part.geometry,part.material,matrices.length);mesh.name='kenney-'+id;mesh.userData.sharedAsset=true;mesh.castShadow=false;mesh.receiveShadow=false;matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();parent.add(mesh);}}}
 return {load,place,flush,reset:()=>placements.clear(),has:(id:SceneryId)=>templates.has(id)};
}
