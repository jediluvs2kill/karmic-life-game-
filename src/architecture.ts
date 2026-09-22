import type {Project} from './projects.ts';
import {landmarkArchitecture} from './landmark-architecture.ts';
export type AssetBlock={x:number;y:number;z:number;w:number;h:number;d:number;color:string;shape?:'box'|'cylinder'|'sphere'|'torus';rotation?:[number,number,number]};
export const architectureVersion=2;
export function hashId(id:string){let h=2166136261;for(const c of id){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function assetName(p:Pick<Project,'id'>){return 'idea-'+hashId(p.id).toString(16).padStart(8,'0');}
/** A unique reproducible building recipe, also exported as a self-contained GLB. */
export function architecture(p:Project):AssetBlock[]{
 const landmark=landmarkArchitecture(p.id);if(landmark)return landmark;
 const n=hashId(p.id),blocks:AssetBlock[]=[],palettes=[['#428b91','#c1e3cf','#e8ba72'],['#657dae','#bfcfe7','#e1bd8c'],['#9f725d','#f2d6b2','#e4a065'],['#668f55','#c8e2aa','#d6b36b'],['#8e74ab','#ddc9e9','#e7b39f']],colors=palettes[n%palettes.length],h=1.25+(n%5)*.15,w=2+(n%3)*.2;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>blocks.push({x,y,z,w,h,d,color});
 b(0,.14,0,3.7,.28,3.5,'#e0cea1');b(0,h/2+.3,0,w,h,1.9,colors[1]);b(0,h+.38,0,w+.35,.18,2.2,colors[0]);
 for(const x of [-.7,.7]){b(x,.95,1,.4,.5,.07,'#315976');b(x,1.24,1.03,.45,.08,.1,colors[2]);}b(0,.73,1,.43,.85,.1,colors[0]);
 for(let i=0;i<3+(n%3);i++)b(-1.2+i*.55,.32,1.3,.32,.12,.4,colors[2]);
 // Roof shapes, annexes and window layouts vary by permanent project identity.
 if(n%2)for(let i=0;i<4;i++)b(0,h+.55+i*.2,0,w+.5-i*.5,.22,2.25,colors[0]);
 else{b(-w/2,h+.64,0,.15,.4,2.2,colors[0]);b(w/2,h+.64,0,.15,.4,2.2,colors[0]);}
 b(n%2?1.35:-1.35,.6,-.4,.7,.7,1.1,colors[0]);
 const top=h+1.3;
 if(p.motif==='energy'){b(0,top+.55,0,.13,1.2,.13,'#e9e8d1');b(0,top+1.1,0,1.35,.13,.12,colors[2]);b(0,top+1.1,0,.13,1.35,.12,colors[2]);}
 else if(p.motif==='phone'){b(0,top+.4,0,.65,1.2,.22,colors[0]);b(0,top+.4,.13,.48,.85,.06,'#7edee0');}
 else if(p.motif==='robot'){b(0,top+.35,0,1,.75,.65,colors[0]);for(const x of [-.25,.25])b(x,top+.45,.35,.2,.2,.08,'#83e4d8');b(0,top+.95,0,.12,.5,.12,colors[2]);}
 else if(p.motif==='media'){b(0,top+.3,0,1.35,.9,.25,colors[0]);b(0,top+.3,.15,1.05,.62,.04,colors[2]);b(0,top+.3,.2,.25,.3,.05,'#f6ead5');}
 else if(p.motif==='network'){for(let i=0;i<3;i++){b((i-1)*.48,top+.15+i*.13,0,.35,.55+i*.26,.4,colors[0]);b((i-1)*.48,top+.5+i*.26,0,.25,.13,.3,colors[2]);}}
 else if(p.motif==='temple'){for(let i=0;i<4;i++)b(0,top+i*.24,0,1.3-i*.28,.26,1.2-i*.25,colors[2]);}
 else if(p.motif==='logistics'){for(const x of [-.6,.6])b(x,top+.25,0,.13,.8,1.2,colors[0]);b(0,top+.7,0,1.4,.15,.15,colors[2]);b(0,top+.97,0,.8,.45,.55,colors[0]);}
 else if(p.motif==='health'||p.motif==='garden'){b(0,top+.3,0,.27,1.1,.3,colors[0]);b(0,top+.45,0,1.05,.27,.3,colors[0]);}
 else if(p.motif==='materials'){for(let i=0;i<4;i++)b(0,top+i*.2,0,1-i*.16,.23,1-i*.16,colors[i%3]);}
 else if(p.motif==='game'){for(let i=0;i<3;i++)b((i-1)*.45,top+.1+i*.2,0,.4,.6+i*.3,.45,colors[i]);}
 else{b(0,top+.3,0,.85,.85,.85,colors[0]);b(0,top+.8,0,.4,.15,.4,colors[2]);}
 // A small voxel signature makes the geometry unique even within one family.
 for(let i=0;i<16;i++)if(n&(1<<i))b(-.65+(i%4)*.18,.8+Math.floor(i/4)*.18,-.97,.12,.12,.08,colors[0]);
 return blocks;
}
