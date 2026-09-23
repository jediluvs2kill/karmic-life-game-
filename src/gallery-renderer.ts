import * as THREE from 'three';
import {galleryHeight,galleryVisitor,type IdeaGallery} from './idea-galleries.ts';
import type {createProjectAssets} from './project-assets.ts';

/** Open galleries retain the individual invention GLBs. No gameplay visit earns evidence. */
export function createGalleryArchitecture(towers:IdeaGallery[],assets:ReturnType<typeof createProjectAssets>){
 const group=new THREE.Group();group.name='Future Ideas Malls';group.userData.truthState='FANTASY_WORLD';
 const decks:{tower:string;level:number;group:THREE.Group}[]=[],visitors:{tower:IdeaGallery;group:THREE.Group;legs:THREE.Mesh[];phase:number}[]=[];
 let viewedTower:string|undefined,viewedLevel:number|undefined;
 function box(parent:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:string):THREE.Mesh{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.75}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 for(const tower of towers){
  const {x,z,radius:r}=tower,top=galleryHeight(tower,Math.max(...tower.floors.map(f=>f.level)))+.8;
  // Slender structural columns leave the original ground building readable.
  for(const dx of [-r-.35,r+.35])for(const dz of [-r-.35,r+.35])box(group,x+dx,(top+tower.base)/2,z+dz,.15,top-tower.base,.15,'#51797f');
  for(const dx of [-.65,.65])box(group,x+dx,(top+tower.base)/2,z+r+.25,.08,top-tower.base,.08,'#ebc476');
  for(const floor of tower.floors){
   const deck=new THREE.Group();group.add(deck);decks.push({tower:tower.id,level:floor.level,group:deck});const y=galleryHeight(tower,floor.level),width=r*2+1;
   box(deck,x,y-.14,z,width,.28,width,'#e4dbc3');
   box(deck,x,y-.27,z,width+.12,.08,width+.12,'#42b8bb');
   for(const side of [-1,1]){
    box(deck,x+side*(r+.4),y+1.1,z,.07,.075,width,'#a7c8c5');
    box(deck,x,y+1.1,z+side*(r+.4),width,.075,.07,'#a7c8c5');
    for(const offset of [-r,0,r]){
     box(deck,x+side*(r+.4),y+.55,z+offset,.06,1.1,.06,'#a7c8c5');
     box(deck,x+offset,y+.55,z+side*(r+.4),.06,1.1,.06,'#a7c8c5');
    }
   }
   // Lift threshold at the south edge; the resident's collision ring keeps them on the deck.
   box(deck,x,y+.03,z+r,1.3,.06,.85,'#f2c772');
   box(deck,x,y+.06,z,4.5,.12,4.5,'#426877');
   if(floor.exhibit)assets.place(floor.exhibit.id,deck,x,y+.12,z,1);
   if(floor.reserved){
    const frame=new THREE.Mesh(new THREE.TorusGeometry(1.4,.065,8,40),new THREE.MeshStandardMaterial({color:'#7cdbdc',emissive:'#399eae',emissiveIntensity:.45}));frame.position.set(x,y+2,z);deck.add(frame);
    box(deck,x,y+.7,z,1.2,1.2,1.2,'#7bbcb9');
   }
  }
  if(tower.id==='dream-gallery')for(let i=0;i<2;i++){
   const person=new THREE.Group();group.add(person);const coat=box(person,0,.85,0,.42,.65,.3,i?'#d79867':'#719ed7');coat.geometry.dispose();coat.geometry=new THREE.CapsuleGeometry(.22,.3,4,8);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),new THREE.MeshStandardMaterial({color:'#edc399',roughness:1}));head.position.y=1.45;person.add(head);
   const legs=[-.12,.12].map(dx=>box(person,dx,.3,0,.14,.6,.17,'#334654'));
   for(const dx of [-.31,.31])box(person,dx,.83,0,.12,.6,.14,'#edc399');
   visitors.push({tower,group:person,legs,phase:i});
  }
 }
 return {group,
  visit(towerId?:string,level?:number){viewedTower=towerId;viewedLevel=level;for(const deck of decks)deck.group.visible=deck.tower!==towerId||level===undefined||deck.level<=level;},
  update(time:number,live:boolean,reduced:boolean){for(const v of visitors){const p=galleryVisitor(v.tower,time,v.phase,reduced);v.group.visible=live&&(v.tower.id!==viewedTower||viewedLevel===undefined||p.y<=galleryHeight(v.tower,viewedLevel)+.01);v.group.position.set(p.x,p.y,p.z);v.group.rotation.y=p.yaw;v.legs.forEach((leg,i)=>leg.rotation.x=p.moving?Math.sin(time*7+i*Math.PI)*.45:0);}}
 };
}
