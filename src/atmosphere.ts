import * as THREE from 'three';
import {BloomEffect,BrightnessContrastEffect,EffectComposer,EffectPass,FXAAEffect,HueSaturationEffect,RenderPass,ToneMappingEffect,ToneMappingMode,VignetteEffect} from 'postprocessing';

export function createAtmosphere(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera){
 const composer=new EffectComposer(renderer,{frameBufferType:THREE.HalfFloatType,multisampling:0});
 composer.addPass(new RenderPass(scene,camera));
 const bloom=new BloomEffect({intensity:.2,luminanceThreshold:1.05,luminanceSmoothing:.25,mipmapBlur:true,resolutionScale:.5});
 const effects=new EffectPass(camera,bloom,new ToneMappingEffect({mode:ToneMappingMode.ACES_FILMIC}),new HueSaturationEffect({saturation:.14}),new BrightnessContrastEffect({brightness:.01,contrast:.07}),new VignetteEffect({offset:.34,darkness:.22}),new FXAAEffect());composer.addPass(effects);
 let enabled=true;
 function render(dt:number){if(enabled)composer.render(dt);else renderer.render(scene,camera);}
 function setEnabled(value:boolean){enabled=value;renderer.toneMapping=enabled?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;}
 return {render,setEnabled,resize:(w:number,h:number)=>composer.setSize(w,h),night:(value:boolean)=>{bloom.intensity=value?.4:.2;},get enabled(){return enabled;}};
}

/** A single cheap shader supplies moving water bands without reflection render targets. */
export function createOcean(){
 const material=new THREE.ShaderMaterial({uniforms:{time:{value:0},deep:{value:new THREE.Color('#155166')},shallow:{value:new THREE.Color('#3bc1b9')},foam:{value:new THREE.Color('#c0f4de')}},vertexShader:`
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
 return {mesh,update:(time:number)=>material.uniforms.time.value=time,setNight:(night:boolean)=>{material.uniforms.deep.value.set(night?'#101b39':'#155166');material.uniforms.shallow.value.set(night?'#246064':'#3bc1b9');material.uniforms.foam.value.set(night?'#80b6ba':'#c0f4de');}};
}
