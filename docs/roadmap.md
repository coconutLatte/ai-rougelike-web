# Evolution Roadmap

> **Strict cap: 10 pending max.**
> **Target: First-person 3D roguelike using Three.js / WebGL**
> Implement mode: mark complete only. Discover/groom mode: add/remove tasks.

## Phase 0: Bug Fixes

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P0-01 | P0 | Project skeleton with build system and minimal playable roguelike (dungeon gen, player movement, enemy AI, bump combat, FOV, HUD, save/load) | completed | 2026-07-21 | Initial seed |
| P0-02 | P0 | Fix critical bugs: save/load non-functional (BUG-001), enemy wander crash (BUG-002), player wall spawn on floor change (BUG-003) | pending | — | See docs/bugs.md for details |
| P0-03 | P0 | Fix major bugs: enemy pool capped (BUG-004), XP multi-level-up skipped (BUG-005), BSP room overflow (BUG-006) | pending | — | See docs/bugs.md |

## Phase 1: 3D Foundation

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P1-01 | P1 | Add Three.js dependency, create basic 3D scene with camera, lighting, and render loop | pending | — | Replace Canvas with WebGL renderer |
| P1-02 | P1 | Convert dungeon tiles to 3D: walls as textured cubes, floors as planes, stairs as marked tiles | pending | — | Keep 2D dungeon generation, render in 3D |
| P1-03 | P1 | First-person camera with mouse look + WASD movement | pending | — | Pointer lock API for mouse capture |
| P1-04 | P1 | 3D player representation and collision detection with walls | pending | — | Raycasting or simple AABB collision |
| P1-05 | P2 | 3D enemy rendering with basic models (colored geometry) and health bars | pending | — | Replace glyph rendering with 3D meshes |

## Phase 2: 3D Gameplay & Polish

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P1-06 | P2 | Item/loot system: 3D item pickups, inventory panel UI | pending | — | Port existing item system to 3D |
| P1-07 | P2 | Lighting system: dynamic point lights, torch/flicker effects, fog of war in 3D | pending | — | Three.js lights + fog |
| P2-01 | P3 | Mini-map overlay showing 2D top-down view of explored dungeon | pending | — | RenderTexture on corner of screen |
| P2-02 | P3 | Sound effects: footsteps, combat, ambient dungeon audio | pending | — | Web Audio API or Howler.js |
| P2-03 | P3 | Visual polish: particle effects, damage numbers in 3D space, screen shake | pending | — | Three.js particle system |
