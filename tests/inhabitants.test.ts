import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {inventionEvents} from '../src/inventory.ts';
import {projectsAt} from '../src/projects.ts';
import {landmarks} from '../src/civilization.ts';
import {buildLandscape} from '../src/landscape.ts';
import {createInhabitants,planInhabitants,sampleInhabitant} from '../src/inhabitants.ts';

const projects=projectsAt({events:inventionEvents},'2026-09-22');
const walkable=buildLandscape(projects,()=>{},()=>true);

test('the resident cast is deterministic, covers lively roles, and belongs to existing ideas',()=>{
 const residents=planInhabitants(projects,walkable);
 assert.equal(residents.length,24);
 assert.equal(new Set(residents.map(resident=>resident.id)).size,24);
 assert.deepEqual(residents,planInhabitants([...projects].reverse(),walkable));
 assert.deepEqual(new Set(residents.map(resident=>resident.role)),new Set(['runner','courier','builder','gardener','player']));
 assert.ok(residents.some(resident=>!landmarks[resident.projectId]),'Outer idea neighborhoods should have residents too');
 for(const resident of residents)assert.ok(projects.some(project=>project.id===resident.projectId));
 const players=residents.filter(resident=>resident.role==='player');
 assert.equal(players.length,4);
 for(const pair of new Set(players.map(player=>player.pair)))assert.equal(players.filter(player=>player.pair===pair).length,2);
 assert.deepEqual(planInhabitants([],walkable),[]);
 assert.deepEqual(planInhabitants(projects,new Set()),[]);
});

test('every resident route follows rendered walkable cells and never cuts across an obstacle',()=>{
 for(const resident of planInhabitants(projects,walkable)){
  assert.ok(resident.route.length>0);
  for(let i=0;i<resident.route.length;i++){
   const point=resident.route[i];assert.ok(walkable.has(point.x+','+point.z),resident.id+' leaves rendered walkable ground');
   if(i){const previous=resident.route[i-1];assert.equal(Math.abs(point.x-previous.x)+Math.abs(point.z-previous.z),1,'Route segments must join neighboring cells');}
  }
  if(resident.role!=='player')assert.ok(resident.route.length>1,resident.id+' needs room to move');
  for(let time=0;time<40;time+=.47){
   const pose=sampleInhabitant(resident,time);
   assert.ok(walkable.has(Math.round(pose.x)+','+Math.round(pose.z)),resident.id+' animation crosses a blocked cell');
   assert.ok([pose.x,pose.y,pose.z,pose.yaw,pose.gait,pose.gesture].every(Number.isFinite));
  }
 }
});

test('resident animation stays finite and reduced motion retains a stationary populated world',()=>{
 const residents=planInhabitants(projects,walkable);
 for(const resident of residents){
  assert.deepEqual(sampleInhabitant(resident,0,true),sampleInhabitant(resident,120,true));
  assert.deepEqual(sampleInhabitant(resident,NaN),sampleInhabitant(resident,0));
  const late=sampleInhabitant(resident,1000000);
  assert.ok([late.x,late.y,late.z,late.yaw,late.gait,late.gesture].every(Number.isFinite));
 }
 const scene=new THREE.Scene(),crowd=createInhabitants(scene,{reducedMotion:true});
 crowd.rebuild(projects,walkable);assert.equal(crowd.count,24);
 const group=scene.children[0];assert.ok(group.children.length<=10,'The entire crowd should fit within ten shared draws');
 assert.ok(group.children.every(object=>object instanceof THREE.InstancedMesh),'Residents must share geometry instead of allocating individual rigs');
 const transforms=group.children.map(object=>Array.from((object as THREE.InstancedMesh).instanceMatrix.array));
 crowd.update(75,.016,true);
 assert.deepEqual(group.children.map(object=>Array.from((object as THREE.InstancedMesh).instanceMatrix.array)),transforms);
 crowd.update(76,.016,false);assert.equal(group.visible,false);assert.equal(crowd.count,24);
 crowd.dispose();assert.equal(scene.children.length,0);
});
