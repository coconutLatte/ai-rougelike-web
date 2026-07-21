# Evolution Roadmap

> **Strict cap: 10 pending max.**
> Implement mode: mark complete only. Discover/groom mode: add/remove tasks.

## Phase 0: Foundation

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P0-01 | P0 | Project skeleton with build system and minimal playable roguelike (dungeon gen, player movement, enemy AI, bump combat, FOV, HUD, save/load) | completed | 2026-07-21 | Initial seed: ~36 files, TypeScript + Vite + Canvas |

## Phase 1: Core Gameplay

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P1-01 | P1 | Item/loot system: item definitions, floor placement, pickup, inventory panel with UI | pending | — | Depends on P0-01 |
| P1-02 | P1 | Multiple enemy types with different AI behaviors (patrol, chase, flee, ranged attacks) | pending | — | Refactor behavior to strategy pattern |
| P1-03 | P1 | Level progression: stairs up/down, multi-floor dungeon with increasing difficulty scaling | pending | — | Scale enemy stats per floor |
| P1-04 | P2 | Equipment system: weapon/armor slots, stat modifications, equip/unequip UI panel | pending | — | Depends on P1-01 |
| P1-05 | P2 | Player XP and leveling: XP from kills, level-up UI with stat gains, level-up message | pending | — | XP bar in HUD |
| P1-06 | P2 | Consumable items: potions (healing, strength, etc.) with distinct use effects | pending | — | Depends on P1-01 |

## Phase 2: Polish & Experience

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P2-01 | P3 | Visual polish: damage number popups, death animations, tile color themes/variants | pending | — | Canvas text rendering for popups |
| P2-02 | P3 | Message log improvements: colored messages by type, scrollback, message filtering | pending | — | Already have basic message types |
| P2-03 | P3 | Settings menu: difficulty presets, tile size, key rebinding, display options | pending | — | Modal overlay UI |
