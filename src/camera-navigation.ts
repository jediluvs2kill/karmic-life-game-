import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

/** Camera movement is independent of project placement and game progress. */
export function configureWorldCamera(controls:OrbitControls){
 controls.enableDamping=true;
 controls.dampingFactor=.12;
 controls.zoomToCursor=true;
 controls.screenSpacePanning=false;
 controls.minDistance=1.5;
 controls.maxDistance=2200;
 controls.minPolarAngle=.03;
 controls.maxPolarAngle=Math.PI*.495;
 controls.mouseButtons.LEFT=THREE.MOUSE.PAN;
 controls.mouseButtons.MIDDLE=THREE.MOUSE.ROTATE;
 controls.mouseButtons.RIGHT=THREE.MOUSE.PAN;
 controls.touches.ONE=THREE.TOUCH.ROTATE;
 controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
}

export function panCamera(camera:THREE.PerspectiveCamera,controls:OrbitControls,right:number,forward:number,dt:number){
 const heading=new THREE.Vector3().subVectors(controls.target,camera.position);heading.y=0;
 if(heading.lengthSq()<.0001)heading.set(0,0,-1);else heading.normalize();
 const side=new THREE.Vector3().crossVectors(heading,camera.up).normalize();
 const step=heading.multiplyScalar(forward).addScaledVector(side,right);
 if(step.lengthSq()>1)step.normalize();
 step.multiplyScalar(Math.max(2,camera.position.distanceTo(controls.target)*.55)*dt);
 camera.position.add(step);controls.target.add(step);
}

/** Translate both endpoints so focusing keeps the user's viewing direction. */
export function cameraDestination(camera:THREE.PerspectiveCamera,controls:OrbitControls,point:THREE.Vector3,distance?:number){
 const offset=camera.position.clone().sub(controls.target);
 if(distance!==undefined)offset.setLength(THREE.MathUtils.clamp(distance,controls.minDistance,controls.maxDistance));
 return {target:point.clone(),position:point.clone().add(offset)};
}
