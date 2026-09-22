import * as THREE from 'three';
import {BloomEffect,EffectComposer,EffectPass,FXAAEffect,RenderPass,ToneMappingEffect,ToneMappingMode,VignetteEffect} from 'postprocessing';

export function createAtmosphere(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera){
 const composer=new EffectComposer(renderer,{frameBufferType:THREE.HalfFloatType,multisampling:0});
 composer.addPass(new RenderPass(scene,camera));
 const bloom=new BloomEffect({intensity:.08,luminanceThreshold:1.15,luminanceSmoothing:.2,mipmapBlur:true,resolutionScale:.5});
 const effects=new EffectPass(camera,bloom,new ToneMappingEffect({mode:ToneMappingMode.ACES_FILMIC}),new VignetteEffect({offset:.38,darkness:.1}),new FXAAEffect());composer.addPass(effects);
 let enabled=true;
 function render(dt:number){if(enabled)composer.render(dt);else renderer.render(scene,camera);}
 function setEnabled(value:boolean){enabled=value;renderer.toneMapping=enabled?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;}
 return {render,setEnabled,resize:(w:number,h:number)=>composer.setSize(w,h),night:(value:boolean)=>{bloom.intensity=value?.25:.08;},get enabled(){return enabled;}};
}

/** A single cheap shader supplies moving water bands without reflection render targets. */
export function createOcean(){
 const material=new THREE.ShaderMaterial({uniforms:{time:{value:0},deep:{value:new THREE.Color('#086caa')},shallow:{value:new THREE.Color('#20b7d0')},foam:{value:new THREE.Color('#b2f2e4')}},vertexShader:`
  varying vec3 worldPosition;
  void main(){vec4 p=modelMatrix*vec4(position,1.);worldPosition=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}
 `,fragmentShader:`
  uniform float time;uniform vec3 deep;uniform vec3 shallow;uniform vec3 foam;varying vec3 worldPosition;
  void main(){vec2 p=worldPosition.xz;float wave=sin(p.x*.37+time*.6)+sin(p.y*.58-time*.8);float bands=sin(p.x*1.8+p.y*.62+sin(p.y*.5)+time);
   float shore=1.-smoothstep(16.,38.,length(p*vec2(.8,1.)));vec3 color=mix(deep,shallow,shore*.62+wave*.04);
   float sparkle=pow(max(0.,bands),24.)*pow(max(0.,sin(p.y*2.8+time*.4)),8.);color=mix(color,foam,sparkle*.11);gl_FragColor=vec4(color,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }
 `});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=-5.9;
 return {mesh,update:(time:number)=>material.uniforms.time.value=time,setNight:(night:boolean)=>{material.uniforms.deep.value.set(night?'#071a3c':'#086caa');material.uniforms.shallow.value.set(night?'#123f67':'#20b7d0');material.uniforms.foam.value.set(night?'#3a7182':'#b2f2e4');}};
}
