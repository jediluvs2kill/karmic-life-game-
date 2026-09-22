import {defineConfig} from 'vite';
import {swarmPlugin} from './server/swarm.mjs';
import {worldPlugin} from './server/world-api.mjs';
export default defineConfig({base:'./',plugins:[swarmPlugin(),worldPlugin()],server:{host:'127.0.0.1',port:5174,strictPort:true,watch:{ignored:['**/state/events/**','**/state/footprints/**','**/.karmic/**','**/public/world-state.json','**/public/project-assets.json']}},build:{rollupOptions:{output:{manualChunks:{three:['three'],models:['three/addons/loaders/GLTFLoader.js'],effects:['postprocessing'],motion:['gsap']}}}}});
