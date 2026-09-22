import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('public runtime uses an isolated origin, storage key, and explicit publication notices',async()=>{
 const read=(p:string)=>readFile(p,'utf8');
 for(const file of ['vite.config.ts','server/world-api.mjs','server/swarm.mjs','server/jev-npcs.mjs','scripts/launch.mjs']){const text=await read(file);assert.ok(text.includes('5174'));assert.ok(!text.includes('5173'));}
 const state=await read('src/state.ts'),main=await read('src/main.ts');assert.ok(state.includes('karmic-public-world-v1'));assert.ok(main.includes('karmic-public-world-v1'));assert.ok(!state.includes('const reference='));
 for(const marker of ['PUBLIC REPOSITORY: imported text','PUBLIC WORLD: this idea','PUBLIC WORLD: work records','PUBLIC WORLD: agent reports','PUBLIC <strong>karmic-life-game-</strong>'])assert.ok(main.includes(marker),marker);
 assert.ok((await read('scripts/record-work.mjs')).includes('PUBLIC REPOSITORY'));
});
