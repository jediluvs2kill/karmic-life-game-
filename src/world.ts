import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {worldAt, type Save, type ZoneId} from './state';
import {walkGrid} from './navigation';
import {createScenery} from './scenery';
import {createAtmosphere,createOcean} from './atmosphere';
import {gsap} from 'gsap';
import {progression} from './progression';
import {architecture} from './architecture';
import {blockGeometry} from './asset-geometry';
import {landmarks,groundHeight} from './civilization';
import {buildLandscape} from './landscape';
import {createProjectAssets} from './project-assets';
import {ideaLabel} from './idea-labels';
import {createInhabitants} from './inhabitants';
import {createAnimeAnimals} from './anime-animals';
import {createWeatherPockets} from './weather-pockets';
import {projectsAt,projectPosition,type LivingProject} from './projects';

export function createWorld(host:HTMLElement,onSelect:(id:ZoneId)=>void,onProject:(id:string)=>void){
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,1,.1,4000);camera.position.set(40,37,48);
 const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(1);renderer.setSize(host.clientWidth,host.clientHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
 renderer.info.autoReset=false;
 // Broad shadow maps made the voxel terrain self-shadow and obscured the inventions.
 // Form comes from directional lighting; a faint contact wash grounds each asset.
 renderer.shadowMap.enabled=false;
 renderer.domElement.setAttribute('aria-label','Interactive 3D island. Hold the middle mouse button and drag to rotate, scroll to zoom, or click a district to visit.');
 host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,1);controls.enableDamping=true;controls.minDistance=12;controls.maxDistance=2200;controls.maxPolarAngle=Math.PI*.47;controls.minPolarAngle=.22;
 controls.mouseButtons.MIDDLE=THREE.MOUSE.ROTATE;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const projectAssets=createProjectAssets(()=>{host.dataset.ideaAssetsLoaded=String(projectAssets.loaded);host.dispatchEvent(new CustomEvent('world-project-assets-ready'));});
 // Other agents can replace a GLB without adding a timeline event.
 setInterval(()=>{if(!document.hidden)void projectAssets.load();},15000);
 const scenery=createScenery();const atmosphere=createAtmosphere(renderer,scene,camera);
 const residents=createInhabitants(scene,{reducedMotion:reduced});
 const animals=createAnimeAnimals(scene,{reducedMotion:reduced});
 const pocketWeather=createWeatherPockets(scene,{reducedMotion:reduced});
 controls.addEventListener('start',()=>{gsap.killTweensOf(camera.position);gsap.killTweensOf(controls.target);});
 const ambient=new THREE.HemisphereLight('#d5eeff','#e5d8be',1.75);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#fff0d7',2.2);sun.position.set(-30,50,35);scene.add(sun);
 const fill=new THREE.DirectionalLight('#bfd8ff',.65);fill.position.set(40,25,-25);scene.add(fill);
 const ocean=createOcean();scene.add(ocean.mesh);
 let geometry=new THREE.Group();scene.add(geometry);
 const boxGeometry=new THREE.BoxGeometry(1,1,1);
 type Block={x:number;y:number;z:number;w:number;h:number;d:number;rotation:number};
 let batches=new Map<string,Block[]>();let proxies:THREE.Object3D[]=[];
 let contacts:{x:number;y:number;z:number;w:number;d:number}[]=[];
 const starsGeometry=new THREE.BufferGeometry();const starsVertices=[];for(let i=0;i<260;i++){const a=i*2.39996;const r=70+(i%7)*8;starsVertices.push(Math.sin(a)*r,28+(i%17)*3,Math.cos(a)*r);}starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starsVertices,3));const stars=new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:'#e9e2bd',size:.2,transparent:true,opacity:.7}));scene.add(stars);
 let walkable=new Set<string>();let selected:ZoneId|undefined;let records:ReturnType<typeof worldAt>=[];let liveView=true;
 const labels=document.createElement('div');labels.className='map-labels';host.append(labels);
 const agentLabels=document.createElement('div');agentLabels.className='agent-labels';host.append(agentLabels);
 type AgentView={id:string;name:string;role:string;color:string;status:string;zone:ZoneId;message:string};
 const inhabitants=new Map<string,{group:THREE.Group;label:HTMLDivElement;path:{x:number;z:number}[];zone:ZoneId;data:AgentView;idleWait?:number;patrolIndex?:number}>();
 function setAgents(agents:AgentView[]){for(const a of agents){let actor=inhabitants.get(a.id);if(!actor){const group=new THREE.Group();for(const [y,w,h,d,color]of [[.3,.42,.5,.3,'#395360'],[.87,.6,.65,.4,a.color],[1.4,.5,.5,.5,'#e9bd93'],[1.69,.56,.15,.56,'#4a4e4f']] as [number,number,number,number,string][]){const part=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));part.position.y=y;group.add(part);}group.position.set(-4+inhabitants.size*2,.4,1);scene.add(group);const label=document.createElement('div');label.className='agent-bubble';agentLabels.append(label);actor={group,label,path:[],zone:'agents',data:a};inhabitants.set(a.id,actor);}actor.data=a;const project=projects.find(p=>p.zone===a.zone&&landmarks[p.id])??projects.find(p=>p.zone===a.zone);const destination=project?projectPosition(project):records.find(r=>r.id===a.zone&&r.level);if(destination&&actor.zone!==a.zone){actor.path=walkGrid(actor.group.position,{x:destination.x,z:destination.z+6},walkable);if(actor.path.length)actor.zone=a.zone;}
  actor.label.replaceChildren();const name=document.createElement('strong');name.textContent=a.name+' · '+a.role;const msg=document.createElement('span');msg.textContent=a.status==='thinking'?'Thinking…':a.status==='completed'?a.message.slice(0,100):'Ready for an idea';actor.label.append(name,msg);actor.label.dataset.status=a.status;
 }}
 let labelItems:{el:HTMLButtonElement;pos:THREE.Vector3;project?:LivingProject}[]=[];
 let projects:LivingProject[]=[];let selectedProject:string|undefined;
 function pavilion(p:LivingProject){
  const zone=records.find(r=>r.id===p.zone)!,{x,y,z}=projectPosition(p),growth=progression(p.events),landmark=landmarks[p.id],scale=landmark?.scale??1,c=zone.color;
  const lift=(growth.level-1)*.15;
  cube(x,y+lift/2-.09,z,5.2*scale,.18+lift,4.5*scale,'#c8b584');
  contacts.push({x,y:y+lift+.008,z,w:5.1*scale,d:4.4*scale});
  if(!projectAssets.place(p.id,geometry,x,y+lift,z,scale))for(const b of architecture(p)){const mesh=new THREE.Mesh(blockGeometry(b),new THREE.MeshStandardMaterial({color:b.color,roughness:.8}));mesh.position.set(x+b.x*scale,y+lift+b.y*scale,z+b.z*scale);mesh.scale.setScalar(scale);geometry.add(mesh);}
  // Work grows a campus around its recognizable core, keeping the original silhouette.
  for(let i=1;i<growth.level;i++){const ax=x-2.35*scale+(i-1)*.9*scale;cube(ax,y+.2,z+2.05*scale,.6*scale,.22,.3*scale,'#62d3b1');}
  if(growth.level>=2){cube(x-2.4*scale,y+.65,z-1.4*scale,.55*scale,1.1,.5*scale,'#345570');cube(x-2.4*scale,y+1.25,z-1.4*scale,.7*scale,.12,.7*scale,'#84dcde');}
  if(growth.level>=3){cube(x+2.4*scale,y+.65,z-1.2*scale,1.2*scale,1.3,1.4*scale,c);cube(x+2.4*scale,y+1.36,z-1.2*scale,1.4*scale,.16,1.6*scale,'#41677c');for(const dx of [-.3,.3])cube(x+(2.4+dx)*scale,y+.8,z-.48*scale,.25*scale,.5,.06,'#ffe2a1');}
  if(growth.level>=4){cube(x-2.25*scale,y+1.7,z+1.7*scale,.15,3.4,.15,'#edce8a');cube(x-1.95*scale,y+3.15,z+1.7*scale,.7,.5,.08,'#6bd4d5');}
  if(growth.level>=5){cube(x+2.4*scale,y+2,z-1.2*scale,.4,1.4,.4,'#70c9e1');cube(x+2.4*scale,y+2.8,z-1.2*scale,.6,.2,.6,'#ffe4a5');}
  if(growth.level>=6)for(const dx of [-2.3,2.3]){cube(x+dx*scale,y+1.5,z+2*scale,.18,3,.18,'#edbd58');cube(x+(dx+.3)*scale,y+2.7,z+2*scale,.7,.55,.08,'#edbd58');}
  scenery.place('flowers',x-2.5*scale,y,z+1.6*scale,scale*.6);
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(5*scale,8,4.3*scale),new THREE.MeshBasicMaterial({visible:false}));proxy.position.set(x,y+3,z);proxy.userData.project=p.id;geometry.add(proxy);proxies.push(proxy);
  const el=document.createElement('button');el.className='district-label invention-label'+(landmark?' landmark-label':'');const title=document.createElement('strong');const identity=ideaLabel(p);title.textContent=identity.name;const subtitle=document.createElement('small');subtitle.textContent=identity.subtitle;el.title=p.name+' · '+identity.subtitle;el.append(title,subtitle);el.setAttribute('aria-label','Visit project '+p.name);el.onclick=()=>onProject(p.id);labels.append(el);labelItems.push({el,pos:new THREE.Vector3(x,y+.8,z+2.9*scale),project:p});
 }
 const cube=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,rotation=0)=>{if(!batches.has(color))batches.set(color,[]);batches.get(color)!.push({x,y,z,w,h,d,rotation});};
 function resetGeometry(){scene.remove(geometry);geometry.traverse(o=>{if(o instanceof THREE.Mesh){if(!o.userData.sharedAsset){if(o.geometry!==boxGeometry)o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}if(o instanceof THREE.InstancedMesh)o.dispose();}});geometry=new THREE.Group();scene.add(geometry);scenery.reset();batches=new Map();proxies=[];contacts=[];labels.replaceChildren();labelItems=[];}
 function rebuild(save:Save,date:string){
  resetGeometry();records=worldAt(save,date);projects=projectsAt(save,date);host.dataset.projectCount=String(projects.length);liveView=date===save.events.reduce((latest,event)=>event.date>latest?event.date:latest,'');
  walkable=buildLandscape(projects,cube,scenery.place);
  residents.rebuild(projects,walkable);host.dataset.residentCount=String(residents.count);
  animals.rebuild(projects,walkable);host.dataset.animalCount=String(animals.count);host.dataset.weatherPocketCount=String(pocketWeather.count);
  // District addresses remain stable; each invention is now the visible landmark.
  projects.forEach(pavilion);void projectAssets.load();
  const matrix=new THREE.Matrix4();const quaternion=new THREE.Quaternion();const position=new THREE.Vector3();const scale=new THREE.Vector3();
  for(const [color,blocks]of batches){const mesh=new THREE.InstancedMesh(boxGeometry,new THREE.MeshStandardMaterial({color,roughness:1,...(color==='#ffe2a1'||color==='#ffe4a5'?{emissive:color,emissiveIntensity:1.35}:{})}),blocks.length);blocks.forEach((b,i)=>{position.set(b.x,b.y,b.z);scale.set(b.w,b.h,b.d);quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),b.rotation);matrix.compose(position,quaternion,scale);mesh.setMatrixAt(i,matrix);});geometry.add(mesh);}
  // One instanced, softly faded patch per project. It never shadows neighboring terrain.
  if(contacts.length){
   const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
    vertexShader:`varying vec2 contactUv;void main(){contactUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 contactUv;void main(){float fade=1.-smoothstep(.12,.5,length(contactUv-.5));gl_FragColor=vec4(.16,.20,.22,fade*.13);}`});
   const patches=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),material,contacts.length);patches.name='soft-project-grounding';
   const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
   contacts.forEach((c,i)=>{matrix.compose(new THREE.Vector3(c.x,c.y,c.z),rotation,new THREE.Vector3(c.w,c.d,1));patches.setMatrixAt(i,matrix);});
   patches.computeBoundingSphere();geometry.add(patches);
  }
  scenery.flush(geometry);setNight(save.night);
 }
 const marker=new THREE.Mesh(new THREE.RingGeometry(3.7,3.82,48),new THREE.MeshBasicMaterial({color:'#fff0bb',side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.65;marker.visible=false;scene.add(marker);
 const avatar=new THREE.Group();const avatarMaterial=new THREE.MeshStandardMaterial({color:'#f5c08f'});const head=new THREE.Mesh(new THREE.BoxGeometry(.45,.45,.45),avatarMaterial);head.position.y=1.35;avatar.add(head);const body=new THREE.Mesh(new THREE.BoxGeometry(.5,.65,.32),new THREE.MeshStandardMaterial({color:'#efcc67'}));body.position.y=.83;avatar.add(body);for(const dx of [-.14,.14]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,.45,.2),new THREE.MeshStandardMaterial({color:'#3a5563'}));leg.position.set(dx,.35,0);avatar.add(leg);}avatar.position.set(0,.35,8);scene.add(avatar);
 let target:THREE.Vector3|undefined;const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let down={x:0,y:0};
 renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===0)down={x:e.clientX,y:e.clientY};});
 renderer.domElement.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
 renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(proxies)[0];if(hit){if(hit.object.userData.project)onProject(hit.object.userData.project);else{selectedProject=undefined;focus(hit.object.userData.zone);onSelect(hit.object.userData.zone);}}});
 function focusProject(id:string){const p=projects.find(p=>p.id===id);if(!p)return;selected=p.zone;selectedProject=id;const pos=projectPosition(p,records.find(r=>r.id===p.zone)!);pos.y+=2;marker.visible=false;const mobile=matchMedia('(max-width:700px)').matches,dx=mobile?0:4,dz=mobile?0:-2,dy=mobile?-3:0;const zoom=landmarks[id]?1.6:1;const duration=reduced?0:1;gsap.to(controls.target,{x:pos.x+dx,y:pos.y+dy,z:pos.z+dz,duration,overwrite:true});gsap.to(camera.position,{x:pos.x+10*zoom+dx,y:pos.y+12*zoom+dy,z:pos.z+17*zoom+dz,duration,overwrite:true});}
 function focus(id:ZoneId){selectedProject=undefined;const changed=selected!==id;selected=id;const r=records.find(z=>z.id===id);if(!r)return;marker.visible=!!r.level;marker.position.set(r.x,.65,r.z);target=new THREE.Vector3(r.x,.35,r.z+3.5);labelItems.forEach(l=>l.el.classList.toggle('selected',l.el.textContent===r.name));if(changed&&r.level){const duration=reduced?0:1.2;gsap.to(controls.target,{x:r.x+2,y:1,z:r.z,duration,ease:'power2.inOut',overwrite:true});gsap.to(camera.position,{x:r.x+15,y:24,z:r.z+30,duration,ease:'power2.inOut',overwrite:true});}}
 function archipelago(){const radius=Math.max(55,...projects.map(p=>{const v=projectPosition(p);return Math.hypot(v.x,v.z)+8;}));gsap.killTweensOf(camera.position);gsap.killTweensOf(controls.target);const fit=1.1*Math.max(1,host.clientHeight/host.clientWidth);camera.far=Math.max(4000,radius*8);camera.updateProjectionMatrix();controls.maxDistance=Math.max(2200,radius*5);camera.position.set(radius*.5*fit,radius*2.4*fit,radius*3.1*fit);controls.target.set(0,0,0);selected=undefined;selectedProject=undefined;marker.visible=false;controls.update();}
 function home(){gsap.killTweensOf(camera.position);gsap.killTweensOf(controls.target);const aspect=host.clientWidth/host.clientHeight;const fit=.97*Math.max(1,(host.clientWidth<700?.84:1.35)/aspect);camera.position.set(12*fit,69*fit,90*fit);controls.target.set(1,0,3);selected=undefined;selectedProject=undefined;marker.visible=false;controls.update();}
 function setNight(night:boolean){scene.background=new THREE.Color(night?'#07192c':'#65bbdf');scene.fog=new THREE.Fog(night?'#07192c':'#65bbdf',110,250);ambient.intensity=night?.85:1.75;sun.intensity=night?.75:2.2;fill.intensity=night?.3:.65;stars.visible=night;ocean.setNight(night);atmosphere.night(night);}
 let running=true;let last=performance.now();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;host.dispatchEvent(new CustomEvent('world-error',{detail:'Graphics paused. Reload to restore your island; your save is safe.'}));});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{running=true;});
 const projected=new THREE.Vector3();
 let sampleStart=performance.now(),sampleFrames=0;
 function frame(now:number){requestAnimationFrame(frame);if(!running||document.hidden||now-last<32)return;const dt=Math.min((now-last)/1000,.05);last=now;controls.update();
  renderer.info.reset();
  if(!reduced)ocean.update(now*.001);
  residents.update(now*.001,dt,liveView);
  animals.update(now*.001,liveView);
  pocketWeather.update(now*.001,liveView);
  if(target){const distance=avatar.position.distanceTo(target);if(distance>.15){avatar.position.lerp(target,Math.min(1,dt*1.4));avatar.rotation.y=Math.atan2(target.x-avatar.position.x,target.z-avatar.position.z);if(!reduced)avatar.position.y=.35+Math.abs(Math.sin(now*.009))*.08;}else target=undefined;}
  for(const actor of inhabitants.values()){
   actor.group.visible=liveView;if(!liveView){actor.label.hidden=true;continue;}
   if(actor.data.status==='idle'&&!actor.path.length&&records.some(r=>r.id==='agents'&&r.level)){actor.idleWait=(actor.idleWait??inhabitants.size)+dt;if(actor.idleWait>7){const stops=[{x:-6,z:1},{x:6,z:1},{x:6,z:-10},{x:-6,z:-10}];actor.patrolIndex=((actor.patrolIndex??[...inhabitants.keys()].indexOf(actor.data.id))+1)%stops.length;actor.path=walkGrid(actor.group.position,stops[actor.patrolIndex],walkable);actor.idleWait=0;}}
   const next=actor.path[0];if(next){const dx=next.x-actor.group.position.x,dz=next.z-actor.group.position.z,dist=Math.hypot(dx,dz);if(dist<.08)actor.path.shift();else{const step=Math.min(dist,dt*2.2);actor.group.position.x+=dx/dist*step;actor.group.position.z+=dz/dist*step;actor.group.rotation.y=Math.atan2(dx,dz);actor.group.position.y=groundHeight(actor.group.position.x,actor.group.position.z)+.15+(reduced?0:Math.abs(Math.sin(now*.011))*.07);}}
   projected.copy(actor.group.position).add(new THREE.Vector3(0,2.2,0)).project(camera);actor.label.style.left=`${(projected.x*.5+.5)*host.clientWidth}px`;actor.label.style.top=`${(-projected.y*.5+.5)*host.clientHeight}px`;actor.label.hidden=projected.z>1||(actor.data.status==='idle'&&!actor.path.length);actor.label.classList.toggle('walking',!!actor.path.length);
  }
  const distance=camera.position.distanceTo(controls.target);if(scene.fog instanceof THREE.Fog){scene.fog.near=distance+100;scene.fog.far=distance+350;}
  const occupied:{x:number;y:number;w:number;h:number}[]=[];
  const hostRect=host.getBoundingClientRect();
  const panels=Array.from(document.querySelectorAll<HTMLElement>('.topbar,.quest-panel,.activity-panel,.mini-map,.archive-rail,.side-tools,.district-panel,.browse-panel,.bottom-area,.stage-heading'))
   .map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height)
   .map(r=>({left:r.left-hostRect.left,right:r.right-hostRect.left,top:r.top-hostRect.top,bottom:r.bottom-hostRect.top}));
  const sorted=[...labelItems].sort((a,b)=>Number(b.project?.id===selectedProject)-Number(a.project?.id===selectedProject));
  for(const {el,pos,project}of sorted){projected.copy(pos).project(camera);const lx=(projected.x*.5+.5)*host.clientWidth,ly=(-projected.y*.5+.5)*host.clientHeight;el.style.left=lx+'px';el.style.top=ly+'px';
   const chosen=project?.id===selectedProject;
   const identity=project?ideaLabel(project):undefined;const w=166,h=37+((identity?.name.length??0)>28?11:0)+((identity?.subtitle.length??0)>38?9:0),centerY=ly-h/2;
   let hide=projected.z>1||lx<w/2+8||lx>host.clientWidth-w/2-8||ly-h<82||ly>host.clientHeight-72||!!(selectedProject&&!chosen);
   if(!hide&&panels.some(r=>lx+w/2>r.left&&lx-w/2<r.right&&centerY+h/2>r.top&&centerY-h/2<r.bottom))hide=true;
   if(!hide&&!chosen&&occupied.some(o=>Math.abs(lx-o.x)<(w+o.w)/2&&Math.abs(centerY-o.y)<(h+o.h)/2))hide=true;
   el.hidden=hide;if(!hide)occupied.push({x:lx,y:centerY,w,h});el.classList.toggle('selected-project',chosen);
  }
  atmosphere.render(dt);
  sampleFrames++;if(now-sampleStart>=1200){host.dataset.renderFps=String(Math.round(sampleFrames*1000/(now-sampleStart)));host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);sampleStart=now;sampleFrames=0;}
 }
 new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);atmosphere.resize(w,h);camera.aspect=w/h;camera.clearViewOffset();home();camera.updateProjectionMatrix();}).observe(host);
 requestAnimationFrame(frame);
 function snapshot(save:Save,date:string){const position=camera.position.clone(),look=controls.target.clone(),aspect=camera.aspect;rebuild(save,date);camera.aspect=16/9;camera.position.set(12,69,90);controls.target.set(1,0,3);camera.updateProjectionMatrix();controls.update();renderer.setSize(240,135,false);atmosphere.resize(240,135);avatar.visible=false;residents.update(0,0,false);animals.update(0,false);pocketWeather.update(0,false);const oldMarker=marker.visible;marker.visible=false;for(const a of inhabitants.values())a.group.visible=false;atmosphere.render(0);const url=renderer.domElement.toDataURL('image/webp',.75);renderer.setSize(host.clientWidth,host.clientHeight);atmosphere.resize(host.clientWidth,host.clientHeight);camera.aspect=aspect;camera.updateProjectionMatrix();avatar.visible=true;marker.visible=oldMarker;for(const a of inhabitants.values())a.group.visible=true;animals.update(performance.now()*.001,liveView);pocketWeather.update(performance.now()*.001,liveView);camera.position.copy(position);controls.target.copy(look);controls.update();return url;}
 void scenery.load().then(result=>{host.dataset.assetsLoaded=String(result.loaded);host.dataset.assetStatus=result.failed?'partial':'ready';host.dispatchEvent(new CustomEvent('world-assets-ready',{detail:result}));});
 return {rebuild,home,archipelago,get residentCount(){return liveView?residents.count:0;},get animalCount(){return liveView?animals.count:0;},get weatherPocketCount(){return liveView?pocketWeather.count:0;},focus,focusProject,clearFocus:()=>{selected=undefined;selectedProject=undefined;marker.visible=false;},setNight,setAgents,snapshot,toggleEffects:()=>{atmosphere.setEnabled(!atmosphere.enabled);return atmosphere.enabled;},zoom:(amount:number)=>{const offset=camera.position.clone().sub(controls.target).multiplyScalar(amount);offset.clampLength(12,2200);const p=controls.target.clone().add(offset);gsap.to(camera.position,{x:p.x,y:p.y,z:p.z,duration:reduced?0:.5,ease:'power2.out',overwrite:true});},toggleLabels:()=>labels.classList.toggle('labels-hidden')};
}
