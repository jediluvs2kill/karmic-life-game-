import * as THREE from 'three';
import {mountainHeight} from './geography.ts';
import {groundHeight} from './civilization.ts';
import {isCivilizationLand} from './island-shape.ts';

/** One faceted mesh for the whole range; all vertices stay on the continent. */
export function createHimalayas(){
 const positions:number[]=[],colors:number[]=[];
 for(let x=-44;x<44;x++)for(let z=-44;z<-25;z++){
  const points=[[x,z],[x+1,z],[x,z+1],[x+1,z+1]];
  for(const triangle of [[0,2,1],[1,2,3]]){
   const vertices=triangle.map(i=>points[i]);if(vertices.some(([a,b])=>!isCivilizationLand(a,b)))continue;
   const heights=vertices.map(([a,b])=>mountainHeight(a,b));if(Math.max(...heights)<.1)continue;
   const high=Math.max(...heights),shade=high>13?'#f4f8ff':high>9?'#bccfda':high>5?'#85989a':'#59766b';
   const color=new THREE.Color(shade).multiplyScalar(1+Math.sin(x*17+z*3)*.055);
   vertices.forEach(([a,b],i)=>{positions.push(a,groundHeight(a,b)+heights[i]+.03,b);colors.push(color.r,color.g,color.b);});
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));mesh.name='Himalayan range · snow peaks and green foothills';return mesh;
}
