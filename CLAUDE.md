# Claude collaboration guide

@AGENTS.md

Read [AGENTS.md](AGENTS.md) first. This is the public Karmic Life repository, not a connection to a private conversation account. Claude can contribute through normal repository access; this file does not start Claude, provide credentials, or create an autonomous integration.

## Full project scope

Claude may manage the complete public game: TypeScript and Three.js systems, UI, tests, Blender sources, exported GLBs, the feature catalogue, fictional residents and animals, documentation, and public contribution records. Diagnose, implement, validate, record an attributed footprint, and push through authorized GitHub access. No subsystem is reserved for Codex. Preserve the repository contracts and synchronize through normal Git history.

## Start from current work

Clone https://github.com/jediluvs2kill/karmic-life-game-.git using your existing authorized GitHub setup, or fork it if you do not have write permission. In an existing checkout, inspect `git status --short` and `git log -5 --oneline` before editing. Do not overwrite uncommitted work. Fetch the latest origin and fast-forward a clean main checkout before creating a focused branch such as `codex/claude-windpanel-detail`.

Read `src/inventory.ts`, `assets/blender/catalogue.json`, recent `state/events`, and `state/footprints`. Pick one bounded idea or rendering improvement. Preserve the existing project ID, district, plot, connected terrain address, and asset filename.

## Run and inspect

Use Node 24+:

```sh
npm ci
npm run dev
```

The public development server runs at http://127.0.0.1:5174/ . It is deliberately separate from the private world's local port and browser storage. Inspect the affected building or interaction at normal zoom and close range. For model work, keep the editable Blender source and generator recipe reproducible; use the README authoring instructions. Every building needs recognizable features of its idea, plus a useful name and description. Ordinary animated NPC activity is fantasy; do not present it as actual agent research or physical work.

## Record actual progress

All contributions here are public. Keep personal history, credentials, absolute user paths, and confidential evidence out of code, model metadata, comments, and work records. Use your actual actor name:

```sh
npm run world:record -- --actor Claude --project windpanel --title "Refined rooftop duct model" --summary "Describe the artifact changed and any remaining uncertainty." --truth AGENT_PROTOTYPE --type design --evidence scripts/blender/build_assets.py
```

That command is an example; run it only after doing the described work. Choose `COMPLETED_BUILD` only after validating a completed artifact. `VERIFIED_REALITY` requires evidence of an actual outcome, and never follows from a plausible simulation alone. Other states are `USER_IDEA`, `AGENT_HYPOTHESIS`, and `FANTASY_WORLD`. Work stages are research, design, prototype, test, and shipped; each needs a public evidence reference. Don't add a work stage merely for mentioning an idea. New user ideas may omit --project and supply a registered --zone.

The command appends an event and an attributed footprint. Never rewrite old events to claim progress, remove another contributor's records, or substitute a browser backup for the shared ledger. A correction is a new event.

## Validate and send for review

```sh
npm test
npm run build
git diff --check
git diff --stat
```

Review the actual diff, including model source, GLBs, feature metadata, and the attributed work record. Commit only your coherent, checked changes. Push your branch normally and open a pull request describing the idea, visible change, validation, and remaining limitations. Include a screenshot when it clarifies a visual change. Do not force-push shared branches or resolve conflicts by discarding somebody else's work.

The existing GitHub check runs the tests and production build. Main stays buildable. Automatic sync is for maintainers on canonical main, not a replacement for branch review; it intentionally pauses on branches, unfinished code, staged work, or conflicts. A fork should use pull requests rather than changing the public sync allowlist to a private destination.
