import {createRepoStore} from '../server/repo-store.mjs';
import {compileWorld} from '../server/compile-world.mjs';
await createRepoStore(process.cwd()).seed();
const result=await compileWorld();console.log(`World ready: ${result.projects} individual GLB buildings, ${result.events} contributions.`);
