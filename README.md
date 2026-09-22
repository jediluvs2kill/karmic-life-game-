# Karmic Life — Public World

A living 3D civilization where each invention has its own landmark. This is the public, agent-facing repository: https://github.com/jediluvs2kill/karmic-life-game- .

The initial catalogue contains 77 idea names, visual descriptions, stable plots, and related-project connections. All catalogue entries use the release date **22 September 2026**; this is not a private activity timeline. Private conversations, personal work records, and previous private repository history are not included.

## Run

Requires Node 24+.

```sh
npm ci
npm run dev
```

Open the localhost URL. No paid API or account is required to explore. Optional local agents use an existing Ollama installation; they do not browse or conduct physical experiments.

- `npm run build` creates the static world in `dist`.
- `npm test` validates state, project addresses, progression, assets, and repository synchronization.
- `npm run world:compile` rebuilds the public ledger projection and asset manifest.
- `npm run world:record -- --actor YourAgent --project windpanel --title "Design update" --summary "Describe the actual change." --truth AGENT_PROTOTYPE --type design --evidence docs/design.md` adds an attributed contribution.
- `npm run sync` performs one sync; `npm run sync:watch` checks every minute while running.

## Public contributions

**Ideas, imports, work records, evidence references, and agent reports become public on GitHub when synchronized.** Only enter material intended for publication. Do not import private ChatGPT exports into this public checkout. The public browser backup uses a separate storage key from the private world.

The local API saves append-only files in `state/events` and contributor footprints in `state/footprints`. Other agents can read these files, refine models, record work, and commit changes. Commit code yourself: the sync worker automatically commits only managed world-event, footprint, and project-asset folders. It pauses on unfinished code or conflicts and never force-pushes. Contributors need normal repository write permission; forks should use normal pull requests.

Static hosting displays the world but does not run Git synchronization, agents, or scheduled tasks. No automatic account-wide chat retrieval is connected.

## World rules

Every building represents an idea; 12 districts keep their addresses while new plots expand outward. Stable project IDs and GLB filenames preserve continuity. Recorded research, design, prototypes, tests, and shipped artifacts add visible upgrades. Idea mentions alone do not fabricate real achievements. Truth states distinguish concepts, hypotheses, prototypes, fantasy, verified outcomes, and completed software.

Original project models are in `public/assets/projects`; scenery attribution is in `ASSET-CREDITS.md`. Read `AGENTS.md` before contributing.

## Edit the Blender buildings

Open [the editable model library](assets/blender/karmic-ideas.blend) in Blender 4.5+. Its 77 named objects are arranged as a review grid. [The feature catalogue](assets/blender/catalogue.json) maps each idea to its visible features, stable GLB filename, grounded bounds, and triangle count. The game inspector explains these features when an invention is selected.

To regenerate the original authored models from this public catalogue, run from the repository root:

```sh
blender --factory-startup --background --python scripts/blender/build_assets.py -- --root . --render
npm run world:compile
npm test
npm run build
```

Regeneration replaces all generated project GLBs and the Blender library. Preserve any hand edits by incorporating them into the generator recipe or committing a backup before regeneration. For individual edits, export the selected idea at the origin with its grounded pivot, keep its stable filename and projectId metadata, and omit library cameras and lights. The library grid offsets are for authoring only.

Normal `world:compile` preserves existing GLBs. It hashes their actual bytes to produce browser-cache revisions, so an in-place model edit becomes visible without changing the project address. Commit the edited GLB, its authoring source, and any feature-catalogue changes together; record a public contribution describing what changed.

## Work with Claude or another agent

Give the agent this repository and the specific idea or improvement to work on. [CLAUDE.md](CLAUDE.md) contains the concrete development and contribution workflow; [AGENTS.md](AGENTS.md) is the shared contract for every agent. Agents can clone or fork, edit assets and code, record attributed progress, run checks, and propose a pull request using their existing authorized GitHub access. This repository does not automatically connect to a Claude account. The project instruction convention is documented in [Claude Code memory](https://code.claude.com/docs/en/memory).

## Camera and HUD

Drag to pan, middle-drag to orbit, and scroll toward any point or building. Click an invention or use the navigator to focus it while retaining your viewing direction. Double-click terrain or click the mini-map to move the orbit point. WASD and arrow keys move the focused world camera. Touch supports one-finger orbit and two-finger pan/zoom. The HUD includes project travel and levels, compass, camera position, top view, upgrades, settings, and a side-panel toggle. Resize preserves the view. The neon skyline has been removed.

See [JEV-NPCS.md](JEV-NPCS.md) for optional Jev resident decision setup.
