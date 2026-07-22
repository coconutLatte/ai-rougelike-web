# 🎮 AI Roguelike

> A browser-based turn-based roguelike game, built and evolved by AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Evolution](https://img.shields.io/badge/evolution-active-brightgreen)](docs/roadmap.md)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://coconutlatte.github.io/ai-rougelike-web/)

## Play Now

👉 **[Play on GitHub Pages](https://coconutlatte.github.io/ai-rougelike-web/)**

Or run locally:
```bash
npm install
npm run dev
```

## About

Classic grid-based roguelike running entirely in the browser:
- **Procedural dungeons** — BSP-generated rooms and corridors
- **Turn-based gameplay** — Plan each move carefully
- **Fog of war** — Recursive shadowcasting visibility
- **Enemy AI** — Chase, wander, and attack behaviors
- **Items & loot** — Potions, weapons, armor scattered throughout
- **Persistent saves** — localStorage auto-save
- **No server needed** — Pure client-side, play anywhere

## Architecture

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
              Canvas (tiles)         DOM (HUD)
```

## Controls

| Key | Action |
|---|---|
| Arrow keys / vi keys (h/j/k/l) | Move / Bump attack |
| y/u/b/n | Diagonal movement |
| g / , | Pick up item |
| . / 5 | Wait one turn |
| S | Save game |

## Evolution

This project is built using the **[AI Self-Evolution Methodology](AI-SELF-EVOLUTION-METHODOLOGY.md)** — an autonomous development framework where AI plans, implements, tests, and deploys features in 30-minute cycles.

<!-- EVOLUTION-STATS-START -->
| Metric | Value |
|--------|-------|
| Total tasks | 10 |
| Completed | 2 |
| Pending | 8 |
| Evolution rounds | 2 |
| Last evolution | 2026-07-22 |
<!-- EVOLUTION-STATS-END -->

See [docs/roadmap.md](docs/roadmap.md) for the full task list.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5 (strict) |
| Bundler | Vite 6 |
| Rendering | Canvas API + DOM |
| Testing | Vitest |
| Linting | ESLint + Prettier |
| Storage | localStorage |
| Deployment | GitHub Pages |

## License

MIT
