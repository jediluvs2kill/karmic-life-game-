# Karmic Life Game OS releases

Every release has a semantic version and a memorable name. Keep package.json,
package-lock.json, src/release.ts and these notes aligned. Show the current release
in the game and document changes before committing. Save schema versions are
independent of app versions; never reset history when updating a release.

## v0.2.2 — Himalayan Galleries · 23 September 2026

Truth state: COMPLETED_BUILD. Geography, galleries and NPC visits are FANTASY_WORLD scenery.

- A tall, snow-capped Himalayan range follows the northern edge. A stylized Ganga
  runs from the foothills toward the eastern coast, around established plots,
  with designated crossings rather than roads covering its water.
- The continent no longer gains land discs or causeways for new ideas. Original
  ground addresses, project IDs and plot numbers remain stable. After a district's
  reserved ground plots fill, new ideas get upper floors at the same addresses,
  retaining their own GLB, title, subtitle and evidence-driven upgrades.
- Choose a resident, then **Visit idea mall**. Dream Lab has three upper galleries:
  WindPanel and robotics exhibitions, followed by space reserved for future ideas.
  These are exhibits of existing ideas, not new accomplishments. Future overflow
  buildings appear in the same mall chooser with their actual project floors.
- Select a floor and **Take lift**, then explore with WASD/arrows. Rails and collision
  boundaries keep residents on decks; upper decks are cut away during a visit.
  **Return to island** restores the resident's entry position. Escape leaves the
  gallery first, then exits walking. Two fictional gallery visitors use the lift
  and promenade automatically; reduced motion freezes their animation.
- Coastal landmarks use land-facing approaches. Snow slopes are not walkable.
  Walkers and agents still have connected routes to every main landmark.
- Validation covers river continuity, coastline invariance, 5,000 unique future
  addresses, deck collisions, visitor lift journeys and existing resident controls.
  Address capacity is not a performance guarantee for rendering thousands of GLBs;
  streaming and floor pagination remain future work. This is a stylized map, not
  geographically surveyed terrain. Visits do not award progress or create events.

## v0.2.1 — True Directions · 23 September 2026

Truth state: COMPLETED_BUILD.

- Fixed mirrored sideways movement in walking mode: Left / A moves screen-left;
  Right / D moves screen-right, including after rotating the camera.
- Forward/backward movement, sprinting and hopping retain their existing behavior.
- A regression test projects movement through a real Three.js camera at six headings
  to verify screen direction rather than merely checking world-coordinate signs.

## v0.2.0 — Island Walker · 23 September 2026

Truth state: COMPLETED_BUILD.

- Choose any of the 24 fictional residents and take control on the latest saved day.
- WASD or arrows move relative to the camera; Shift runs; Space performs a small hop.
- Drag on the world to look around; scroll adjusts third-person camera distance.
- Escape or Exit walk returns to the previous overview. The resident walks back to
  their regular route without teleporting. Historical snapshots and world rebuilds
  end the walking session safely.
- Movement uses the existing walkable terrain grid, blocking water, building cells,
  trees and diagonal corner shortcuts. Hops do not bypass ground constraints.
- The camera pulls in or rises above nearby project bounds. There is no free-form physics,
  swimming, building-interior traversal or full scenery collision in this release.
- Explicit keyboard control requires desktop keys. Reduced motion removes gait and
  automatic camera bounce; player-directed movement remains available.
- A visible release badge opens these release highlights and the future roadmap.
- Walking is FANTASY_WORLD activity and produces no work records or real achievements.

Validation: production build, complete automated suite and browser playtest.

## v0.1.0 — Civilization Foundations · existing baseline

Truth state: COMPLETED_BUILD. Retrospective name for the pre-versioned game:
idea-specific buildings, shared Git contribution ledger, residents, island terrain,
free camera navigation and game HUD. Original release date is not asserted.

## Planned v0.3.0 — Island Visits

Truth state: USER_IDEA. Not implemented; no release date promised.

Let a guest visit a host's island by invitation, initially read-only. Define stable
world and owner identities, accounts, explicit visibility, revocable invitations,
and a hosted world snapshot service. Private conversations and evidence remain
private unless their owner explicitly shares them. Do not equate Git write access
with permission to enter or edit a user's island.

## Planned v0.4.0 — Shared Worlds

Truth state: USER_IDEA. Not implemented; no release date promised.

Visitors can become collaborators around a host island after the host grants a
builder role. Require attributed proposals, host approval, protected existing plots,
versioned world changes, rollback and conflict handling. Real-time shared presence
requires an authoritative multiplayer service. Preserve the truth-state ledger;
client movement and multiplayer activity never prove real-world work.
