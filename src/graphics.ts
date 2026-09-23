import * as THREE from 'three';
import {isCivilizationLand} from './island-shape.ts';

/**
 * Visual upgrade layer: golden-hour sky, shoreline-aware ocean, level-up
 * beacons, and walk-mode occluder fading. Kept separate from world.ts so the
 * simulation code stays readable.
 */

export const palette={
 day:{zenith:'#3a8fd9',horizon:'#f1dfc2',cool:'#b4d5ee',sunGlow:'#ffd08a',fog:'#b4d5ee',ambientSky:'#d7ecff',ambientGround:'#d8c29e',ambient:1.45,sun:'#ffdcae',sunIntensity:2.9,fill:'#a9c9ff',fillIntensity:.55},
 night:{zenith:'#040d1f',horizon:'#1b3456',cool:'#14294a',sunGlow:'#8fb4ff',fog:'#14294a',ambientSky:'#7f97c9',ambientGround:'#1b2433',ambient:.8,sun:'#b9cdff',sunIntensity:.7,fill:'#5b7bc4',fillIntensity:.3},
};

/** Golden-hour sun direction, shared by the sky glow, ocean glint, and light. */
export const sunDirection=new THREE.Vector3(-0.62,0.42,0.66).normalize();

export function createSky(){
 const uniforms={cool:{value:new THREE.Color(palette.day.cool)},zenith:{value:new THREE.Color(palette.day.zenith)},horizon:{value:new THREE.Color(palette.day.horizon)},glow:{value:new THREE.Color(palette.day.sunGlow)},sun:{value:sunDirection.clone()},night:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 dir;void main(){dir=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=vec4(p.xy,p.w*.99995,p.w);}`,
  fragmentShader:`uniform vec3 cool;uniform vec3 zenith;uniform vec3 horizon;uniform vec3 glow;uniform vec3 sun;uniform float night;varying vec3 dir;
   float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
   void main(){vec3 d=normalize(dir);float h=clamp(d.y,-.2,1.);
    float s=max(dot(d,normalize(sun)),0.);
    float toward=pow(max(dot(normalize(d.xz+1e-4),normalize(sun.xz)),0.),2.);
    vec3 hz=mix(cool,horizon,toward);       // cool horizon away from sun, warm toward it
    vec3 col=mix(hz,zenith,pow(smoothstep(-.02,.42,h),.7));
    col+=glow*(pow(s,6.)*.55+pow(s,64.)*.9);            // warm halo
    col=mix(col,vec3(1.,.97,.9),smoothstep(.9985,.9995,s)*(1.-night)); // sun disc
    float band=exp(-abs(h)*22.);col=mix(col,hz*1.04,band*.3);  // haze band
    if(night>.5){vec3 q=floor(d*420.);float st=step(.9975,hash(q))*smoothstep(.05,.4,h);col+=vec3(st*.9);}
    gl_FragColor=vec4(col,1.);
    #include <colorspace_fragment>
   }`});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1800,48,24),material);mesh.name='sky-dome';mesh.renderOrder=-10;mesh.frustumCulled=false;
 function setNight(n:boolean){const p=n?palette.night:palette.day;uniforms.zenith.value.set(p.zenith);uniforms.cool.value.set(p.cool);uniforms.horizon.value.set(p.horizon);uniforms.glow.value.set(p.sunGlow);uniforms.night.value=n?1:0;}
 return {mesh,setNight,follow:(camera:THREE.Camera)=>mesh.position.copy(camera.position)};
}

/**
 * Distance-to-shore field baked once from the island silhouette. The ocean
 * shader uses it for turquoise shallows and animated foam that hugs the real
 * coastline instead of a circle.
 */
export function shoreTexture(extent=140,size=280){
 const land=new Uint8Array(size*size);const dist=new Float32Array(size*size).fill(1e9);
 const toWorld=(i:number)=>(i/(size-1)*2-1)*extent;
 for(let j=0;j<size;j++)for(let i=0;i<size;i++){const k=j*size+i;if(isCivilizationLand(toWorld(i),toWorld(j))){land[k]=1;dist[k]=0;}}
 // Two-pass chamfer distance: cheap and smooth enough for foam bands.
 const pass=(forward:boolean)=>{const r=forward?[0,size,1]:[size-1,-1,-1];for(let j=r[0];j!==r[1];j+=r[2])for(let i=r[0];i!==r[1];i+=r[2]){const k=j*size+i;let v=dist[k];
  const nb=forward?[[-1,0,1],[0,-1,1],[-1,-1,1.414],[1,-1,1.414]]:[[1,0,1],[0,1,1],[1,1,1.414],[-1,1,1.414]];
  for(const [dx,dy,w]of nb){const x=i+dx,y=j+dy;if(x<0||y<0||x>=size||y>=size)continue;v=Math.min(v,dist[y*size+x]+w);}dist[k]=v;}};
 pass(true);pass(false);
 const texel=2*extent/(size-1),data=new Uint8Array(size*size*4);
 for(let k=0;k<size*size;k++){const d=Math.min(1,dist[k]*texel/26);data[k*4]=Math.round(d*255);data[k*4+1]=land[k]*255;data[k*4+3]=255;}
 const tex=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;tex.needsUpdate=true;
 return {texture:tex,extent};
}

export function createOcean(){
 const shore=shoreTexture();
 const uniforms={...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),time:{value:0},deep:{value:new THREE.Color('#0a5f9a')},shallow:{value:new THREE.Color('#2fd0cf')},foam:{value:new THREE.Color('#f4fffb')},sky:{value:new THREE.Color('#8fc4e6')},sunColor:{value:new THREE.Color('#fff1d0')},sun:{value:sunDirection.clone()},shore:{value:shore.texture},extent:{value:shore.extent},night:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms,fog:true,
  vertexShader:`varying vec3 worldPosition;
   #include <fog_pars_vertex>
   void main(){vec4 p=modelMatrix*vec4(position,1.);worldPosition=p.xyz;vec4 mvPosition=viewMatrix*p;gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`,
  fragmentShader:`uniform float time;uniform vec3 deep;uniform vec3 shallow;uniform vec3 foam;uniform vec3 sky;uniform vec3 sunColor;uniform vec3 sun;uniform sampler2D shore;uniform float extent;uniform float night;varying vec3 worldPosition;
   #include <fog_pars_fragment>
   vec2 waveGrad(vec2 p){vec2 g=vec2(0.);
    vec2 d1=normalize(vec2(1.,.35));float a1=dot(p,d1)*.55+time*1.1;g+=d1*cos(a1)*.55;
    vec2 d2=normalize(vec2(-.4,1.));float a2=dot(p,d2)*.9+time*1.6;g+=d2*cos(a2)*.35;
    vec2 d3=normalize(vec2(.8,-.6));float a3=dot(p,d3)*2.1+time*2.3;g+=d3*cos(a3)*.18;
    vec2 d4=normalize(vec2(-.9,-.2));float a4=dot(p,d4)*3.7+time*3.1;g+=d4*cos(a4)*.09;return g;}
   void main(){vec2 p=worldPosition.xz;
    vec2 uv=p/(2.*extent)+.5;float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
    float d=mix(1.,texture2D(shore,clamp(uv,0.,1.)).r,inside); // 0 at coast, 1 open sea
    float far=length(cameraPosition-worldPosition);float lod=1./(1.+far*.015); // calm distant water, no aliasing streaks
    vec2 g=waveGrad(p)*mix(.08,.16,d)*lod;vec3 n=normalize(vec3(-g.x,1.,-g.y));
    vec3 v=normalize(cameraPosition-worldPosition);
    float fres=pow(1.-max(dot(n,v),0.),4.);
    vec3 water=mix(shallow,deep,smoothstep(.02,.55,d));
    water=mix(water,sky,fres*.35);
    vec3 h=normalize(v+normalize(sun));float spec=pow(max(dot(n,h),0.),220.)*(1.-night*.6);
    water+=sunColor*spec*2.2*lod;
    // Foam: a bright lip at the coast plus slow bands rolling toward the beach.
    float lip=1.-smoothstep(.0,.035,d);
    float bands=smoothstep(.72,1.,sin(d*70.-time*1.6+sin(p.x*.35)*1.2))*(1.-smoothstep(.03,.16,d));
    float speck=smoothstep(.93,1.,sin(p.x*1.7+time*.7)*sin(p.y*1.9-time*.5))*(1.-smoothstep(.1,.35,d))*lod;
    water=mix(water,foam,clamp(lip*.9+bands*.55+speck*.25,0.,1.)*(1.-night*.55));
    gl_FragColor=vec4(water,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
   }`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=-5.9;mesh.name='ocean';
 return {mesh,update:(t:number)=>{uniforms.time.value=t;},setNight:(n:boolean)=>{uniforms.deep.value.set(n?'#05183a':'#0a5f9a');uniforms.shallow.value.set(n?'#11456a':'#2fd0cf');uniforms.foam.value.set(n?'#8fb6c9':'#f4fffb');uniforms.sky.value.set(n?'#1d3a63':'#8fc4e6');uniforms.sunColor.value.set(n?'#b9cdff':'#fff1d0');uniforms.night.value=n?1:0;}};
}

const levelColors=['#9fd8ff','#7ef0c8','#ffe27a','#ffb35c','#ff7ad9','#ffd36e'];

/** Fantasy light pillars over inventions with attributed work records. Taller and warmer with each level. */
export function createBeacons(items:{x:number;y:number;z:number;level:number}[]){
 const group=new THREE.Group();group.name='level-beacons';
 const beamGeo=new THREE.CylinderGeometry(.8,1.7,1,24,1,true);beamGeo.translate(0,.5,0);
 const ringGeo=new THREE.RingGeometry(1.6,2.1,40);
 const beams:{mat:THREE.ShaderMaterial;ring:THREE.Mesh;phase:number}[]=[];
 items.forEach((b,i)=>{
  const color=new THREE.Color(levelColors[Math.min(levelColors.length-1,Math.max(0,b.level-1))]);
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{color:{value:color.clone().multiplyScalar(1.8)},time:{value:0}},
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform vec3 color;uniform float time;varying vec2 vUv;void main(){float fade=pow(1.-vUv.y,1.6);float pulse=.75+.25*sin(time*2.+vUv.y*9.-time*3.);float edge=.55+.45*sin(vUv.x*6.2832*3.+time);gl_FragColor=vec4(color*pulse,fade*.3*edge);}`});
  const beam=new THREE.Mesh(beamGeo,mat);beam.scale.set(1,18+b.level*6,1);beam.position.set(b.x,b.y+.2,b.z);beam.renderOrder=5;group.add(beam);
  const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:color.clone().multiplyScalar(1.6),transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.set(b.x,b.y+.25,b.z);group.add(ring);beams.push({mat,ring,phase:i*1.7});
 });
 return {group,update(t:number,reduced:boolean){for(const b of beams){b.mat.uniforms.time.value=reduced?0:t+b.phase;if(!reduced){const s=1+((t*.6+b.phase)%1)*1.4;b.ring.scale.set(s,s,s);(b.ring.material as THREE.MeshBasicMaterial).opacity=.65*(1-((t*.6+b.phase)%1));}}}};
}

/**
 * Walk mode: trees, rocks and props between the camera and the resident are
 * hidden (collapsed instance) instead of blocking the view, then restored.
 */
export function createOccluderFade(){
 const ray=new THREE.Raycaster();const zero=new THREE.Matrix4().makeScale(0,0,0);
 const hidden=new Map<string,{meshes:THREE.InstancedMesh[];id:number;matrix:THREE.Matrix4;seen:number}>();
 let last=0;
 function restoreAll(){for(const h of hidden.values())restore(h);hidden.clear();}
 function restore(h:{meshes:THREE.InstancedMesh[];id:number;matrix:THREE.Matrix4}){for(const m of h.meshes){if(h.id<m.count){m.setMatrixAt(h.id,h.matrix);m.instanceMatrix.needsUpdate=true;}}}
 function update(now:number,active:boolean,root:THREE.Object3D,camera:THREE.Camera,target:THREE.Vector3){
  if(!active){if(hidden.size)restoreAll();return;}
  if(now-last<90)return;last=now;
  const candidates:THREE.InstancedMesh[]=[];root.traverse(o=>{if(o instanceof THREE.InstancedMesh&&/^kenney-(oak|birch|pine|palm|bush|rock|rockTall)$/.test(o.name))candidates.push(o);});
  const from=camera.position;const footY=target.y-1.3;
  const tmp=new THREE.Matrix4(),pt=new THREE.Vector3(),sc=new THREE.Vector3(),q=new THREE.Quaternion();
  // Sightlines to head, chest and knees so a canopy over the body also clears.
  const aims=[0,-.6,-1.05].map(dy=>target.clone().add(new THREE.Vector3(0,dy,0)));
  for(const aim of aims){const dir=aim.clone().sub(from);const len=dir.length();dir.normalize();ray.set(from,dir);ray.far=Math.max(0,len-.4);
   // Hidden props no longer intersect, so keep them hidden while their stored bounds still cross the sightline.
   for(const h of hidden.values()){const m=h.meshes[0];h.matrix.decompose(pt,q,sc);pt.applyMatrix4(m.matrixWorld);const r=1.4*Math.max(sc.x,sc.y,sc.z,1);
    const along=pt.clone().sub(from).dot(dir);if(along>0&&along<len&&ray.ray.distanceSqToPoint(pt)<r*r)h.seen=now;}
   for(const hit of ray.intersectObjects(candidates,false)){if(hit.instanceId===undefined)continue;const mesh=hit.object as THREE.InstancedMesh;const kenney=mesh.name.startsWith('kenney-');
    const key=(kenney?mesh.name:mesh.uuid)+'#'+hit.instanceId;const existing=hidden.get(key);if(existing){existing.seen=now;continue;}
    mesh.getMatrixAt(hit.instanceId,tmp);
    // Voxel blocks: never punch holes in the ground the resident stands on.
    if(!kenney){tmp.decompose(pt,q,sc);pt.applyMatrix4(mesh.matrixWorld);if(pt.y-sc.y/2<footY+.35)continue;}
    const siblings=kenney?candidates.filter(c=>c.name===mesh.name):[mesh];const matrix=tmp.clone();
    for(const sb of siblings){sb.setMatrixAt(hit.instanceId,zero);sb.instanceMatrix.needsUpdate=true;}
    hidden.set(key,{meshes:siblings,id:hit.instanceId,matrix,seen:now});}
  }
  // Restore props once they have been clear of the sightline for a moment.
  for(const [key,h]of hidden){if(now-h.seen>600){restore(h);hidden.delete(key);}}
 }
 return {update,reset:restoreAll,get count(){return hidden.size;}};
}
