import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {boomDirection,clearBoomDistance,followBoom,followHeight,walkZoom} from '../src/walk-camera.ts';
import {groundHeight} from '../src/civilization.ts';

test('actual viewing pitch and heading stay fixed across terrain and close obstacles',()=>{
 const camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3(),direction=new THREE.Vector3();
 for(const yaw of [-2,-1,0,1,2])for(const pitch of [.08,.32,1.15]){
  let height:number|undefined,boom=7;
  for(let z=-42;z<55;z+=.2){
   height=followHeight(height,groundHeight(0,z)+1.3,.033);
   target.set(0,height,z);const ray=boomDirection(yaw,pitch);
   const clear=clearBoomDistance(target,ray,7,groundHeight,z%2<1?1.1:Infinity);
   boom=followBoom(boom,7,clear,.033);
   camera.position.copy(target).addScaledVector(direction.set(ray.x,ray.y,ray.z),boom);camera.lookAt(target);
   camera.getWorldDirection(direction);
   assert.ok(Math.abs(Math.asin(-direction.y)-pitch)<1e-9);
   assert.ok(Math.abs(direction.x-Math.sin(yaw)*Math.cos(pitch))<1e-9);
   assert.ok(boom<=clear&&boom>=.2);
  }
 }
});
test('terrain checks the whole boom, shortening before a ridge even if its endpoint is clear',()=>{
 const target={x:0,y:2,z:0},ray=boomDirection(0,.08);
 const d=clearBoomDistance(target,ray,12,(_x,z)=>z<-3&&z>-5?5:0);
 assert.ok(d<3.1&&d>2.5);
 assert.equal(clearBoomDistance(target,ray,12,()=>0,1),.7);
});
test('zoom normalizes wheel units, clamps extremes and recovers smoothly after collision',()=>{
 assert.equal(walkZoom(7,48),walkZoom(7,3,1));
 assert.equal(walkZoom(7,160),walkZoom(7,.2,2,800));
 assert.equal(walkZoom(2,-99999),2);assert.equal(walkZoom(18,99999),18);
 assert.ok(walkZoom(7,-100)<7);assert.ok(walkZoom(7,100)>7);
 assert.equal(followBoom(7,7,1,.033),1);
 const recovered=followBoom(1,7,7,.033);assert.ok(recovered>1&&recovered<7);
 assert.equal(followBoom(1,7,7,.033,true),7);
});
test('vertical follow smooths terrain and gives the same result at different frame rates',()=>{
 let a=2,b=2;for(let i=0;i<30;i++)a=followHeight(a,4,1/30);for(let i=0;i<60;i++)b=followHeight(b,4,1/60);
 assert.ok(Math.abs(a-b)<1e-10);assert.ok(followHeight(2,4,.033)>2&&followHeight(2,4,.033)<4);
 assert.equal(followHeight(undefined,4,0),4);assert.equal(followHeight(2,4,.033,true),4);
});
