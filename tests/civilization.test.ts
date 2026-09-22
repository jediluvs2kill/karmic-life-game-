import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {getBounds} from '@gltf-transform/functions';
import {inventionEvents} from '../src/inventory.ts';
import {projectsAt,projectPosition} from '../src/projects.ts';
import {landmarks} from '../src/civilization.ts';
import {buildLandscape} from '../src/landscape.ts';
import {walkGrid} from '../src/navigation.ts';
import {assetName} from '../src/architecture.ts';

test('all 77 Blender idea buildings retain identity, grounded bounds, distinct geometry, and game-ready materials',async()=>{
 const projects=projectsAt({events:inventionEvents},'2026-09-22'),io=new NodeIO(),signatures=new Set<string>();
 const catalogue=JSON.parse(await readFile('assets/blender/catalogue.json','utf8')) as {version:number;generator:string;models:{projectId:string;asset:string;features:string[];triangles:number}[]};
 assert.equal(projects.length,77);
 assert.equal(catalogue.version,3);assert.equal(catalogue.generator,'Blender');
 assert.equal(catalogue.models.length,projects.length);
 assert.deepEqual(new Set(catalogue.models.map(model=>model.projectId)),new Set(projects.map(project=>project.id)),'The authored catalogue must cover every idea exactly once');
 for(const p of projects){
  const file='public/assets/projects/'+assetName(p)+'.glb',bytes=await readFile(file),doc=await io.readBinary(bytes),root=doc.getRoot();
  const entry=catalogue.models.find(model=>model.projectId===p.id)!;
  assert.equal(entry.asset,'assets/projects/'+assetName(p)+'.glb',p.id+' catalogue points to the wrong building');
  assert.ok(entry.features.length>0&&entry.features.every(feature=>typeof feature==='string'&&feature.trim().length>0),p.id+' needs an authored explanation of its idea features');
  assert.ok(bytes.length<=2*1024*1024,p.id+' exceeds the 2 MB asset budget');
  const owner=root.listNodes().find(node=>node.getExtras().projectId===p.id);
  assert.ok(owner,p.id+' must carry its permanent project identity');
  assert.equal(owner.getExtras().truthState,'FANTASY_WORLD');
  assert.equal(owner.getExtras().architectureVersion,3,p.id+' must use the Blender asset revision');
  assert.equal(owner.getExtras().generator,'Blender');
  assert.equal(root.listTextures().length,0,p.id+' should ship self-contained untextured materials');
  assert.ok(root.listMaterials().length>0,p.id+' has no materials');
  for(const material of root.listMaterials()){
   assert.equal(material.getMetallicFactor(),0,p.id+' should receive diffuse daylight');
   assert.equal(material.getAlphaMode(),'OPAQUE',p.id+' must avoid transparency sorting artifacts');
   assert.equal(material.getBaseColorFactor()[3],1,p.id+' must remain fully opaque');
  }
  const scenes=root.listScenes();assert.equal(scenes.length,1,p.id+' needs one model scene');
  const bounds=getBounds(scenes[0]);
  assert.ok([...bounds.min,...bounds.max].every(Number.isFinite),p.id+' has invalid world bounds');
  assert.ok(Math.abs(bounds.min[1])<.015,p.id+' must sit on the ground after scene transforms');
  assert.ok(bounds.max[1]>.25,p.id+' must have a visible three-dimensional silhouette');
  let triangles=0;const geometry=createHash('sha256');
  for(const node of root.listNodes())if(node.getMesh()){
   geometry.update(JSON.stringify(node.getWorldMatrix()));
   for(const primitive of node.getMesh()!.listPrimitives()){
    assert.equal(primitive.getMode(),4,p.id+' must export triangle primitives');
    const position=primitive.getAttribute('POSITION');assert.ok(position,p.id+' has missing positions');
    const coordinates=position.getArray()!;assert.ok(Array.from(coordinates).every(Number.isFinite),p.id+' has invalid coordinates');
    geometry.update(Buffer.from(coordinates.buffer,coordinates.byteOffset,coordinates.byteLength));
    const indices=primitive.getIndices();
    if(indices){const values=indices.getArray()!;geometry.update(Buffer.from(values.buffer,values.byteOffset,values.byteLength));}
    triangles+=(indices?.getCount()??position.getCount())/3;
   }
  }
  assert.ok(triangles>0&&triangles<=20000,p.id+' exceeds the 20,000 triangle budget: '+triangles);
  assert.equal(entry.triangles,triangles,p.id+' catalogue triangle count must describe the exported model');
  const signature=geometry.digest('hex');assert.ok(!signatures.has(signature),p.id+' duplicates another idea’s geometry');signatures.add(signature);
 }
});
test('agents can reach every central landmark over rendered land without entering building footprints',()=>{
 const projects=projectsAt({events:inventionEvents},'2026-09-22'),tiles=buildLandscape(projects,()=>{},()=>true);
 for(const p of projects.filter(p=>landmarks[p.id])){
  const location=projectPosition(p),end={x:location.x,z:location.z+6},path=walkGrid({x:-4,z:1},end,tiles);
  assert.ok(path.length,'Unreachable landmark: '+p.id);assert.ok(Math.hypot(path.at(-1)!.x-end.x,path.at(-1)!.z-end.z)<4,'Destination too far from '+p.id);
  for(const point of path)assert.ok(tiles.has(point.x+','+point.z));
 }
});
