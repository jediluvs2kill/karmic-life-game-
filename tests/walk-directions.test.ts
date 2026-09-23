import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {stepWalker,type Walker} from '../src/resident-control.ts';

test('left and right movement match screen direction at every camera heading',()=>{
 const tiles=new Set(['-1,-1','-1,0','-1,1','0,-1','0,0','0,1','1,-1','1,0','1,1']);
 const walker:Walker={x:0,z:0,yaw:0,gait:0,hop:0,hopVelocity:0,moving:false};
 for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5,.37,2.1]){
  const camera=new THREE.PerspectiveCamera(38,1,.1,100);
  camera.position.set(-Math.sin(yaw)*7,4,-Math.cos(yaw)*7);
  camera.lookAt(0,1.3,0);camera.updateMatrixWorld();
  const origin=new THREE.Vector3(0,0,0).project(camera);
  for(const right of [-1,1]){
   const moved=stepWalker(walker,{forward:0,right,yaw,run:false,jump:false},.05,tiles);
   const screen=new THREE.Vector3(moved.x,0,moved.z).project(camera);
   assert.ok((screen.x-origin.x)*right>0,`Input ${right} is mirrored at heading ${yaw}`);
  }
 }
});
