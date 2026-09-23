import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {canStand,stepWalker,type Walker} from '../src/resident-control.ts';
import {createInhabitants,footHeight} from '../src/inhabitants.ts';
import {buildLandscape} from '../src/landscape.ts';
import {inventionEvents} from '../src/inventory.ts';
import {projectsAt} from '../src/projects.ts';
const walker:Walker={x:0,z:0,yaw:0,gait:0,hop:0,hopVelocity:0,moving:false};
const input={forward:1,right:0,yaw:0,run:false,jump:false};
const grid=new Set(Array.from({length:21},(_,x)=>Array.from({length:21},(_,z)=>`${x-10},${z-10}`)).flat());

test('the return journey joins the autonomous route continuously for residents with a nonzero phase',()=>{
 const tiles=new Set(['0,0','0,1','0,2','1,0','1,1','1,2','2,0','2,1','2,2']);
 const projects=projectsAt({events:inventionEvents},'2026-09-23').slice(0,1);
 const scene=new THREE.Scene(),crowd=createInhabitants(scene);crowd.rebuild(projects,tiles);
 const id=crowd.roster[1].id;crowd.takeControl(id);
 crowd.moveControlled({...walker,y:footHeight(walker),gesture:0});crowd.releaseControl();
 let previous=new THREE.Vector3(0,0,0);
 for(let i=0;i<180;i++){
  crowd.update(100+i*.05,.05,true);
  const torso=scene.children[0].children[0] as THREE.InstancedMesh,matrix=new THREE.Matrix4();torso.getMatrixAt(1,matrix);
  const position=new THREE.Vector3().setFromMatrixPosition(matrix);position.y=0;
  assert.ok(position.distanceTo(previous)<=.17,'Finishing a return route must not jump to the old animation phase');previous=position;
 }
 crowd.dispose();
});

test('walking is camera-relative, diagonal speed is normalized and sprint is faster',()=>{
 const forward=stepWalker(walker,input,.05,grid),side=stepWalker(walker,{...input,yaw:Math.PI/2},.05,grid);
 assert.ok(forward.z>0&&Math.abs(forward.x)<1e-9);assert.ok(side.x>0&&Math.abs(side.z)<1e-9);
 const diagonal=stepWalker(walker,{...input,right:1},.05,grid);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-forward.z)<1e-9);
 assert.ok(stepWalker(walker,{...input,run:true},.05,grid).z>forward.z);
 assert.deepEqual(stepWalker(walker,input,NaN,grid),walker);
});

test('walls, coastlines and diagonal blocked corners cannot be crossed, even while hopping',()=>{
 const tiles=new Set(['0,0','1,1']);let state=walker;
 for(let i=0;i<200;i++){state=stepWalker(state,{...input,right:1,run:true,jump:i===0},1,tiles);assert.ok(canStand(state,tiles));}
 assert.ok(state.x<.35&&state.z<.35);
 assert.equal(state.hop,0);
 assert.equal(canStand({x:0,z:1},tiles),false);
});

test('hop lands, idle input stays still, and movement uses the rendered island navigation cells',()=>{
 let state=stepWalker(walker,{...input,forward:0,jump:true},.05,grid);assert.ok(state.hop>0);
 for(let i=0;i<40;i++)state=stepWalker(state,{...input,forward:0},.05,grid);
 assert.equal(state.hop,0);assert.equal(state.x,0);assert.equal(state.z,0);
 const projects=projectsAt({events:inventionEvents},'2026-09-23'),tiles=buildLandscape(projects,()=>{},()=>true);
 const scene=new THREE.Scene(),residents=createInhabitants(scene);residents.rebuild(projects,tiles);residents.update(100,0,true);
 assert.equal(residents.roster.length,24);
 for(const resident of residents.roster){
  const pose=residents.takeControl(resident.id)!;assert.ok(pose);assert.equal(residents.controlledId,resident.id);
  let controlled={...walker,x:Math.round(pose.x),z:Math.round(pose.z)};
  for(let i=0;i<300;i++){controlled=stepWalker(controlled,{...input,yaw:i*.1,run:true},.05,tiles);assert.ok(canStand(controlled,tiles));}
  residents.moveControlled({...controlled,y:footHeight(controlled),gait:0,gesture:0});
  residents.update(101,.05,true);residents.releaseControl();assert.equal(residents.controlledId,undefined);
  residents.update(101.05,.05,true);
  const resumed=residents.takeControl(resident.id)!;assert.ok(Math.hypot(resumed.x-controlled.x,resumed.z-controlled.z)<.11,'Release must walk back instead of teleporting');
  residents.releaseControl();
 }
 residents.rebuild(projects,tiles);assert.equal(residents.controlledId,undefined);residents.dispose();
});
