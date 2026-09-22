import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,mergeEvents,importData,validateEvent,zones} from '../src/state.ts';
import {projectsAt,projectPosition} from '../src/projects.ts';
import {inventionEvents,inventionProjects} from '../src/inventory.ts';
test('public release has one minimal catalogue record and permanent asset place per idea',()=>{
 assert.equal(inventionProjects.length,77);assert.equal(inventionEvents.length,77);
 assert.equal(new Set(inventionEvents.map(e=>e.id)).size,77);assert.equal(new Set(inventionProjects.map(p=>p.zone+':'+p.plot)).size,77);
 for(const p of inventionProjects)for(const id of p.links)assert.ok(inventionProjects.some(q=>q.id===id));
 for(const e of inventionEvents){assert.equal(e.date,'2026-09-22');assert.equal(e.truthState,'USER_IDEA');assert.equal(e.sourceId,undefined);assert.equal(e.work,undefined);assert.equal(e.dateEnd,undefined);}
 assert.equal(projectsAt(initial,'2026-09-22').length,77);assert.equal(projectsAt(initial,'2026-09-21').length,0);
});
test('catalogue round trips and repeated imports retain project addresses',()=>{
 const once=mergeEvents(initial.events,inventionEvents),twice=mergeEvents(once,inventionEvents);assert.deepEqual(twice,initial.events);assert.deepEqual(importData(JSON.parse(JSON.stringify(initial))),initial.events);
});
test('future and colliding ideas expand without moving existing places',()=>{
 const future={id:'future',title:'Future machine',summary:'A new concept',date:'2026-10-01',zone:'maker' as const,kind:'idea' as const,sourceTitle:'Public world journal'};
 const events=mergeEvents(initial.events,[future]),p=events.find(e=>e.id==='future')!.project!;assert.equal(p.plot,18);
 const more=mergeEvents(events,[{...future,id:'another',project:{...p,id:'another',plot:18}}]);assert.equal(more.find(e=>e.id==='future')!.project!.plot,18);assert.equal(more.find(e=>e.id==='another')!.project!.plot,19);
 for(const original of projectsAt(initial,'9999-12-31')){const later=projectsAt({events:more},'9999-12-31').find(p=>p.id===original.id)!;const zone=zones.find(z=>z.id===original.zone)!;assert.deepEqual(projectPosition(later,zone),projectPosition(original,zone));}
});
test('developments and explicitly imported messages share their existing project',()=>{
 const project=inventionProjects.find(p=>p.id==='windpanel')!;const events=mergeEvents(initial.events,[{...inventionEvents[0],id:'next-wind',date:'2026-10-01',project,zone:project.zone}]);assert.equal(projectsAt({events},'9999-12-31').length,77);
 const a={...inventionEvents[0],id:'chat:a',kind:'conversation' as const,sourceId:'public-fixture',project:undefined},b={...a,id:'chat:b'};const imported=mergeEvents(events,[a,b]);assert.equal(imported.find(e=>e.id===a.id)!.project!.id,imported.find(e=>e.id===b.id)!.project!.id);
});
test('invalid metadata and reversed date ranges are rejected',()=>{const e=inventionEvents[0];assert.throws(()=>validateEvent({...e,dateEnd:'2026-09-21'}));assert.throws(()=>validateEvent({...e,project:{...e.project,plot:-1}}));assert.throws(()=>validateEvent({...e,project:{...e.project,links:['ok',null]}}));});
