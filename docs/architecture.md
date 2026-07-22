# Architecture: AI Roguelike (3D)

> Target: First-person 3D roguelike using Three.js / WebGL.
> Current phase: 2D Canvas (transitioning to 3D).

## Overview

A roguelike game evolving from 2D Canvas to first-person 3D. Built with TypeScript + Vite, rendered with Three.js (WebGL), deployed via GitHub Pages.

## Tech Stack

| Component | Current (2D) | Target (3D) |
|---|---|---|
| Language | TypeScript 5 (strict) | TypeScript 5 (strict) |
| Bundler | Vite 6 | Vite 6 |
| Rendering | Canvas API | Three.js (WebGL) |
| UI | DOM | DOM overlay on 3D canvas |
| Testing | Vitest + jsdom | Vitest + jsdom |
| Storage | localStorage | localStorage |
| Deployment | GitHub Pages | GitHub Pages |

## Architecture Evolution

### Phase 0 (Current): 2D Canvas Roguelike
```
Canvas 2D tiles → BSP dungeon → Entity glyphs → FOV shadowcasting
```

### Phase 1 (Target): 3D First-Person Roguelike
```
Three.js scene → BSP dungeon → 3D geometry (walls/floors) → First-person camera
                                 → 3D enemy meshes → Combat system
                                 → Dynamic lighting → Fog/atmosphere
```

## Project Structure

```
src/
├── main.ts                 Entry point, Three.js init, DOM wiring
├── core/                   Game core (Game, Dungeon, Tile, types)
├── entities/               Game entities (Entity, Player, Enemy, Item)
├── systems/                Game systems
│   ├── RenderSystem3D.ts   ← Three.js 3D renderer (replaces Canvas)
│   ├── CombatSystem.ts
│   ├── CameraController.ts ← First-person mouse look + WASD
│   ├── InputHandler.ts     Keyboard + mouse input
│   ├── SaveManager.ts
│   └── TurnManager.ts
├── ui/                     DOM-based UI (HUD, Inventory, MiniMap, GameOver)
├── data/                   Static data (enemies, items, colors/materials)
└── utils/                  RNG, pathfinding, constants, geometry helpers
```

## 3D Rendering Design

### Scene Graph
```
Scene
├── AmbientLight (dim dungeon ambient)
├── PointLight (attached to player — "torch")
├── DungeonGroup
│   ├── FloorMesh (merged plane geometry per room)
│   └── WallMeshes (box geometries for each wall tile)
├── EnemyGroup
│   └── EnemyMesh (colored box/capsule per enemy)
├── ItemGroup
│   └── ItemMesh (rotating small geometry per item)
└── ParticleGroup (damage numbers, effects)
```

### Camera
- PerspectiveCamera, FOV ~70
- First-person: positioned at player eye level
- Mouse look via PointerLock API
- Collision: camera blocked by walls (raycasting)

### Movement
- WASD for forward/back/strafe
- Rotation via mouse
- Turn-based: each step = one turn, enemies move after

## Key Design Decisions

1. **Keep BSP dungeon generation**: The 2D grid is the logical map. 3D geometry is derived from it. This preserves all existing dungeon logic.

2. **Turn-based in 3D**: Movement is discrete (grid-based steps), not continuous free-movement. This keeps roguelike gameplay intact while looking 3D.

3. **Hybrid UI**: Game world in WebGL canvas, HUD/inventory/minimap as DOM overlay. Each technology used where it excels.

4. **Phased transition**: Fix all 2D bugs first, then add Three.js alongside existing code, then remove Canvas rendering once 3D is stable.

## Evolution History

| Round | Date | Task | Description |
|---|---|---|---|
| 1 | 2026-07-21 | P0-01 | Initial seed: 2D Canvas roguelike |
| 2 | 2026-07-21 | — | Gameplay tests + CI hardening |
| 3 | 2026-07-21 | — | Daily assessment + bug tracker |
