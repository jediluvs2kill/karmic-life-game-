import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {release,releaseTitle,roadmap} from '../src/release.ts';

test('the named OS release agrees with package metadata and documented history',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
 const history=readFileSync(new URL('../RELEASES.md',import.meta.url),'utf8');
 assert.match(release.version,/^\d+\.\d+\.\d+$/);
 for(const version of [pkg.version,lock.version,lock.packages[''].version])assert.equal(version,release.version);
 assert.ok(releaseTitle.includes(release.name));assert.ok(history.includes(`v${release.version} — ${release.name}`));
 assert.ok(roadmap.every(item=>item.state==='USER_IDEA'&&item.status==='Planned'));
});
