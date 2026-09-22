import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,mergeEvents,importData,worldAt,dayNumber,validateEvent} from '../src/state.ts';
import {pathBetween} from '../src/navigation.ts';

test('repeated imports update a memory without duplicating progression',()=>{
 const updated={...initial.events[0],summary:'Updated context'};
 const result=mergeEvents(initial.events,[updated,updated]);
 assert.equal(result.length,initial.events.length);assert.equal(result.find(e=>e.id===updated.id)?.summary,'Updated context');
});
test('historical snapshots exclude future memories and preserve district positions',()=>{
 const past=worldAt(initial,'2026-09-21'),present=worldAt(initial,'2026-09-22');
 assert.equal(past.find(z=>z.id==='maker')?.level,0);assert.ok(present.find(z=>z.id==='maker')!.level>0);
 assert.deepEqual(past.map(z=>[z.id,z.x,z.z]),present.map(z=>[z.id,z.x,z.z]));assert.equal(dayNumber('2026-09-22'),1);assert.equal(dayNumber('2026-09-23'),2);
});
test('ChatGPT export extracts user text only, deduplicates by message, and uses India dates',()=>{
 const input=[{id:'chat-1',title:'Gravity Transit Concept',mapping:{a:{message:{id:'a',create_time:Date.parse('2027-01-02T20:00:00Z')/1000,author:{role:'user'},content:{parts:['A freight idea.']}}},b:{message:{id:'b',create_time:1,author:{role:'assistant'},content:{parts:['Not a user statement']}}}}}];
 const events=importData(input);assert.equal(events.length,1);assert.equal(events[0].date,'2027-01-03');assert.equal(events[0].zone,'transit');assert.equal(mergeEvents(events,importData(input)).length,1);
});
test('invalid imports are rejected before changing the current save',()=>{
 assert.throws(()=>importData({events:[{...initial.events[0],date:'2026-02-31'}]}));
 assert.throws(()=>validateEvent({...initial.events[0],zone:'unknown'}));
 assert.throws(()=>importData({events:'not an array'}));
});
test('saved worlds round trip all memories',()=>{assert.deepEqual(importData(JSON.parse(JSON.stringify(initial))),initial.events);});
test('agents can navigate from headquarters to every district without crossing buildings',()=>{
 const districts=worldAt(initial,'2026-09-22');
 for(const z of districts){const route=pathBetween({x:11,z:4},{x:z.x,z:z.z+3},districts.map(d=>d.id));assert.ok(route.length,`No route to ${z.name}`);for(const point of route.slice(1))assert.equal(districts.some(d=>Math.abs(point.x-d.x)<2.8&&Math.abs(point.z-d.z)<2.2),false);}
});
