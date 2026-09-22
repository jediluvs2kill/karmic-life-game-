import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {inventionEvents} from '../src/inventory.ts';
import {projectsAt} from '../src/projects.ts';
import {buildLandscape} from '../src/landscape.ts';
import {createAnimeAnimals,planAnimeAnimals,sampleAnimeAnimal} from '../src/anime-animals.ts';
import {createWeatherPockets,sampleWeatherParticle,weatherPockets} from '../src/weather-pockets.ts';
import {createFantasyBoats,fantasyFleet,sampleBoat,sampleFleetVolley} from '../src/fantasy-boats.ts';

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

test('six uniquely shaped fantasy boats patrol open water and exchange magical volleys',()=>{
 assert.equal(fantasyFleet.length,6);assert.equal(new Set(fantasyFleet.map(boat=>boat.kind)).size,6);assert.equal(new Set(fantasyFleet.map(boat=>boat.name)).size,6);
 assert.deepEqual(new Set(fantasyFleet.map(boat=>boat.fleet)),new Set(['azure','coral']));
 for(const boat of fantasyFleet){
  assert.deepEqual(sampleBoat(boat,0,true),sampleBoat(boat,200,true));
  for(let time=0;time<200;time+=3.7){const pose=sampleBoat(boat,time);assert.ok(pose.z>40,'Boat entered the island instead of staying in the southern sea lanes');assert.ok(Math.abs(pose.x)<=34.01);assert.ok(Object.values(pose).every(Number.isFinite));}
 }
 assert.equal(sampleFleetVolley(12).length,6);assert.deepEqual(sampleFleetVolley(12,true),[]);
 for(const bolt of sampleFleetVolley(999))assert.ok(Object.values(bolt).every(value=>typeof value==='string'||Number.isFinite(value)));
});

test('the complete fantasy fleet shares a compact render budget',()=>{
 const scene=new THREE.Scene(),boats=createFantasyBoats(scene,{reducedMotion:true});assert.equal(boats.count,6);
 const group=scene.children[0];assert.equal(group.userData.truthState,'FANTASY_WORLD');assert.ok(group.children.length<=8);
 assert.ok(group.children.slice(0,-1).every(child=>child instanceof THREE.InstancedMesh));
 const before=group.children.slice(0,-1).map(child=>Array.from((child as THREE.InstancedMesh).instanceMatrix.array));boats.update(80,true);
 assert.deepEqual(group.children.slice(0,-1).map(child=>Array.from((child as THREE.InstancedMesh).instanceMatrix.array)),before);
 boats.update(81,false);assert.equal(group.visible,false);boats.dispose();assert.equal(scene.children.length,0);
});
