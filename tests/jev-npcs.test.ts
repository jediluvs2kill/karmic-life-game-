import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyJevAnswers,fallbackNpcDecisions,parseJevAnswers} from '../server/jev-npcs.mjs';

test('local NPC decisions remain deterministic, typed, and varied',()=>{
 const first=fallbackNpcDecisions(12),again=fallbackNpcDecisions(12),later=fallbackNpcDecisions(13);
 assert.deepEqual(first,again);
 assert.equal(first.length,24);
 assert.equal(new Set(first.map(d=>d.id)).size,24);
 assert.ok(first.every(d=>d.action&&d.mood&&Number.isFinite(d.confidence)&&d.confidence>=0&&d.confidence<=1));
 assert.ok(first.some((d,i)=>d.action!==later[i].action||d.mood!==later[i].mood));
});

test('Jev answer parsing accepts supported response envelopes and rejects invalid choices',()=>{
 const answers={builder:{choice:'build',confidence:.9},player:{choice:'play',confidence:.8}};
 for(const response of [{answers},{result:{answers}},{data:{answers}}]){
  const parsed=applyJevAnswers(parseJevAnswers(response),7);
  assert.equal(parsed.length,24);
  assert.ok(parsed.some(d=>d.action==='build'));
  assert.ok(parsed.some(d=>d.action==='play'));
 }
 const invalid=applyJevAnswers({builder:{choice:'fly-to-mars'}},7);
 assert.equal(invalid.length,24);
 assert.ok(invalid.every(d=>d.action!=='fly-to-mars'));
});
