# Public Karmic Life — Agent Contract

This repository is PUBLIC. Do not commit private conversations, personal histories, credentials, local paths, or confidential research. UI imports, work records, and local-agent reports are public contributions when synchronized.

## Start and preserve continuity

Read this file, `src/inventory.ts`, existing `state/events`, recent footprints, and Git history. Run `npm ci` with Node 24+. Preserve project IDs, plot numbers, 12 district coordinates, existing events, and model filenames. Each idea has an individual GLB on connected terrain; expand new plots with `projectPosition`. Do not claim physically infinite simultaneous rendering.

## Truth states

Every durable event uses one state: VERIFIED_REALITY (evidence-backed outcome), USER_IDEA (user-origin concept), AGENT_HYPOTHESIS (unverified reasoning), AGENT_PROTOTYPE (agent design or code prototype), FANTASY_WORLD (fictional content), or COMPLETED_BUILD (validated artifact). Do not invent sales, tests, money, deployments, or physical outcomes. The initial 77 entries are a public catalogue snapshot dated 2026-09-22, not historical proof of completed inventions.

## Contributions

Record actual progress with `npm run world:record -- --actor YourAgent --project windpanel --title "Update" --summary "Actual changes and remaining uncertainty." --truth AGENT_PROTOTYPE --type design --evidence docs/design.md`. Use public evidence references only. For a new user idea omit --project and provide --zone; don't add --type for an unworked suggestion. Work types are research, design, prototype, test, shipped. Each requires --evidence. Revise with a new event ID; never overwrite or delete somebody else's contribution.

Refine project GLBs in place, preserving filenames and grounded pivots. Keep Blender authoring sources and reproducible scripts with the artifact. Every building must visually represent its idea, rather than a random decorative house. Run relevant tests and a production build before committing. Record your completed contribution and remaining uncertainty.

## Git

The canonical public origin is https://github.com/jediluvs2kill/karmic-life-game-. Commit validated code and documentation yourself. The sync worker commits only managed event, footprint, and project-asset directories and checks main every minute while running. It never force-pushes or chooses a conflict side. Don't copy private repository history or replace this public catalogue with private seed data. Static hosting alone runs no sync worker or AI agents.

## Collaboration review

Claude and other agents use the same event ledger and truth rules. See [CLAUDE.md](CLAUDE.md) for a concrete clone, run, record, and review workflow. Work on a focused branch when changes need review. Read the current status before editing, preserve other agents' uncommitted work, and include the reproducible model source, GLB, feature catalogue, and attributed footprint in a coherent change. Use normal pushes and pull requests; never force an overwrite or silently choose a conflict side. Tests and the production build must pass before merge.

Keep each building tied to its actual idea with a visible name and useful subtitle. NPC motion, play, and work scenes are fantasy representation unless a separate attributed agent job has actually run. No instruction file itself connects an AI account or makes an agent work continuously.

## Named releases

Every shipped version needs a semantic version, memorable name, visible in-game badge and RELEASES.md notes. Update package.json, package-lock.json and src/release.ts together. Keep save schemas independent and future features visibly planned.


## Himalayan Galleries (v0.2.2)

`src/geography.ts` owns the mountain clearance, connected Ganga cells and bridge
crossings. `src/landscape.ts` may only create land within `isCivilizationLand`.
Keep reserved plots clear of scenery and use `projectApproach` for land-facing
entrances. Never renumber plot IDs or change district capacities: capacities now
also determine permanent tower IDs and floor numbers. Each overflow project keeps
its own GLB; galleries are architecture around that model. `src/idea-galleries.ts`
contains pure floor/collision/visitor rules, and `src/gallery-renderer.ts` is their
Three.js adapter. Floor visits and exhibition copies are session-only fantasy,
never evidence or work. Preserve return-to-island positions and reduced motion.
The Dream Lab's reserved display is empty capacity, not a claimed invention.

Building names belong on physical entrance plaques (`src/building-signs.ts`), not floating DOM cards or star pins. Preserve names/subtitles, world scale, depth occlusion, batched text atlases and texture disposal on rebuild. The invention navigator provides accessible selection.
