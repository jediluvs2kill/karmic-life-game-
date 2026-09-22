import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {inventionEvents} from '../src/inventory.ts';
import {projectsAt} from '../src/projects.ts';
import {buildLandscape} from '../src/landscape.ts';
import {createAnimeAnimals,planAnimeAnimals,sampleAnimeAnimal} from '../src/anime-animals.ts';
import {createWeatherPockets,sampleWeatherParticle,weatherPockets} from '../src/weather-pockets.ts';

const projects=projectsAt({events:inventionEvents},'2026-09-22');
const walkable=buildLandscape(projects,()=>{},()=>true);

test('eight named anime spirit animals stay on connected island paths',()=>{
 const animals=planAnimeAnimals(projects,walkable);
 assert.equal(animals.length,8);
 assert.equal(new Set(animals.map(animal=>animal.name)).size,8);
 assert.equal(new Set(animals.map(animal=>animal.kind)).size,6);
 assert.deepEqual(animals,planAnimeAnimals([...projects].reverse(),walkable));
 for(const animal of animals){
  assert.ok(projects.some(project=>project.id===animal.projectId));
  assert.ok(animal.route.length>1,animal.name+' needs a roaming route');
  for(let i=0;i<animal.route.length;i++){
   const point=animal.route[i];assert.ok(walkable.has(`${point.x},${point.z}`),animal.name+' left walkable terrain');
   if(i){const previous=animal.route[i-1];assert.equal(Math.abs(point.x-previous.x)+Math.abs(point.z-previous.z),1);}
  }
  for(let time=0;time<30;time+=.53){const pose=sampleAnimeAnimal(animal,time);assert.ok(walkable.has(`${Math.round(pose.x)},${Math.round(pose.z)}`));assert.ok(Object.values(pose).every(Number.isFinite));}
  assert.deepEqual(sampleAnimeAnimal(animal,0,true),sampleAnimeAnimal(animal,100,true));
 }
});

test('anime animals share a small instanced rendering budget',()=>{
 const scene=new THREE.Scene(),life=createAnimeAnimals(scene,{reducedMotion:true});life.rebuild(projects,walkable);
 assert.equal(life.count,8);const group=scene.children[0];assert.equal(group.userData.truthState,'FANTASY_WORLD');
 assert.ok(group.children.length<=7);assert.ok(group.children.every(child=>child instanceof THREE.InstancedMesh));
 const before=group.children.map(child=>Array.from((child as THREE.InstancedMesh).instanceMatrix.array));life.update(50,true);
 assert.deepEqual(group.children.map(child=>Array.from((child as THREE.InstancedMesh).instanceMatrix.array)),before);
 life.dispose();assert.equal(scene.children.length,0);
});

test('five localized weather pockets animate independently and respect reduced motion',()=>{
 assert.deepEqual(new Set(weatherPockets.map(pocket=>pocket.kind)),new Set(['rain','snow','mist','petals','fireflies']));
 for(const pocket of weatherPockets)for(let i=0;i<pocket.count;i+=7){
  const still=sampleWeatherParticle(pocket,i,0,true);assert.deepEqual(still,sampleWeatherParticle(pocket,i,90,true));
  assert.ok(Object.values(sampleWeatherParticle(pocket,i,1234)).every(Number.isFinite));
 }
 const scene=new THREE.Scene(),weather=createWeatherPockets(scene,{reducedMotion:true});assert.equal(weather.count,5);
 assert.equal(scene.children[0].children.length,5);assert.equal(scene.children[0].userData.truthState,'FANTASY_WORLD');
 weather.update(25,false);assert.equal(scene.children[0].visible,false);weather.dispose();assert.equal(scene.children.length,0);
});
