import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const visualFeatures=new Map<string,string[]>();
export const projectVisualFeatures=(id:string):readonly string[]=>visualFeatures.get(id)??[];
export function createProjectAssets(ready:()=>void){
 const templates=new Map<string,THREE.Group>(),revisions=new Map<string,string>(),loader=new GLTFLoader();let loading=false;
 async function load(){if(loading)return;loading=true;let added=0,metadataChanged=false;const retired:THREE.Group[]=[];try{const response=await fetch(`${import.meta.env.BASE_URL}project-assets.json`,{cache:'no-cache'});if(!response.ok)return;const assets=await response.json() as Record<string,{url:string;version:string|number;features?:string[]}>;
  for(const [id,asset]of Object.entries(assets)){const features=(asset.features??[]).filter(f=>typeof f==='string').slice(0,8);if(JSON.stringify(features)!==JSON.stringify(visualFeatures.get(id)??[])){visualFeatures.set(id,features);metadataChanged=true;}}
  const pending=Object.entries(assets).filter(([id,a])=>(!templates.has(id)||revisions.get(id)!==String(a.version))&&/^assets\/projects\/idea-[a-f0-9]+\.glb$/.test(a.url));
  // Four requests at a time keeps a large archive from starving the interface.
  let cursor=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<pending.length){const [id,asset]=pending[cursor++];try{const model=await loader.loadAsync(import.meta.env.BASE_URL+asset.url+'?v='+encodeURIComponent(asset.version));model.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.sharedAsset=true;o.castShadow=false;o.receiveShadow=false;for(const material of (Array.isArray(o.material)?o.material:[o.material]))if(material instanceof THREE.MeshStandardMaterial&&material.name==='voxel-colours')material.metalness=0;}});const previous=templates.get(id);if(previous)retired.push(previous);templates.set(id,model.scene);revisions.set(id,String(asset.version));added++;}catch{}}}));
 }catch{/* Retain known models while offline; the next manifest poll retries. */}finally{loading=false;if(added||metadataChanged)ready();for(const old of retired)old.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const material of (Array.isArray(o.material)?o.material:[o.material]))material.dispose();}});}}
 function place(id:string,parent:THREE.Group,x:number,y:number,z:number,scale=1){const template=templates.get(id);if(!template)return false;const model=template.clone(true);model.position.set(x,y,z);model.scale.setScalar(scale);parent.add(model);return true;}
 return {load,place,get loaded(){return templates.size;}};
}
