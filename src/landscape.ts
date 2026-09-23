import {projectPosition,projectApproach,type LivingProject} from './projects.ts';
import {landmarks,groundHeight} from './civilization.ts';
import {isCivilizationLand} from './island-shape.ts';
import {isGanga,mountainHeight,gangaRoute,gangaBridges} from './geography.ts';
type Cube=(x:number,y:number,z:number,w:number,h:number,d:number,c:string,rotation?:number)=>void;
type Decor=(name:'rock'|'pine'|'birch'|'oak'|'flowers'|'bush'|'ship'|'rockTall',x:number,y:number,z:number,size:number|[number,number,number],rotation?:number)=>boolean;
const noise=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
export function buildLandscape(projects:LivingProject[],cube:Cube,decor:Decor){
 const cells=new Set<string>(),roads=new Set<string>(),walkable=new Set<string>(),key=(x:number,z:number)=>`${Math.round(x)},${Math.round(z)}`;
 const road=(ax:number,az:number,bx:number,bz:number)=>{const steps=Math.max(1,Math.ceil(Math.hypot(ax-bx,az-bz)*1.5));for(let i=0;i<=steps;i++){const t=i/steps,x=ax+(bx-ax)*t,z=az+(bz-az)*t;roads.add(key(x,z));roads.add(key(x+1,z));roads.add(key(x,z+1));}};
 // The coastline is immutable. New ideas grow vertically, never by adding terrain.
 for(let x=-47;x<=49;x++)for(let z=-46;z<=77;z++)if(isCivilizationLand(x,z))cells.add(key(x,z));
 const points=projects.map(p=>({...projectPosition(p),id:p.id}));
 const buildings=new Set<string>();
 for(const p of projects){const pos=projectPosition(p),scale=landmarks[p.id]?.scale??1;for(let x=Math.floor(pos.x-2.25*scale);x<=Math.ceil(pos.x+2.25*scale);x++)for(let z=Math.floor(pos.z-1.9*scale);z<=Math.ceil(pos.z+1.9*scale);z++)if(Math.abs(x-pos.x)<2.25*scale&&Math.abs(z-pos.z)<1.9*scale)buildings.add(key(x,z));}
 const buildingAt=(x:number,z:number)=>buildings.has(key(x,z));
 const nearestOpen=(point:{x:number;z:number})=>{let best:{x:number;z:number}|undefined,distance=Infinity;for(const cell of cells){const [x,z]=cell.split(',').map(Number),d=(point.x-x)**2+(point.z-z)**2;if(!buildingAt(x,z)&&mountainHeight(x,z)<1&&(!isGanga(x,z)||gangaBridges.has(key(x,z)))&&d<distance){distance=d;best={x,z};}}return best;};
 const safeRoad=(from:{x:number;z:number},to:{x:number;z:number})=>{const start=nearestOpen(from),finish=nearestOpen(to);if(!start||!finish)return;const queue=[start],parents=new Map<string,{x:number;z:number}|null>([[key(start.x,start.z),null]]);for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p.x,p.z)===key(finish.x,finish.z))break;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,k=key(x,z);if(cells.has(k)&&!buildingAt(x,z)&&mountainHeight(x,z)<1&&(!isGanga(x,z)||gangaBridges.has(k))&&!parents.has(k)){parents.set(k,p);queue.push({x,z});}}}if(!parents.has(key(finish.x,finish.z)))return;for(let p:{x:number;z:number}|null=finish;p;p=parents.get(key(p.x,p.z))??null){roads.add(key(p.x,p.z));for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]])if(cells.has(key(p.x+dx,p.z+dz))&&!buildingAt(p.x+dx,p.z+dz)&&mountainHeight(p.x+dx,p.z+dz)<1)roads.add(key(p.x+dx,p.z+dz));}};
 const links=[['windpanel','webroker'],['webroker','agent-swarm'],['agent-swarm','guru-engine'],['guru-engine','religion-earths'],['religion-earths','solar-sales'],['agent-swarm','karmic-life'],['karmic-life','solar-sales'],['webroker','creatine'],['creatine','bio-bottle'],['bio-bottle','gravity-rail'],['bio-bottle','run-dna'],['run-dna','robotics-core'],['robotics-core','cooling-stack'],['cooling-stack','ministers'],['ministers','rudraksha'],['rudraksha','karmic-life'],['gravity-rail','run-dna']];
 for(const [a,b]of links){const p=landmarks[a],q=landmarks[b];road(p.x,p.z,q.x,q.z);}
 // The central promenade crosses the river in front of Agent Command.
 road(-8,1,11,1);
 // Every relocated building opens onto the shared civic promenade. These
 // approach paths keep dense neighborhoods connected without crossing models.
 for(const p of projects)safeRoad(projectApproach(p),{x:2,z:7});
 for(const k of cells){const [x,z]=k.split(',').map(Number),h=groundHeight(x,z),edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>!cells.has(key(x+dx,z+dz))),r=noise(x,z),near=points.some(p=>Math.hypot(x-p.x,z-p.z)<(landmarks[p.id]?5.6:3.2));
  const water=isGanga(x,z),mountain=mountainHeight(x,z)>1,route=(roads.has(k)||gangaBridges.has(k))&&!mountain&&(!water||gangaBridges.has(k));
  cube(x,h-.4,z,1.03,.8,1.03,r>.6?'#659448':'#5c8d43');
  if(edge){cube(x,h-1.15,z,1.03,.7,1.03,'#c6a071');cube(x,(h-7)/2,z,.98,h+4.7,.98,r>.5?'#8d8069':'#66736b');cube(x,-5.65,z,1.5,.09,1.5,'#62bbc3');if(r>.82)decor('rock',x,-4.8,z,[1.4,2.3,1.4],r*6);}
  if(water){cube(x,h+.025,z,1.04,.08,1.04,r>.8?'#9ee8df':'#249fba');if(route){cube(x,h+.2,z,1.1,.2,1.1,'#b48e59');}}
  else if(route){cube(x,h+.03,z,1,.07,1,'#d3b886');if(r>.72)cube(x+.2,h+.085,z+.1,.27,.045,.18,'#f4dbac');}
  const tree=!near&&!water&&!route&&!mountain&&r>.90;
  if(!near&&!water&&!route&&!mountain){if(tree)decor(z<0?'pine':r>.96?'birch':'oak',x,h,z,2.3+noise(z,x)*2,r*6.28);else if(r>.85)decor(r>.88?'flowers':'bush',x,h,z,r>.88?.55:.95,r*6.28);}
  const building=buildingAt(x,z);
  if(!building&&!tree&&!mountain&&(!water||route))walkable.add(k);
 }
 // Falls follow the river down the face of the central cliffs.
 for(const {x,z} of gangaRoute.slice(-1))for(let j=0;j<7;j++){cube(x+j*.23,-2.5,z,.17,6.3,.23,j%2?'#93e4e4':'#2bb6d0');cube(x+j*.4-.5,-5.6,z+.6,.5,.1,.5,'#b4efea');}
 // A cableway ties the two front neighborhoods together, with suspended cargo.
 for(const x of [-27,-18,-9]){cube(x,2,30,.22,4,.22,'#d2bc8d');cube(x,4.1,30,1.4,.16,.23,'#ebbc56');}
 cube(-18,4.3,30,19,.065,.08,'#324b59');
 for(const x of [-24,-16,-11]){cube(x,3.8,30,.06,1,.06,'#344d5a');cube(x,3.15,30,.95,.75,.85,'#e4ae4b');cube(x,3.2,30.44,.65,.32,.04,'#7de1ed');}
 for(let j=0;j<6;j++){cube(0,-.1,36+j,3,.22,.85,'#ab7c47');for(const x of [-1.3,1.3])cube(x,-2.8,36+j,.18,5.8,.18,'#785434');}
 decor('ship',7,-5.8,43,7,-.4);
 return walkable;
}
