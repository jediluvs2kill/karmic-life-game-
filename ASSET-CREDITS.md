# Scenery and visual effects

The island ships 22 selected models from Kenney, under **CC0 1.0**:

- [Nature Kit](https://kenney.nl/assets/nature-kit): trees, rocks, shrubs, flowers, wooden bridge.
- [Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit): gabled roof, shuttered wall, door, fountain, stall, cart, lanterns, bench.
- [Pirate Kit](https://kenney.nl/assets/pirate-kit): sailing ship, palms, harbour rocks, watchtower, barrel, crate.

Original licence files and a per-model provenance/size manifest are in `public/assets/kenney/`. The selected models are downloaded and served locally, without runtime third-party asset requests. Source archives live in the ignored `.asset-source/` folder.

`scripts/prepare-assets.mjs` normalizes pivots to bottom-center and maximum dimension to one, flattens hierarchies, deduplicates and prunes GLBs using glTF Transform. Texture transforms are preserved. Nature materials are converted from unlit to rough, nonmetallic PBR and recoloured to forest greens, warm bark, and blue-grey stone to fit the reference. Static geometry is instanced by model primitive; cached geometries and materials survive world rebuilds. The rendered terrain supplies an independent collision/route grid. Compression decoders are unnecessary for this sub-1 MB model set.

- [postprocessing](https://github.com/pmndrs/postprocessing), Zlib licence: bloom, ACES tone mapping, vignette and FXAA. The sparkle button switches to lightweight rendering.
- [GSAP](https://gsap.com/): eased district camera moves and zoom. Reduced-motion preferences disable camera tween duration. See the installed package's licence.
- [Three.js](https://threejs.org/), MIT: renderer, GLTFLoader, instancing, shadows and orbit controls.
- glTF Transform, MIT: build-time asset preparation and validation.

The ocean shader and remaining district/terrain geometry are original project code. Agent navigation and saved district coordinates are independent of these visual assets. Idle walks are decorative; the agent panel reports real inference state.

The 77 project GLBs are original idea-specific models generated in Blender, with editable source in `assets/blender/karmic-ideas.blend` and reproducible Python in `scripts/blender/build_assets.py`. The companion catalogue describes each invention's visible features. Vertex colours, grounded pivots, and opaque rough materials keep the models lightweight and readable in daylight and at night. These models interpret the user's invention concepts and visual references; they do not embed the reference images. Existing fallback recipes in `src/architecture.ts` and `src/landmark-architecture.ts` give future ideas an immediate model until refined in Blender. Existing GLBs are never overwritten by the world compiler.
