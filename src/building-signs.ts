import * as THREE from 'three';
import {ideaLabel} from './idea-labels.ts';
import {landmarks} from './civilization.ts';
import {projectFloor,projectPosition,type LivingProject} from './projects.ts';
import {progression} from './progression.ts';

/** Physical entrance plaques: fixed world scale, depth tested, never camera-facing UI. */
export function createBuildingSigns(projects:LivingProject[],colorFor:(project:LivingProject)=>string){
 const group=new THREE.Group();group.name='Building entrance nameplates';
 const pickers:THREE.Object3D[]=[],textures:THREE.Texture[]=[];
 if(!projects.length)return {group,pickers,dispose:()=>{}};
 const box=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),tilt=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-.38);
 const frames=new THREE.InstancedMesh(box,new THREE.MeshStandardMaterial({color:'#c5ad78',roughness:.72,metalness:.25}),projects.length);
 const mounts=new THREE.InstancedMesh(box,new THREE.MeshStandardMaterial({color:'#35565c',roughness:.85}),projects.length*2);
 group.add(frames,mounts);
 const slots=projects.map((p,i)=>{
  const pos=projectPosition(p),scale=landmarks[p.id]?.scale??(projectFloor(p)>.0?.7:1),base=pos.y+(progression(p.events).level-1)*.15;
  const center=new THREE.Vector3(pos.x,base+.55*scale,pos.z+2.12*scale),width=3.8*scale,height=.78*scale;
  matrix.compose(center,tilt,new THREE.Vector3(width+.12*scale,height+.12*scale,.15*scale));frames.setMatrixAt(i,matrix);
  for(let side=0;side<2;side++){matrix.compose(new THREE.Vector3(pos.x+(side?1:-1)*1.3*scale,base+.20*scale,center.z),new THREE.Quaternion(),new THREE.Vector3(.12*scale,.40*scale,.14*scale));mounts.setMatrixAt(i*2+side,matrix);}
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(width,height,.2*scale),new THREE.MeshBasicMaterial({visible:false}));proxy.position.copy(center);proxy.quaternion.copy(tilt);proxy.userData.project=p.id;group.add(proxy);pickers.push(proxy);
  return {p,center,width,height,scale};
 });
 // Bounded atlas pages keep all 77 names to three textured draws, without a texture per building.
 for(let first=0;first<slots.length;first+=32){
  const page=slots.slice(first,first+32),rows=Math.ceil(page.length/4),canvas=document.createElement('canvas');canvas.width=2048;canvas.height=rows*128;
  const ctx=canvas.getContext('2d')!;const positions:number[]=[],uvs:number[]=[];
  const wrap=(text:string,max:number)=>{const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>max){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;};
  page.forEach(({p,center,width,height,scale},i)=>{
   const col=i%4,row=Math.floor(i/4),left=col*512,top=row*128,identity=ideaLabel(p);
   ctx.fillStyle='#102d37';ctx.fillRect(left,top,512,128);ctx.fillStyle=colorFor(p);ctx.fillRect(left+18,top+11,4,106);
   ctx.textAlign='center';ctx.fillStyle='#e7c789';ctx.font='600 11px sans-serif';ctx.fillText(p.zone.toUpperCase()+(projectFloor(p)?' · FLOOR '+projectFloor(p):' · KARMIC LIFE'),left+268,top+20);
   let font=26,lines:string[]=[];do{ctx.font='700 '+font+'px sans-serif';lines=wrap(identity.name,446);font-=2;}while(lines.length>2&&font>16);
   ctx.fillStyle='#f7f3df';const titleTop=lines.length>1?44:54;lines.slice(0,2).forEach((line,n)=>ctx.fillText(line,left+268,top+titleTop+n*26,446));
   ctx.font='14px sans-serif';ctx.fillStyle='#bde1df';const subtitle=wrap(identity.subtitle,442);subtitle.slice(0,2).forEach((line,n)=>ctx.fillText(line,left+268,top+98+n*18,442));
   const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
   for(const index of [0,1,2,0,2,3]){const [a,b]=corners[index],point=new THREE.Vector3(a*width,b*height,.081*scale).applyQuaternion(tilt).add(center);positions.push(point.x,point.y,point.z);uvs.push((col+a+.5)/4,1-(row+.5-b)/rows);}
  });
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;textures.push(texture);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  const faces=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));faces.name='Engraved names and subtitles';group.add(faces);
 }
 return {group,pickers,dispose(){textures.forEach(t=>t.dispose());}};
}
