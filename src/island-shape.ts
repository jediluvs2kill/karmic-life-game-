export type MapPoint={x:number;z:number};

/**
 * A symbolic fantasy-continent silhouette inspired by the user's Akhand Bharat
 * reference. It deliberately contains no modern borders or territorial labels.
 * The coordinates preserve every established district address.
 */
export const akhandBharatOutline:readonly MapPoint[]=[
 {x:-44,z:-28},{x:-42,z:-39},{x:-31,z:-44},{x:-23,z:-42},{x:-18,z:-45},{x:-13,z:-40},
 {x:-5,z:-43},{x:0,z:-38},{x:12,z:-42},{x:23,z:-39},{x:37,z:-36},{x:45,z:-28},
 {x:43,z:-18},{x:37,z:-12},{x:40,z:-8},{x:46,z:-6},{x:48,z:0},{x:44,z:5},
 {x:39,z:7},{x:42,z:12},{x:46,z:17},{x:43,z:22},{x:39,z:23},{x:42,z:31},
 {x:38,z:38},{x:35,z:35},{x:34,z:26},{x:29,z:22},{x:27,z:28},{x:22,z:35},
 {x:18,z:43},{x:13,z:51},{x:8,z:59},{x:4,z:64},{x:1,z:61},{x:-1,z:52},
 {x:-4,z:44},{x:-8,z:36},{x:-12,z:29},{x:-17,z:24},{x:-24,z:21},{x:-29,z:16},
 {x:-33,z:10},{x:-29,z:5},{x:-33,z:0},{x:-39,z:-2},{x:-36,z:-10},{x:-41,z:-14},
 {x:-38,z:-22},{x:-45,z:-24}
];

export function insideOutline(x:number,z:number,outline:readonly MapPoint[]=akhandBharatOutline){
 let inside=false;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const a=outline[i],b=outline[j];
  if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}

export function isCivilizationLand(x:number,z:number){
 const sriLanka=(x-5)**2/11+(z-72)**2/15<1;
 const ramSetu=z>=64&&z<=68&&Math.abs(x-(4+(z-64)*.2))<.72;
 return insideOutline(x,z)||sriLanka||ramSetu;
}

export function miniMapOutlinePath(offsetX=48,offsetZ=46){
 return akhandBharatOutline.map((p,index)=>`${index?'L':'M'}${p.x+offsetX} ${p.z+offsetZ}`).join(' ')+' Z';
}
