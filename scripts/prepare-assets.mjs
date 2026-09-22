import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,flatten,getBounds} from '@gltf-transform/functions';
import {mkdir,writeFile,copyFile,stat} from 'node:fs/promises';

const sources={nature:{folder:'GLTF format',page:'https://kenney.nl/assets/nature-kit'},town:{folder:'GLB format',page:'https://kenney.nl/assets/fantasy-town-kit'},pirate:{folder:'GLB format',page:'https://kenney.nl/assets/pirate-kit'}};
const selected={
 oak:['nature','tree_oak'],birch:['nature','tree_detailed'],pine:['nature','tree_pineRoundC'],rock:['nature','rock_largeA'],rockTall:['nature','rock_tallA'],bush:['nature','plant_bushDetailed'],flowers:['nature','flower_purpleA'],bridge:['nature','bridge_wood'],
 roof:['town','roof-gable'],window:['town','wall-wood-window-shutters'],door:['town','wall-wood-door'],fountain:['town','fountain-round-detail'],stall:['town','stall-red'],cart:['town','cart'],lantern:['town','lantern'],bench:['town','stall-bench'],
 ship:['pirate','ship-medium'],palm:['pirate','palm-detailed-bend'],harbourRock:['pirate','rocks-a'],tower:['pirate','tower-complete-small'],barrel:['pirate','barrel'],crate:['pirate','crate'],
};
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const out='public/assets/kenney';await mkdir(out,{recursive:true});let total=0;const manifest={};
const linearColor=hex=>[...hex.matchAll(/[a-f0-9]{2}/gi)].map(([pair])=>{const c=parseInt(pair,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
for(const [id,[pack,name]] of Object.entries(selected)){
 const source=`.asset-source/${pack}/Models/${sources[pack].folder}/${name}.glb`,doc=await io.read(source),scene=doc.getRoot().listScenes()[0];
 if(doc.getRoot().listAnimations().length)throw new Error('This static pipeline requires a nonanimated model: '+id);
 // Nature models use unlit materials. Convert to lit PBR for the island's day/night cycle.
 for(const material of doc.getRoot().listMaterials()){material.getExtension('KHR_materials_unlit')?.dispose();material.setRoughnessFactor(.9).setMetallicFactor(0);}
 if(pack==='nature')for(const material of doc.getRoot().listMaterials()){
  const palette={leafsGreen:id==='oak'?'#52933d':'#77a84b',leafsDark:'#246847',woodBark:'#795235',woodBarkDark:'#61452e',grass:id==='rockTall'?'#a5b9ad':'#59913d',dirt:id==='rockTall'?'#5b778b':'#818873',colorPurple:'#c56faf'};
  const color=palette[material.getName()];if(color)material.setBaseColorFactor([...linearColor(color),1]);
 }
 const bounds=getBounds(scene),size=bounds.max.map((v,i)=>v-bounds.min[i]),scale=1/Math.max(...size);
 if(!Number.isFinite(scale)||scale<=0)throw new Error('Invalid model bounds: '+id);
 const root=doc.createNode(id).setScale([scale,scale,scale]).setTranslation([-(bounds.min[0]+bounds.max[0])/2*scale,-bounds.min[1]*scale,-(bounds.min[2]+bounds.max[2])/2*scale]);
 for(const node of scene.listChildren())root.addChild(node);scene.addChild(root);
 await doc.transform(flatten(),dedup(),prune());
 for(const texture of doc.getRoot().listTextures())if(texture.getURI()?.startsWith('http'))throw new Error('Remote texture found');
 const file=`${out}/${id}.glb`;await io.write(file,doc);const bytes=(await stat(file)).size;total+=bytes;
 const primitiveCount=doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().length,0);
 manifest[id]={file:id+'.glb',source:sources[pack].page,original:name+'.glb',license:'CC0-1.0',bytes,primitives:primitiveCount,size:size.map(v=>Number((v*scale).toFixed(5)))};
}
for(const pack of Object.keys(sources))await copyFile(`.asset-source/${pack}/License.txt`,`${out}/LICENSE-${pack}.txt`);
await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2));
console.log(`${Object.keys(manifest).length} models, ${(total/1024).toFixed(0)} KB total`);
