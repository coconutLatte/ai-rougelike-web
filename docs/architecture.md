# Architecture: AI Roguelike

> Auto-generated and maintained by the evolution engine.

## Overview

A classic turn-based, grid-based roguelike game that runs entirely in the browser. Built with TypeScript and rendered on HTML5 Canvas, deployed via GitHub Pages.

## Tech Stack

| Component | Choice | Notes |
|---|---|---|
| Language | TypeScript 5 (strict) | Catches AI errors at compile time |
| Bundler | Vite 6 | Fast dev server, optimized production builds |
| Rendering | Canvas (game) + DOM (UI) | Canvas for tiles/FOV, DOM for text UI |
| Testing | Vitest | Fast, Vite-native, ESM-compatible |
| Storage | localStorage | No server needed |
| Deployment | GitHub Pages | Static files from `npm run build` |

## Project Structure

```
src/
├── main.ts                 Entry point, DOM wiring
├── core/                   Game core (Game, Dungeon, Tile, types)
├── entities/               Game entities (Entity, Player, Enemy, Item)
├── systems/                Game systems (Render, Combat, FOV, Input, Save, Turn)
├── ui/                     DOM-based UI (HUD)
├── data/                   Static data (enemy/item definitions, colors)
└── utils/                  Utilities (RNG, pathfinding, constants)
```

## Core Architecture

### Game Loop

The game is turn-based. Each player action triggers one full update cycle:

1. **Input**: Keyboard event → InputHandler → Action dispatched
2. **Player Action**: Move, bump-attack, wait, or pickup
3. **Enemy Turns**: Each enemy takes its turn (chase if player visible, wander otherwise)
4. **Systems Update**: FOV recomputed, death checks
5. **Render**: Canvas redraws visible tiles + entities, HUD updates DOM stats

### Dungeon Generation

BSP (Binary Space Partitioning):
- Recursively split space into leaf regions
- Place rooms in leaves with margin
- Connect sibling rooms with L-shaped corridors
- Place entities (player in first room, enemies/items in others, stairs in last)

### Field of View

Recursive shadowcasting in 8 octants. Three visibility states:
- **Visible**: Currently in FOV — full brightness
- **Remembered**: Previously seen — dim rendering
- **Unknown**: Never seen — black

### Combat

Bump-to-attack: moving into an enemy's tile triggers an attack.
`damage = max(1, attacker.attack - defender.defense + random(-2, 2))`

### Save System

GameState serialized to JSON, stored in localStorage. Auto-saves on floor transitions.

## Data Flow

```
┌──────────┐    Action    ┌──────────┐
│ Keyboard │─────────────►│   Game   │
└──────────┘              └────┬─────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        CombatSystem     TurnManager       FOVSystem
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                        RenderSystem
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                 Canvas                DOM/HUD
```

## Key Design Decisions

1. **Entity-based, not ECS**: Few entity types; simple class hierarchy with composition. More maintainable for AI-driven evolution.

2. **Canvas + DOM hybrid**: Canvas for pixel-perfect tiles and FOV alpha blending. DOM for text-heavy UI (stats, message log). Each technology used where it excels.

3. **Seeded RNG**: Dungeon generation uses mulberry32 PRNG. Enables reproducible dungeons for testing and debugging.

4. **Single GameState object**: Entire game state is one serializable object. Simplifies save/load, state restoration, and debugging.

5. **Turn-based with explicit ordering**: Player acts, then all enemies in sequence. No real-time concerns, no scheduling complexity.

## Evolution History

| Round | Date | Task | Description |
|---|---|---|---|
| 1 | 2026-07-21 | P0-01 | Initial seed: project skeleton + minimal playable roguelike |
