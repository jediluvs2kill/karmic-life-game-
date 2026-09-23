import * as THREE from 'three';
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {footHeight,type createInhabitants} from './inhabitants.ts';
import {canStand,stepWalker,type Walker} from './resident-control.ts';
import {gsap} from 'gsap';
import {galleryTiles,galleryHeight,galleryEntrance,type IdeaGallery} from './idea-galleries.ts';

/** Session-only possession. Never writes life events, achievements or agent work. */
export function createIslandWalk(host:HTMLElement,camera:THREE.PerspectiveCamera,controls:OrbitControls,residents:ReturnType<typeof createInhabitants>,options:{tiles:()=>Set<string>;obstacles:()=>THREE.Object3D[];live:()=>boolean;reduced:boolean;galleries:()=>IdeaGallery[];visitGallery:(tower?:string,level?:number)=>void}){
 let walker:Walker|undefined,yaw=0,pitch=.32,distance=7,residentName='';
 let gallery:IdeaGallery|undefined,level=1,returnWalker:Walker|undefined,lift:{from:number;to:number;t:number}|undefined;
 let deckTiles=new Set<string>();
 let previous:{position:THREE.Vector3;target:THREE.Vector3}|undefined;
 let drag:{id:number;x:number;y:number}|undefined,jump=false;
 const keys=new Set<string>(),taps=new Set<string>(),look=new THREE.Vector3(),desired=new THREE.Vector3(),ray=new THREE.Raycaster();
 const shell=host.closest('.shell')!;
 const panel=document.createElement('section');panel.className='walk-hud';panel.setAttribute('aria-label','Control a resident');
 panel.innerHTML='<div class="walk-picker"><label><span class="sr-only">Choose a resident</span><select aria-label="Choose a resident"></select></label><button class="walk-toggle" aria-pressed="false">Walk the island</button></div><p class="walk-hint" hidden>WASD / arrows · Shift run · Space hop · Drag to look · Scroll zoom · Esc exit</p><div class="gallery-picker"><select aria-label="Choose an idea mall"></select><button class="gallery-enter">Visit idea mall</button></div><div class="gallery-controls" hidden><select aria-label="Choose a gallery floor"></select><button class="gallery-lift">Take lift</button><button class="gallery-exit">Return to island</button></div><output class="walk-status" aria-live="polite"></output>';
 shell.append(panel);
 const select=panel.querySelector<HTMLSelectElement>('.walk-picker select')!,toggle=panel.querySelector<HTMLButtonElement>('button')!,status=panel.querySelector('output')!,hint=panel.querySelector<HTMLElement>('.walk-hint')!;
 const towerSelect=panel.querySelector<HTMLSelectElement>('.gallery-picker select')!,floorSelect=panel.querySelector<HTMLSelectElement>('.gallery-controls select')!,enter=panel.querySelector<HTMLButtonElement>('.gallery-enter')!,liftButton=panel.querySelector<HTMLButtonElement>('.gallery-lift')!,floorControls=panel.querySelector<HTMLElement>('.gallery-controls')!;
 function leaveGallery(){
  if(!gallery)return;
  if(returnWalker)walker={...returnWalker};gallery=undefined;lift=undefined;returnWalker=undefined;clearInput();options.visitGallery();floorControls.hidden=true;panel.querySelector<HTMLElement>('.gallery-picker')!.hidden=false;
  status.textContent='Back on the island. Continue exploring.';host.focus({preventScroll:true});report();update(0);
 }
 function ride(levelNumber:number){
  if(!gallery||!walker||!gallery.floors.some(f=>f.level===levelNumber))return;
  const from=lift?lift.from+(lift.to-lift.from)*Math.min(1,lift.t):galleryHeight(gallery,level);
  level=levelNumber;const to=galleryHeight(gallery,level);lift=options.reduced?undefined:{from,to,t:0};
  const entry=galleryEntrance(gallery);walker={...walker,...entry,hop:0,hopVelocity:0,moving:false};clearInput();floorSelect.value=String(level);options.visitGallery(gallery.id,level);
  status.textContent=gallery.name+' · Floor '+level+' · '+gallery.floors.find(f=>f.level===level)!.name;host.focus({preventScroll:true});report();update(0);
 }
 function enterGallery(){
  const destination=options.galleries().find(t=>t.id===towerSelect.value);if(!destination)return;
  if(!walker&&!start())return;
  if(gallery)leaveGallery();returnWalker={...walker!};gallery=destination;deckTiles=galleryTiles(gallery);level=gallery.floors[0].level;
  floorSelect.replaceChildren(...gallery.floors.map(f=>new Option('Floor '+f.level+' · '+f.name,String(f.level))));
  floorControls.hidden=false;panel.querySelector<HTMLElement>('.gallery-picker')!.hidden=true;pitch=.45;distance=6;
  ride(level); // Quick travel to the gallery entrance; later buttons use its vertical lift.
 }
 enter.onclick=enterGallery;liftButton.onclick=()=>ride(Number(floorSelect.value));panel.querySelector<HTMLButtonElement>('.gallery-exit')!.onclick=leaveGallery;
 function clearInput(){keys.clear();taps.clear();jump=false;drag=undefined;}
 function report(){host.dataset.gallery=gallery?.id??'';host.dataset.galleryFloor=gallery?String(level):'';host.dataset.walkMode=walker?'resident':'overview';host.dataset.controlledResident=residents.controlledId??'';if(walker){host.dataset.walkX=walker.x.toFixed(3);host.dataset.walkZ=walker.z.toFixed(3);host.dataset.walkHeight=(gallery?galleryHeight(gallery,level)+walker.hop:footHeight(walker)+walker.hop).toFixed(3);}}
 function stop(restore=true){
  if(!walker)return;
  leaveGallery();residents.releaseControl();walker=undefined;clearInput();controls.enabled=true;
  if(restore&&previous){camera.position.copy(previous.position);controls.target.copy(previous.target);controls.update();}
  previous=undefined;select.disabled=false;toggle.textContent='Walk the island';toggle.setAttribute('aria-pressed','false');hint.hidden=true;status.textContent='Resident returned to their routine.';document.body.classList.remove('walking-island');report();
 }
 function start(id=select.value){
  if(!options.live()){status.textContent='Return to the latest saved day to walk with residents.';return false;}
  if(walker)stop();
  const pose=residents.takeControl(id);if(!pose){status.textContent='Residents are still arriving. Try again shortly.';return false;}
  // An autonomous route can hug cell edges; place the footprint at its nearest safe cell.
  if(!canStand(pose,options.tiles())){pose.x=Math.round(pose.x);pose.z=Math.round(pose.z);pose.y=footHeight(pose);}
  if(!canStand(pose,options.tiles())){residents.releaseControl();status.textContent='This resident needs more room. Choose another resident.';return false;}
  gsap.killTweensOf(camera.position);gsap.killTweensOf(controls.target);
  previous={position:camera.position.clone(),target:controls.target.clone()};
  // Flush any pending orbit damping before handing the camera to walking mode.
  const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;controls.enabled=false;
  yaw=Math.atan2(controls.target.x-camera.position.x,controls.target.z-camera.position.z);pitch=.32;distance=7;
  walker={x:pose.x,z:pose.z,yaw,gait:0,hop:0,hopVelocity:0,moving:false};
  residentName=residents.roster.find(r=>r.id===id)?.name??'Resident';select.value=id;select.disabled=true;toggle.textContent='Exit walk · Esc';toggle.setAttribute('aria-pressed','true');hint.hidden=false;status.textContent='You are '+residentName+'. Click the world to move.';document.body.classList.add('walking-island');host.focus({preventScroll:true});report();update(0);return true;
 }
 function refresh(){
  const id=select.value;select.replaceChildren(...residents.roster.map(r=>new Option(r.name+' · '+r.role,r.id)));if(residents.roster.some(r=>r.id===id))select.value=id;
  toggle.disabled=!options.live()||residents.count===0;enter.disabled=toggle.disabled||options.galleries().length===0;
  const towerId=towerSelect.value;towerSelect.replaceChildren(...options.galleries().map(t=>new Option(t.name,t.id)));if(options.galleries().some(t=>t.id===towerId))towerSelect.value=towerId;
  if(!options.live())status.textContent='Walking is available on the latest saved day.';
  else if(!walker)status.textContent='Choose a resident. Explore their world.';
 }
 toggle.onclick=()=>{if(walker)stop();else start();};
 host.addEventListener('keydown',e=>{
  if(!walker||e.target!==host)return;
  const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' '].includes(key)){e.preventDefault();keys.add(key);taps.add(key);if(key===' '&&!e.repeat)jump=true;}
 });
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&walker){e.preventDefault();if(gallery)leaveGallery();else stop();}});
 host.addEventListener('blur',clearInput);window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);
 host.addEventListener('pointerdown',e=>{if(!walker||!(e.target instanceof HTMLCanvasElement))return;host.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY};host.setPointerCapture(e.pointerId);e.preventDefault();});
 host.addEventListener('pointermove',e=>{if(!walker||!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.005;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.004,.08,1.15);drag.x=e.clientX;drag.y=e.clientY;});
 const endDrag=()=>{drag=undefined;};host.addEventListener('pointerup',endDrag);host.addEventListener('pointercancel',endDrag);host.addEventListener('lostpointercapture',endDrag);
 host.addEventListener('contextmenu',e=>{if(walker)e.preventDefault();});
 host.addEventListener('wheel',e=>{if(!walker)return;e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),2.8,14);},{passive:false});
 function update(dt:number){
  if(!walker)return;
  if(document.activeElement!==host)clearInput();
  const pressed=(key:string)=>keys.has(key)||taps.has(key);
  if(lift){lift.t=Math.min(1,lift.t+dt*.7);if(lift.t>=1)lift=undefined;}
  walker=stepWalker(walker,{forward:Number(pressed('w')||pressed('arrowup'))-Number(pressed('s')||pressed('arrowdown')),right:Number(pressed('d')||pressed('arrowright'))-Number(pressed('a')||pressed('arrowleft')),yaw,run:pressed('shift'),jump},lift?0:dt,gallery?deckTiles:options.tiles());jump=false;taps.clear();
  const ground=gallery?(lift?lift.from+(lift.to-lift.from)*(lift.t*lift.t*(3-2*lift.t)):galleryHeight(gallery,level)):footHeight(walker);
  residents.moveControlled({...walker,y:ground+walker.hop,gait:options.reduced?0:walker.moving?Math.sin(walker.gait):0,gesture:0});
  // Follow the ground, not the hop: no camera bounce, including reduced-motion mode.
  look.set(walker.x,ground+1.3,walker.z);
  desired.set(walker.x-Math.sin(yaw)*distance*Math.cos(pitch),look.y+Math.sin(pitch)*distance,walker.z-Math.cos(yaw)*distance*Math.cos(pitch));
  ray.set(look,desired.clone().sub(look).normalize());ray.far=look.distanceTo(desired);
  const hit=(gallery?[]:ray.intersectObjects(options.obstacles(),false))[0];
  if(hit){
   if(hit.distance>=3.5)desired.copy(look).addScaledVector(ray.ray.direction,hit.distance-.3);
   else{
    // Narrow streets need height, not a camera pushed inside the resident's head.
    // Project proxies are eight units tall and centered three above their ground.
    desired.copy(look).add(new THREE.Vector3(-Math.sin(yaw)*4,Math.max(7,hit.object.position.y+4.6-look.y),-Math.cos(yaw)*4));
   }
  }
  desired.y=Math.max(desired.y,(gallery?ground:footHeight({x:desired.x,z:desired.z}))+.6);
  camera.position.copy(desired);camera.lookAt(look);controls.target.copy(look);report();
 }
 report();return {start,stop,refresh,update,get active(){return !!walker;}};
}
