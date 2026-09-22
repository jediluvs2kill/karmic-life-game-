import type {LivingProject} from './projects';
import {progression} from './progression';
import './game-hud.css';

type HudOptions={
 projects:()=>LivingProject[]; selected:()=>string|undefined;
 visit:(id:string)=>void; overview:()=>void; upgrade:(id:string)=>void;
 rotate:(angle:number)=>void; topView:()=>void;
 settings:()=>void;
};
export function createGameHud(options:HudOptions){
 const shell=document.querySelector('.shell')!;
 const navigator=document.createElement('section');navigator.className='navigation-hud';navigator.setAttribute('aria-label','Invention navigator');
 navigator.innerHTML='<span class="hud-mode">EXPLORE</span><button data-prev aria-label="Previous invention">‹</button><label><span class="sr-only">Travel to an invention</span><select aria-label="Travel to an invention"><option value="">Choose any invention…</option></select></label><button data-next aria-label="Next invention">›</button><button data-focus title="Return to the selected invention" aria-label="Focus selected invention">◎</button>';
 shell.append(navigator);
 const cameraHud=document.createElement('section');cameraHud.className='camera-hud';cameraHud.setAttribute('aria-label','Camera navigation');
 cameraHud.innerHTML='<div class="camera-instruments"><button data-left aria-label="Orbit left">↶</button><div class="heading-dial"><b>▲</b><span>N</span></div><button data-right aria-label="Orbit right">↷</button><output class="camera-position">X 0 · Z 0</output><output class="camera-distance">Free camera</output><button data-top aria-label="Top down view">⊞</button><button data-hud aria-label="Hide game panels" aria-pressed="false">◫</button><button data-help aria-label="Camera controls and settings">?</button></div><p>DRAG <span>pan</span> · MIDDLE DRAG <span>orbit</span> · SCROLL <span>zoom at pointer</span> · WASD <span>move</span></p>';
 shell.append(cameraHud);
 const select=navigator.querySelector('select')!,focus=navigator.querySelector<HTMLButtonElement>('[data-focus]')!;
 const visit=(id:string)=>{if(id){options.visit(id);refresh();}};
 select.onchange=()=>visit(select.value);
 const step=(delta:number)=>{const projects=options.projects();if(!projects.length)return;const i=projects.findIndex(p=>p.id===options.selected());visit(projects[(i+delta+projects.length)%projects.length].id);};
 navigator.querySelector<HTMLButtonElement>('[data-prev]')!.onclick=()=>step(-1);
 navigator.querySelector<HTMLButtonElement>('[data-next]')!.onclick=()=>step(1);
 focus.onclick=()=>visit(options.selected()??select.value);
 cameraHud.querySelector<HTMLButtonElement>('[data-left]')!.onclick=()=>options.rotate(-Math.PI/6);
 cameraHud.querySelector<HTMLButtonElement>('[data-right]')!.onclick=()=>options.rotate(Math.PI/6);
 cameraHud.querySelector<HTMLButtonElement>('[data-top]')!.onclick=options.topView;
 cameraHud.querySelector<HTMLButtonElement>('[data-help]')!.onclick=options.settings;
 const hide=cameraHud.querySelector<HTMLButtonElement>('[data-hud]')!;
 hide.onclick=()=>{const hidden=document.body.classList.toggle('hud-minimal');hide.setAttribute('aria-pressed',String(hidden));hide.setAttribute('aria-label',hidden?'Show game panels':'Hide game panels');};
 const nav=document.querySelector('.archive-rail nav')!;
 for(const [title,symbol,handler]of [
  ['Map','◇',options.overview],
  ['Upgrade','⇧',()=>{const id=options.selected();if(id)options.upgrade(id);else{select.focus();select.showPicker?.();}}],
  ['Settings','⚙',options.settings]
 ] as const){const button=document.createElement('button');button.innerHTML=symbol+' <span>'+title+'</span>';button.setAttribute('aria-label',title);button.onclick=handler;nav.append(button);}
 let lastCatalogue='';
 function refresh(){const projects=options.projects(),catalogue=projects.map(p=>p.id+':'+progression(p.events).level).join('|');
  if(catalogue!==lastCatalogue){lastCatalogue=catalogue;select.replaceChildren(new Option('Choose any invention…',''),...projects.map(p=>new Option(p.name+' · L'+progression(p.events).level,p.id)));}
  select.value=options.selected()??'';focus.disabled=!select.value;
 }
 document.getElementById('world')!.addEventListener('world-camera',e=>{const {x,z,distance,heading}=(e as CustomEvent).detail;cameraHud.querySelector('.camera-position')!.textContent='X '+Math.round(x)+' · Z '+Math.round(z);cameraHud.querySelector('.camera-distance')!.textContent=distance.toFixed(1)+' distance';cameraHud.querySelector<HTMLElement>('.heading-dial b')!.style.transform=`rotate(${-heading}deg)`;cameraHud.querySelector('.heading-dial span')!.textContent=Math.round(heading)+'°';});
 refresh();return {refresh};
}
