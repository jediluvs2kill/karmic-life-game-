/** Permanent landmark addresses. Their forms are fantasy interpretations of real ideas. */
export const landmarks:Record<string,{x:number;z:number;rise:number;scale:number;name:string;caption:string}>={
 windpanel:{x:-22,z:-14,rise:1.2,scale:2,name:'Karmic Winds Lab',caption:'Explore • measure • refine'},
 webroker:{x:-13,z:0,rise:.5,scale:2.15,name:'Webroker City',caption:'Intent connects people'},
 'guru-engine':{x:-4,z:-23,rise:3,scale:2.2,name:'Guru Loop Temple',caption:'The right guidance, at the right time'},
 'religion-earths':{x:17,z:-23,rise:2.4,scale:2.3,name:'Religion Earths Observatory',caption:'Many worldviews. Shared questions.'},
 'agent-swarm':{x:0,z:-5,rise:.4,scale:2,name:'Agent Command',caption:'Explore • question • develop'},
 'karmic-life':{x:15,z:-6,rise:.8,scale:2,name:'Dream Lab',caption:'Your ideas become places'},
 'solar-sales':{x:30,z:-10,rise:1.2,scale:1.9,name:'Solar Rooftop Colony',caption:'Every roof, a possibility'},
 creatine:{x:-29,z:12,rise:.2,scale:2,name:'Karmic Creatine Park',caption:'A runner’s sampling station'},
 'bio-bottle':{x:-14,z:15,rise:.4,scale:2,name:'Water Bio Lab',caption:'Rethinking the everyday bottle'},
 'gravity-rail':{x:-24,z:27,rise:.3,scale:2,name:'Gravity Logistics',caption:'Elevate. Glide. Connect.'},
 'run-dna':{x:0,z:24,rise:.2,scale:2.2,name:'Run DNA Park',caption:'Every route tells a story'},
 rudraksha:{x:15,z:11,rise:1,scale:2,name:'Rudraksha Shrine',caption:'Practice becomes geometry'},
 ministers:{x:30,z:9,rise:1.6,scale:2,name:'Civic Ledger',caption:'Evidence through time'},
 'robotics-core':{x:14,z:28,rise:.3,scale:2,name:'Drone Dock',caption:'One phone. Many machines.'},
 'cooling-stack':{x:30,z:25,rise:.4,scale:2,name:'Coolant Works',caption:'A place to experiment'}
};
export const landmarkIds=Object.keys(landmarks);
export function groundHeight(x:number,z:number){
 let h=.2;
 for(const p of Object.values(landmarks))h=Math.max(h,.2+p.rise*Math.max(0,Math.min(1,(10-Math.hypot(x-p.x,z-p.z))/4)));
 return h;
}
