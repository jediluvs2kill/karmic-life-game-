import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {configureWorldCamera,panCamera,cameraDestination} from '../src/camera-navigation.ts';

test('traveling across the world moves the orbit point with the camera without changing the viewing angle',()=>{
 const camera=new THREE.PerspectiveCamera();camera.position.set(20,15,30);
 const controls=new OrbitControls(camera,null);configureWorldCamera(controls);controls.target.set(10,2,10);
 const offset=camera.position.clone().sub(controls.target),origin=controls.target.clone();
 panCamera(camera,controls,1,1,.5);
 assert.ok(controls.target.distanceTo(origin)>1);
 assert.ok(camera.position.clone().sub(controls.target).distanceTo(offset)<1e-9);
 assert.equal(controls.target.y,2);
 const stationary=camera.position.clone();panCamera(camera,controls,0,0,.5);assert.deepEqual(camera.position,stationary);
});

test('focusing distant or southern assets preserves the approach direction and permits close inspection',()=>{
 const camera=new THREE.PerspectiveCamera();camera.position.set(-20,15,-30);
 const controls=new OrbitControls(camera,null);configureWorldCamera(controls);
 for(const point of [new THREE.Vector3(-30,3,-30),new THREE.Vector3(15,3,43),new THREE.Vector3(5000,3,5000)]){
  const destination=cameraDestination(camera,controls,point,2);
  assert.deepEqual(destination.target,point);
  assert.ok(Math.abs(destination.position.distanceTo(point)-2)<1e-9);
  assert.ok(destination.position.clone().sub(point).normalize().distanceTo(camera.position.clone().sub(controls.target).normalize())<1e-9);
 }
 const clamped=cameraDestination(camera,controls,new THREE.Vector3(),.01);
 assert.equal(clamped.position.length(),controls.minDistance);
});
