export type CameraPoint={x:number;y:number;z:number};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

/** Wheel units differ between mice, trackpads and browsers. */
export function walkZoom(distance:number,delta:number,mode=0,pageHeight=800){
 const pixels=delta*(mode===1?16:mode===2?pageHeight:1);
 return clamp(distance*Math.exp(clamp(pixels,-240,240)*.0015),2,18);
}
export function followHeight(previous:number|undefined,height:number,dt:number,reduced=false){
 return previous===undefined||reduced?height:previous+(height-previous)*(1-Math.exp(-14*Math.max(0,dt)));
}
export function boomDirection(yaw:number,pitch:number):CameraPoint{
 return {x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};
}
/** Obstructions shorten the boom; they never change the user's viewing angle. */
export function clearBoomDistance(target:CameraPoint,direction:CameraPoint,requested:number,heightAt:(x:number,z:number)=>number,obstacleDistance=Infinity){
 const limit=Math.max(.2,Math.min(requested,obstacleDistance-.3));
 for(let d=.2;d<=limit;d+=.1){
  const p={x:target.x+direction.x*d,y:target.y+direction.y*d,z:target.z+direction.z*d};
  if(p.y<heightAt(p.x,p.z)+.25)return Math.max(.2,d-.1);
 }
 return limit;
}
export function followBoom(previous:number,requested:number,clearance:number,dt:number,reduced=false){
 const next=reduced?requested:previous+(requested-previous)*(1-Math.exp(-10*Math.max(0,dt)));
 // Contract immediately for safety; recover smoothly when an obstruction clears.
 return Math.min(clearance,next);
}
