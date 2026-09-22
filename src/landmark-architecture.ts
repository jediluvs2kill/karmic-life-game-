import type {AssetBlock} from './architecture.ts';

/** Original low-poly models, built for the user's invention map; not evidence of a physical build. */
export function landmarkArchitecture(id:string):AssetBlock[]|undefined{
 const a:AssetBlock[]=[],gold='#edbd58',stone='#ecdfbc',ink='#24445f',glass='#5ad5ee',blue='#2587c1',green='#55a766',white='#e5f3e9';
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,shape:AssetBlock['shape']='box',rotation?:[number,number,number])=>a.push({x,y,z,w,h,d,color,shape,rotation});
 const cyl=(x:number,y:number,z:number,r:number,h:number,c:string)=>b(x,y,z,r*2,h,r*2,c,'cylinder');
 const orb=(x:number,y:number,z:number,r:number,c:string)=>b(x,y,z,r*2,r*2,r*2,c,'sphere');
 const ring=(x:number,y:number,z:number,r:number,c:string,horizontal=false)=>b(x,y,z,r*2,r*2,r*2,c,'torus',horizontal?[Math.PI/2,0,0]:undefined);
 const base=(c=stone)=>{b(0,.12,0,5,.24,4.3,c);b(0,.28,0,4.65,.12,4,ink);};
 const house=(x:number,z:number,h=1.3,c=stone)=>{b(x,.4+h/2,z,1.2,h,1.2,c);b(x,h+.45,z,1.4,.16,1.4,gold);for(const dx of [-.32,.32])b(x+dx,h*.6+.3,z+.615,.25,.36,.035,glass);};
 const screen=(x:number,y:number,z:number,w:number,h:number)=>{b(x,y,z,w,h,.16,ink);b(x,y,z+.1,w*.85,h*.72,.04,glass);};
 const bottle=(x:number,z:number,h:number,c:string)=>{cyl(x,h*.43+.4,z,.43,h*.86,c);cyl(x,h*.93+.4,z,.23,h*.15,white);cyl(x,h*1.03+.4,z,.25,.15,blue);cyl(x,h*.48+.4,z,.442,h*.25,stone);};
 const earth=(x:number,y:number,z:number,r:number)=>{orb(x,y,z,r,blue);for(let i=0;i<8;i++){const v=i*2.4;orb(x+Math.sin(v)*r*.76,y+Math.cos(v)*r*.7,z+r*.35,r*.22,green);}ring(x,y,z,r*1.17,gold);};
 if(id==='windpanel'){
  base();b(.4,1.05,-.55,2.8,1.3,2.1,stone);b(.4,1.77,-.55,3,.18,2.3,ink);screen(.4,1.15,.53,1.5,.7);
  // Bus and the horizontal rooftop enclosure from the actual concept.
  b(0,.69,1.35,2.8,.58,.78,white);b(0,1.04,1.35,1.7,.18,.67,ink);b(0,1.14,1.35,1.45,.13,.53,glass);
  for(const x of [-.95,.95])for(const z of [.94,1.76])orb(x,.48,z,.2,ink);
  for(const x of [-2,2]){cyl(x,1.6,-1.1,.07,2.6,stone);orb(x,2.95,-1.1,.15,gold);for(let i=0;i<3;i++){const angle=i*Math.PI*2/3;b(x+Math.sin(angle)*.48,2.95+Math.cos(angle)*.48,-1.1,.14,1,.08,white,'box',[0,0,-angle]);}}
 }else if(id==='webroker'){
  base();for(const [x,z,h,c] of [[-1.4,0,2.1,blue],[0,-.6,3.7,ink],[1.4,0,2.8,'#876ebc']] as const){b(x,.4+h/2,z,1.05,h,1.05,c);b(x,h+.46,z,1.15,.16,1.15,gold);for(let y=.8;y<h+.3;y+=.44)for(const dx of [-.29,.29])b(x+dx,y,z+.535,.23,.24,.035,glass);cyl(x,h+.75,z,.035,.5,gold);}for(const x of [-1.5,0,1.5])house(x,1.25,.62,stone);
 }else if(id==='guru-engine'){
  base();for(let i=0;i<5;i++)b(0,.35+i*.16,1.6-i*.28,2.8-i*.2,.19,.7,stone);b(0,1.05,-.5,3.8,.4,2.4,stone);
  for(const x of [-1.5,-.5,.5,1.5]){cyl(x,1.7,-.05,.12,1.1,gold);b(x,2.27,-.05,.35,.15,.4,stone);}for(let i=0;i<5;i++)b(0,2.35+i*.2,-.5,4-i*.7,.22,2.6-i*.42,gold);
  orb(0,3.45,-.5,.19,gold);for(const x of [-1.55,0,1.55]){b(x,.7,1.35,.85,.5,.25,ink);b(x,.74,1.5,.55,.08,.03,gold);}
 }else if(id==='religion-earths'){
  base();cyl(0,.5,0,2.2,.5,stone);ring(0,2,0,1.9,stone);ring(0,2,0,1.65,gold);earth(0,2.1,0,.63);
  for(let i=0;i<7;i++){const t=i/7*Math.PI*2;earth(Math.cos(t)*1.65,2+Math.sin(t)*1.65,0,.25);}b(0,.83,1.7,2.8,.35,.3,ink);
 }else if(id==='agent-swarm'){
  base(ink);cyl(0,.45,0,2.3,.5,blue);cyl(0,.75,0,1.8,.15,glass);cyl(0,.95,0,.7,.25,ink);earth(0,2.05,0,.8);ring(0,2.05,0,1.1,glass,true);
  for(let i=0;i<6;i++){const t=i*Math.PI/3,x=Math.cos(t)*1.8,z=Math.sin(t)*1.8;b(x,.95,z,.55,.8,.45,white);b(x,1.55,z,.65,.5,.5,ink);for(const dx of [-.15,.15])b(x+dx,1.6,z+.26,.13,.12,.03,glass);}
 }else if(id==='karmic-life'){
  base();house(-1.5,-.55,1.5);house(1.5,-.55,1.5);b(0,1.1,-.5,1.8,1.5,1.8,stone);screen(0,1.1,.45,1.25,.85);cyl(0,2.1,-.5,.45,.3,gold);cyl(0,2.5,-.5,.17,.6,gold);orb(0,3.05,-.5,.5,'#ffe7a4');ring(0,3.05,-.5,.73,gold);
  b(-1.4,.58,1.25,1.3,.2,.8,ink);b(1.5,1.4,1.05,.18,1.7,.18,gold);b(1.05,2.15,1.05,1.05,.18,.18,gold);orb(.58,1.96,1.05,.18,ink);
 }else if(id==='solar-sales'){
  base(green);for(const x of [-1.45,0,1.45])for(const z of [-.95,.95]){house(x,z,.8,stone);b(x,1.35,z,1.22,.15,1.3,blue,'box',[-.2,0,0]);for(const dx of [-.3,.3])b(x+dx,1.43,z,.025,.035,1.28,glass,'box',[-.2,0,0]);}
 }else if(id==='creatine'){
  base(green);for(let i=0;i<3;i++){b(0,.43,1.45-i*.22,4.6,.045,.1,'#e6b080');}b(0,.37,1.2,4.7,.06,1.3,'#be6651');b(0,.43,1.45,4.6,.045,.08,white);b(0,.43,1,4.6,.045,.08,white);
  cyl(-1,1.4,-.5,.7,1.8,stone);cyl(-1,2.4,-.5,.65,.24,gold);cyl(-1,1.3,-.5,.715,.48,'#e08a48');b(.85,.8,-.2,1.6,.8,1,stone);b(.85,1.32,-.2,1.9,.22,1.25,gold);screen(.8,1.95,-.6,1.2,.65);
 }else if(id==='bio-bottle'){
  base();for(const [x,h]of [[-1.45,1.5],[0,2.7],[1.45,1.8]])bottle(x,0,h,glass);for(let i=0;i<4;i++)b(-1.2+i*.8,.48,1.3,.5,.14,.6,green);
 }else if(id==='gravity-rail'){
  base();for(const x of [-2,2]){b(x,1.8,0,.2,2.8,.25,stone);b(x,3.25,0,.7,.2,.4,gold);}b(0,3.35,0,4.6,.1,.12,ink);for(const x of [-1.1,1.1]){b(x,2.9,0,.07,.9,.07,ink);b(x,2.25,0,1,.7,.8,gold);b(x,2.32,.41,.7,.38,.035,glass);}house(0,1.2,.7,ink);
 }else if(id==='run-dna'){
  base(green);for(let i=0;i<26;i++){const t=i*.36,z=-1.65+i*.13,x=Math.sin(t)*.85,y=1.1+Math.cos(t)*.6;orb(x,y,z,.1,gold);orb(-x,2.2-y,z,.1,'#ee9b87');if(i%3===0)b(0,1.1,z,1.8,.075,.075,stone,'box',[0,0,Math.atan2(y-1.1,x)]);}
  for(const x of [-1.75,1.75]){b(x,.45,0,.2,.07,3.5,'#e2c68e');for(const z of [-1.2,0,1.2])orb(x,.62,z,.15,'#d4849b');}
 }else if(id==='rudraksha'){
  base();for(let i=0;i<20;i++){const t=i/20*Math.PI*2,x=Math.cos(t)*1.25,y=1.85+Math.sin(t)*1.25;orb(x,y,0,.22,'#9d582f');ring(x,y,.02,.2,gold);}ring(0,1.85,0,1.24,gold);cyl(0,.6,0,.8,.4,gold);orb(0,1,0,.2,'#ffe49f');screen(1.8,1.5,.65,.75,1.55);b(1.8,.6,.65,.7,.15,.8,ink);
 }else if(id==='ministers'){
  base();b(0,1.5,-.6,3.8,2,1.6,stone);for(const x of [-1.6,-.8,0,.8,1.6])cyl(x,1.5,.6,.14,1.9,gold);b(0,2.52,0,4.3,.24,2.5,stone);for(let i=0;i<4;i++)b(0,2.7+i*.14,0,4.4-i*.95,.16,2.5,gold);screen(0,1.45,.79,2.8,1.2);for(let i=0;i<8;i++)b(-1+i*.28,1.3+i*.045,.91,.19,.08,.025,white);for(let i=0;i<3;i++)b(0,.4+i*.15,1.7-i*.2,3.8,.16,.5,stone);
 }else if(id==='robotics-core'){
  base();b(0,1,-1,3.8,1.2,1.4,stone);b(0,1.68,-1,4.1,.18,1.6,ink);screen(0,1.03,-.25,2.5,.6);
  for(const x of [-1.35,1.35]){cyl(x,.42,1, .85,.12,blue);b(x,.75,1,.55,.3,.6,white);for(const dx of [-.5,.5])for(const dz of [-.4,.4]){b(x+dx/2,.79,1+dz/2,.12,.1,.75,ink,'box',[0,dx*dz>0?.8:-.8,0]);ring(x+dx,.88,1+dz,.25,ink,true);}screen(x,1,1.05,.3,.45);}
 }else if(id==='cooling-stack'){
  base();for(const x of [-1.5,0,1.5]){cyl(x,1.6,0,.49,2.2,glass);cyl(x,.48,0,.61,.2,ink);cyl(x,2.75,0,.6,.2,stone);for(const dx of [-.4,.4])b(x+dx,1.6,0,.08,2.1,.08,white);b(x,.8,1.2,.17,.8,.17,gold);b(x,.4,.6,.17,.16,1.3,gold);}screen(0,1.3,1.4,1.2,.65);
 }else return undefined;
 return a;
}
