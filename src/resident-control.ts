export type WalkPoint={x:number;z:number};
export type Walker=WalkPoint&{yaw:number;gait:number;hop:number;hopVelocity:number;moving:boolean};
export type WalkInput={forward:number;right:number;yaw:number;run:boolean;jump:boolean};

/** A small footprint on the existing navigation grid; never crosses blocked corners. */
export function canStand(point:WalkPoint,tiles:Set<string>){
 const radius=.16;
 return [-radius,0,radius].every(dx=>[-radius,0,radius].every(dz=>tiles.has(Math.round(point.x+dx)+','+Math.round(point.z+dz))));
}

/** Explicit input only. Hopping is visual and never bypasses ground or building constraints. */
export function stepWalker(walker:Walker,input:WalkInput,seconds:number,tiles:Set<string>):Walker{
 const dt=Math.max(0,Math.min(Number.isFinite(seconds)?seconds:0,.05));
 let dx=Math.sin(input.yaw)*input.forward+Math.cos(input.yaw)*input.right;
 let dz=Math.cos(input.yaw)*input.forward-Math.sin(input.yaw)*input.right;
 const length=Math.hypot(dx,dz);if(length>1){dx/=length;dz/=length;}
 const step=(input.run?5:2.6)*dt;
 let {x,z}=walker;
 // Small substeps also protect corners while sprinting at low frame rates.
 const parts=Math.max(1,Math.ceil(step/.08));
 for(let i=0;i<parts;i++){
  if(canStand({x:x+dx*step/parts,z},tiles))x+=dx*step/parts;
  if(canStand({x,z:z+dz*step/parts},tiles))z+=dz*step/parts;
 }
 const moved=Math.hypot(x-walker.x,z-walker.z),moving=moved>1e-5;
 let {hop,hopVelocity}=walker;
 if(input.jump&&hop===0)hopVelocity=3.8;
 hopVelocity-=12*dt;hop=Math.max(0,hop+hopVelocity*dt);if(hop===0)hopVelocity=0;
 return {x,z,yaw:moving?Math.atan2(x-walker.x,z-walker.z):walker.yaw,gait:walker.gait+moved*3.8,hop,hopVelocity,moving};
}
