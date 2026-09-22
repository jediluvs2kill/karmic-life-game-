import {mkdir,readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Document,NodeIO} from '@gltf-transform/core';
import {weld} from '@gltf-transform/functions';
import {Color} from 'three';
import {blockGeometry} from '../src/asset-geometry.ts';
import {architecture,architectureVersion,assetName} from '../src/architecture.ts';
import {projectsAt} from '../src/projects.ts';
import {createRepoStore,atomicJson,withLock} from './repo-store.mjs';

export async function writeProjectAsset(project,file){
 const positions=[],normals=[],colors=[];
 for(const b of architecture(project)){const source=blockGeometry(b),geo=source.toNonIndexed(),p=geo.getAttribute('position'),n=geo.getAttribute('normal'),color=new Color(b.color);source.dispose();
  for(let i=0;i<p.count;i++){positions.push(p.getX(i)+b.x,p.getY(i)+b.y,p.getZ(i)+b.z);normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(color.r,color.g,color.b,1);}geo.dispose();}
 const doc=new Document(),buffer=doc.createBuffer(),attribute=(type,array)=>doc.createAccessor().setType(type).setArray(new Float32Array(array)).setBuffer(buffer);
 const material=doc.createMaterial('voxel-colours').setMetallicFactor(0).setRoughnessFactor(.88),primitive=doc.createPrimitive().setAttribute('POSITION',attribute('VEC3',positions)).setAttribute('NORMAL',attribute('VEC3',normals)).setAttribute('COLOR_0',attribute('VEC4',colors)).setMaterial(material);
 const mesh=doc.createMesh(project.name).addPrimitive(primitive),node=doc.createNode(project.name).setMesh(mesh).setExtras({projectId:project.id,truthState:'FANTASY_WORLD',architectureVersion});doc.createScene('Idea building').addChild(node);
 await doc.transform(weld());await mkdir(path.dirname(file),{recursive:true});await new NodeIO().write(file,doc);
}
export async function compileWorld(root=process.cwd()){
 return withLock(root,'world-compile',async()=>{
  const events=await createRepoStore(root).read(),projects=projectsAt({events},'9999-12-31'),assets={};
  let catalogue={models:[]};
  try{catalogue=JSON.parse(await readFile(path.join(root,'assets/blender/catalogue.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const models=new Map(catalogue.models.map(model=>[model.projectId,model]));
  for(const p of projects){const filename=assetName(p)+'.glb',relative='assets/projects/'+filename,file=path.join(root,'public',relative);
   try{await access(file);}catch{await writeProjectAsset(p,file);}
   // In-place Blender edits retain their address but get a new browser-cache revision.
   const revision=createHash('sha256').update(await readFile(file)).digest('hex').slice(0,16);
   const model=models.get(p.id);
   assets[p.id]={url:relative,version:revision,...(model?{features:model.features,authoring:'Blender'}:{})};
  }
  const world={version:1,events,visited:[],night:false};
  await atomicJson(path.join(root,'public/world-state.json'),world);await atomicJson(path.join(root,'public/project-assets.json'),assets);
  return {projects:projects.length,events:events.length,assets};
 });
}
