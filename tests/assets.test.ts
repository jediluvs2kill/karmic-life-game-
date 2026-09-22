import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {getBounds} from '@gltf-transform/functions';

test('shipped scenery is self-contained, grounded, normalized, and within the download budget',async()=>{
 const dir=new URL('../public/assets/kenney/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',dir),'utf8'));
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);let bytes=0;
 assert.equal(Object.keys(manifest).length,22);
 for(const value of Object.values(manifest) as {file:string;license:string;bytes:number}[]){
  const url=new URL(value.file,dir),data=await readFile(url);bytes+=data.length;
  assert.equal(data.length,value.bytes);assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(value.license,'CC0-1.0');
  const doc=await io.readBinary(data),bounds=getBounds(doc.getRoot().listScenes()[0]);
  assert.ok(Math.abs(bounds.min[1])<.001,`${value.file} must sit on the ground`);
  const size=bounds.max.map((v,i)=>v-bounds.min[i]);assert.ok(Math.abs(Math.max(...size)-1)<.001,`${value.file} must use normalized scale`);
  assert.ok(Math.abs(bounds.min[0]+bounds.max[0])<.001&&Math.abs(bounds.min[2]+bounds.max[2])<.001,`${value.file} must be centered`);
  for(const texture of doc.getRoot().listTextures())assert.ok(texture.getImage()?.byteLength,`${value.file} has an external or missing texture`);
 }
 assert.ok(bytes<1024*1024,'The complete scenery set must stay below 1 MB');
});
