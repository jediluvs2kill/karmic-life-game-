import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isCivilizationLand} from '../src/island-shape.ts';
import {gangaCells,gangaRoute,himalayanPeaks,mountainHeight} from '../src/geography.ts';
import {projectFloor,projectPosition,projectTowerId,protectedPlots,type LivingProject} from '../src/projects.ts';
import {ideaGalleries,galleryTiles,galleryEntrance,galleryHeight,galleryVisitor} from '../src/idea-galleries.ts';
import {canStand,stepWalker} from '../src/resident-control.ts';
import {buildLandscape} from '../src/landscape.ts';

const idea=(plot:number):LivingProject=>({id:'future-'+plot,name:'Future invention '+plot,zone:'maker',plot,motif:'science',links:[],events:[],started:'2026-09-23',updated:'2026-09-23'});
test('thousands of later ideas get stable distinct floors without growing the coastline',()=>{
 const positions=new Set<string>();
 for(let plot=0;plot<5000;plot++){
  const p=idea(plot),pos=projectPosition(p);assert.ok(isCivilizationLand(pos.x,pos.z));
  assert.equal(positions.has(`${pos.x},${pos.y},${pos.z}`),false);positions.add(`${pos.x},${pos.y},${pos.z}`);
  if(plot>=18){assert.equal(projectTowerId(p),projectTowerId(idea(plot%18)));assert.equal(projectFloor(p),Math.floor(plot/18));}
 }
 const before=projectPosition(idea(18));ideaGalleries([idea(19),idea(36),idea(18)]);assert.deepEqual(projectPosition(idea(18)),before);
});
test('terrain never adds land cells for upper-floor projects',()=>{
 const terrain=(projects:LivingProject[])=>{const cells=new Set<string>();buildLandscape(projects,(x,_y,z,_w,_h,_d,color)=>{if(color==='#659448'||color==='#5c8d43'){assert.ok(isCivilizationLand(x,z));cells.add(`${x},${z}`);}},()=>false);return cells;};
 assert.deepEqual(terrain([idea(0),idea(18),idea(180)]),terrain([idea(0)]));
});
test('Ganga is a connected river from northern headwaters to the eastern coast',()=>{
 assert.ok(gangaRoute.length>70);assert.ok(gangaRoute[0].z<-30);assert.ok(gangaRoute.at(-1)!.x>35);
 for(let i=1;i<gangaRoute.length;i++)assert.ok(Math.abs(gangaRoute[i].x-gangaRoute[i-1].x)+Math.abs(gangaRoute[i].z-gangaRoute[i-1].z)<=1);
 for(const cell of gangaCells){const [x,z]=cell.split(',').map(Number);assert.ok(isCivilizationLand(x,z));assert.ok(!protectedPlots().some(p=>Math.abs(p.x-x)<=2&&Math.abs(p.z-z)<=2));}
 assert.ok(himalayanPeaks.filter(p=>mountainHeight(p.x,p.z)>=20).length>=4);
 for(const p of protectedPlots())assert.equal(mountainHeight(p.x,p.z),0);
});
test('galleries expose real floor identities and collision keeps visitors on the deck',()=>{
 const [tower]=ideaGalleries([idea(18),idea(36)]);assert.deepEqual(tower.floors.map(f=>[f.level,f.project?.id]),[[1,'future-18'],[2,'future-36']]);
 const tiles=galleryTiles(tower),entrance=galleryEntrance(tower);assert.ok(canStand(entrance,tiles));assert.equal(canStand(tower,tiles),false);
 let walker={...entrance,yaw:0,gait:0,hop:0,hopVelocity:0,moving:false};
 for(let t=0;t<200;t++){walker=stepWalker(walker,{forward:1,right:0,yaw:0,run:true,jump:t===1},.05,tiles);assert.ok(canStand(walker,tiles));}
 const levels=new Set<number>();let liftSamples=0;
 for(let t=0;t<64;t+=.2){const p=galleryVisitor(tower,t);if(p.lift){liftSamples++;assert.equal(p.x,entrance.x);assert.equal(p.z,entrance.z);assert.ok(p.y>=galleryHeight(tower,1)&&p.y<=galleryHeight(tower,2));}else{levels.add(Math.round(p.y));assert.ok(canStand(p,tiles));}}
 assert.equal(levels.size,2);assert.ok(liftSamples>0);assert.deepEqual(galleryVisitor(tower,0,0,true),galleryVisitor(tower,100,0,true));
});
