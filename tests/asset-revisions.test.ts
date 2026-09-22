import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {compileWorld} from '../server/compile-world.mjs';
import {createRepoStore} from '../server/repo-store.mjs';
import {inventionEvents} from '../src/inventory.ts';

test('an in-place model edit changes its cache revision and survives world recompilation',async()=>{
 const prefix=path.join(tmpdir(),'karmic-test-asset-revision-'),root=await mkdtemp(prefix);
 try{
  const event=inventionEvents[0],id=event.project!.id,store=createRepoStore(root);
  await store.append([event],'Asset revision test');
  const features=['Body silhouette scanner','Weight comparison display'];
  await mkdir(path.join(root,'assets/blender'),{recursive:true});
  await writeFile(path.join(root,'assets/blender/catalogue.json'),JSON.stringify({models:[{projectId:id,features},{projectId:'not-in-this-world',features:['Unrelated display']}]}));
  const first=await compileWorld(root),original=first.assets[id];
  assert.match(original.version,/^[a-f0-9]{16}$/);
  assert.deepEqual(original.features,features,'The inspector must receive the matching idea’s authored features');
  assert.equal(original.authoring,'Blender');
  assert.deepEqual(Object.keys(first.assets),[id],'Catalogue entries must not create phantom world ideas');
  const file=path.join(root,'public',original.url),io=new NodeIO(),document=await io.read(file);
  const position=document.getRoot().listMeshes()[0].listPrimitives()[0].getAttribute('POSITION')!;
  const vertices=new Float32Array(position.getArray()!);vertices[0]+=.125;position.setArray(vertices);
  document.getRoot().listNodes()[0].setExtras({...document.getRoot().listNodes()[0].getExtras(),revisionAuthor:'Asset revision test'});
  await io.write(file,document);
  const editedBytes=await readFile(file),expectedRevision=createHash('sha256').update(editedBytes).digest('hex').slice(0,16);
  assert.notEqual(expectedRevision,original.version,'The fixture must contain a real model change');

  const revised=await compileWorld(root),published=JSON.parse(await readFile(path.join(root,'public/project-assets.json'),'utf8'));
  assert.equal(revised.assets[id].url,original.url,'Project addresses must survive model refinements');
  assert.equal(revised.assets[id].version,expectedRevision);
  assert.deepEqual(published[id],revised.assets[id]);
  assert.deepEqual(await readFile(file),editedBytes,'The compiler must preserve an agent’s edited model');

  const unchanged=await compileWorld(root);
  assert.deepEqual(unchanged.assets,revised.assets,'Unchanged assets must retain stable cache revisions');
  assert.deepEqual(await readFile(file),editedBytes);
  assert.equal((await store.read()).length,1,'Compiling assets must not fabricate progress events');
  assert.equal((await readdir(path.join(root,'state/footprints'))).length,1);
 }finally{
  assert.ok(path.resolve(root).startsWith(path.resolve(prefix)));
  await rm(root,{recursive:true,force:true});
 }
});
