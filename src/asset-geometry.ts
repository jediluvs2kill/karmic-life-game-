import {BoxGeometry,CylinderGeometry,SphereGeometry,TorusGeometry} from 'three';
import type {AssetBlock} from './architecture.ts';
export function blockGeometry(b:AssetBlock){
 const g=b.shape==='cylinder'?new CylinderGeometry(.5,.5,1,12):b.shape==='sphere'?new SphereGeometry(.5,12,8):b.shape==='torus'?new TorusGeometry(.46,.035,5,32):new BoxGeometry(1,1,1);
 g.scale(b.w,b.h,b.d);if(b.rotation){g.rotateX(b.rotation[0]);g.rotateY(b.rotation[1]);g.rotateZ(b.rotation[2]);}
 return g;
}
