import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createOccluderFade,shoreTexture} from '../src/graphics.ts';
import {proofXP} from '../src/progression.ts';
import type {LifeEvent} from '../src/state.ts';

test('build XP excludes idea mentions and evidence-free records without changing research growth',()=>{
 const event=(type?:string,evidence='notes.md')=>({work:type?{type,evidence}:undefined}) as LifeEvent;
 assert.equal(proofXP([event(),event('research'),event('design'),event('shipped',' ')]),0);
 assert.equal(proofXP([event('prototype'),event('test'),event('shipped')]),7);
});
test('shore texture includes coast and deep sea with valid distances',()=>{
 const {texture}=shoreTexture(140,64),data=texture.image.data as Uint8Array;
 assert.ok(data.some((v,i)=>i%4===1&&v===255));assert.ok(data.some((v,i)=>i%4===0&&v===255));
 for(let i=0;i<data.length;i+=4){if(data[i+1]===255)assert.equal(data[i],0);assert.equal(data[i+3],255);}
 texture.dispose();
});
test('walking clears only scenery and restores all instance transforms on exit or rebuild',()=>{
 const group=new THREE.Group(),camera=new THREE.PerspectiveCamera();camera.position.set(0,1,7);
 const tree=new THREE.InstancedMesh(new THREE.BoxGeometry(2,3,2),new THREE.MeshBasicMaterial(),1);tree.name='kenney-oak';
 const matrix=new THREE.Matrix4().makeTranslation(0,1,3);tree.setMatrixAt(0,matrix);group.add(tree);
 const bridge=new THREE.InstancedMesh(tree.geometry,tree.material,1);bridge.name='kenney-bridge';bridge.setMatrixAt(0,matrix);group.add(bridge);group.updateMatrixWorld(true);
 const fade=createOccluderFade(),actual=new THREE.Matrix4();
 fade.update(100,true,group,camera,new THREE.Vector3(0,1,0));assert.equal(fade.count,1);
 bridge.getMatrixAt(0,actual);assert.deepEqual(actual.elements,matrix.elements);
 fade.reset();tree.getMatrixAt(0,actual);assert.deepEqual(actual.elements,matrix.elements);assert.equal(fade.count,0);
 fade.update(200,true,group,camera,new THREE.Vector3(0,1,0));fade.update(300,false,group,camera,new THREE.Vector3());
 tree.getMatrixAt(0,actual);assert.deepEqual(actual.elements,matrix.elements);
 tree.geometry.dispose();(tree.material as THREE.Material).dispose();tree.dispose();bridge.dispose();
});
