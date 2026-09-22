console.warn('PUBLIC REPOSITORY: this contribution and its evidence will be visible on GitHub when synchronized. Do not include private data.');
import {randomUUID} from 'node:crypto';
import {createRepoStore} from '../server/repo-store.mjs';
import {compileWorld} from '../server/compile-world.mjs';
import {projectsAt} from '../src/projects.ts';
import {requestSync} from '../server/repo-sync.mjs';
const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){if(!args[i].startsWith('--')||args[i+1]===undefined)throw new Error('Use --name value pairs.');options[args[i].slice(2)]=args[i+1];}
if(!options.actor||!options.title||!options.summary||!options.truth)throw new Error('Required: --actor, --title, --summary, --truth; use --project ID for an existing idea, or --zone ID for a new one. Add --type and --evidence to record work.');
const store=createRepoStore(process.cwd());await store.seed();const events=await store.read(),project=projectsAt({events},'9999-12-31').find(p=>p.id===options.project);
if(options.project&&!project)throw new Error('Unknown project ID.');
const event={id:'contribution:'+randomUUID(),date:options.date??new Date(Date.now()+19800000).toISOString().slice(0,10),title:options.title,summary:options.summary,zone:project?.zone??options.zone??'ideas',kind:options.type?'build':'idea',sourceTitle:options.source??options.actor+' contribution',actor:options.actor,truthState:options.truth,...(project?{project}:{}),...(options.type?{work:{type:options.type,evidence:options.evidence}}:{})};
const result=await store.append([event],options.actor);await compileWorld();await requestSync(process.cwd());console.log(JSON.stringify({added:result.added,id:event.id,project:result.events.find(e=>e.id===event.id)?.project?.id}));
