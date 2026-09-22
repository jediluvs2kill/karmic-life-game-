import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inventionEvents} from '../src/inventory.ts';
import {isCivilizationLand,insideOutline} from '../src/island-shape.ts';
import {projectsAt,projectPosition} from '../src/projects.ts';

test('the continent reads as an Akhand Bharat inspired silhouette with Sri Lanka',()=>{
 assert.equal(insideOutline(0,0),true);
 assert.equal(insideOutline(4,63),true);
 assert.equal(insideOutline(5,72),false);
 assert.equal(isCivilizationLand(5,72),true);
 assert.equal(isCivilizationLand(-30,60),false);
});

test('all current ideas have distinct positions on the reshaped continent',()=>{
 const projects=projectsAt({events:inventionEvents},'2026-09-22');
 const positions=projects.map(projectPosition);
 assert.equal(projects.length,77);
 assert.equal(new Set(positions.map(p=>`${p.x},${p.z}`)).size,projects.length);
 assert.ok(positions.every(p=>isCivilizationLand(p.x,p.z)));
 for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)
  assert.ok(Math.hypot(positions[i].x-positions[j].x,positions[i].z-positions[j].z)>6,`${projects[i].id} overlaps ${projects[j].id}`);
});
