import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {inventionProjects,inventionEvents} from '../src/inventory.ts';
import {progression} from '../src/progression.ts';
import {projectPosition} from '../src/projects.ts';
import {architecture,assetName} from '../src/architecture.ts';
import {validateEvent} from '../src/state.ts';
test('ideas alone do not upgrade buildings; dated work entries do',()=>{
 const idea=inventionEvents[0];assert.equal(progression(inventionEvents).level,1);
 const research=validateEvent({...idea,id:'research',date:'2026-10-01',work:{type:'research',evidence:'Bench notes'},truthState:'VERIFIED_REALITY'});
 const prototype=validateEvent({...research,id:'prototype',work:{type:'prototype',evidence:'models/rig.glb'}});
 assert.equal(progression([idea,research]).level,2);assert.equal(progression([idea,research,prototype]).level,4);
 assert.equal(progression([idea,prototype]).stage,'Prototype workshop');
 assert.equal(progression([idea,research,prototype].filter(e=>e.date<'2026-10-01')).level,1);
 assert.throws(()=>validateEvent({...research,work:{type:'research',evidence:''}}));
});
test('every current project has a distinct asset and future plots expand without repositioning',async()=>{
 assert.equal(new Set(inventionProjects.map(assetName)).size,77);assert.equal(new Set(inventionProjects.map(p=>JSON.stringify(architecture(p)))).size,77);
 const locations=inventionProjects.map(projectPosition);for(let i=0;i<locations.length;i++)for(let j=i+1;j<locations.length;j++)assert.ok(Math.hypot(locations[i].x-locations[j].x,locations[i].z-locations[j].z)>6);
 const original=projectPosition(inventionProjects[0]),future=projectPosition({...inventionProjects[0],id:'future-invention',plot:999});assert.deepEqual(projectPosition(inventionProjects[0]),original);assert.ok(Math.hypot(future.x,future.z)>4000);
 const doc=await new NodeIO().read('public/assets/projects/'+assetName(inventionProjects[0])+'.glb');assert.equal(doc.getRoot().listMeshes().length,1);assert.equal(doc.getRoot().listTextures().length,0);assert.equal(doc.getRoot().listNodes()[0].getExtras().projectId,inventionProjects[0].id);
});
