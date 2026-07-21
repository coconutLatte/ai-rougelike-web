# AI Roguelike

A browser-based turn-based roguelike game, built incrementally by AI evolution.

## Project Positioning

Classic grid-based roguelike running entirely in the browser. No server, no database — pure client-side game with localStorage persistence. Deployed to GitHub Pages for instant play.

## Tech Stack

- **TypeScript 5** (strict mode) — catches AI-generated errors at compile time
- **Vite 6** — fast dev server + optimized production builds
- **Canvas API** — game world tile rendering
- **DOM** — HUD and UI overlays
- **Vitest** — testing
- **ESLint + Prettier** — linting gate
- **GitHub Pages** — deployment from `docs/` directory

## Architecture

Entity-based game architecture (not full ECS):

```
src/
  core/       Game.ts, Dungeon.ts, Tile.ts, types.ts
  entities/   Entity.ts, Player.ts, Enemy.ts, Item.ts
  systems/    RenderSystem.ts, CombatSystem.ts, FOVSystem.ts,
              InputHandler.ts, SaveManager.ts, TurnManager.ts
  ui/         HUD.ts
  data/       enemies.ts, items.ts, colors.ts
  utils/      rng.ts, pathfinding.ts, constants.ts
```

**Data flow**: InputHandler → Game.update() → CombatSystem → Enemy AI → FOVSystem → RenderSystem (Canvas) + HUD (DOM)

## Coding Conventions

- All interfaces in `src/core/types.ts`
- Entities extend abstract `Entity` class
- Systems operate on GameState; keep rendering out of entities
- Canvas rendering only in RenderSystem
- Commit format: `feat(scope): description`
- Tile size from `utils/constants.ts` — never hardcode
- Colors from `data/colors.ts` — never inline hex values
- Seeded RNG for all procedural generation

## Quality Gates

Every change must pass ALL gates before commit/push:

### Local (pre-push hook via `.githooks/pre-push`)
1. `npx tsc --noEmit` — zero type errors
2. `npm run lint` — zero ESLint errors
3. `npm run build` — successful Vite build
4. `npm run test` — all 23+ tests pass (5 unit + 18 gameplay)

### CI/CD (GitHub Actions `.github/workflows/deploy.yml`)
- `quality-gate` job: runs type check + lint + gameplay tests
- `deploy` job: only runs if quality gate passes
- Build output verification: confirms `dist/index.html` and `dist/assets/` exist
- **Broken code CANNOT reach GitHub Pages** — deploy job depends on gate passing

### Gameplay tests verify the game is actually playable:
- Dungeon connectivity (all rooms reachable via A*)
- Combat damage calculation and death
- FOV visibility and wall blocking
- Player level-up and item usage
- Save/load roundtrip
- Full game session smoke test
- Systems operate on GameState; keep rendering out of entities
- Canvas rendering only in RenderSystem
- Commit format: `feat(scope): description`
- Tile size from `utils/constants.ts` — never hardcode
- Colors from `data/colors.ts` — never inline hex values
- Seeded RNG for all procedural generation

## Evolution Protocol

1. Read `docs/roadmap.md`, find highest-priority pending task
2. Read relevant source files to understand current state
3. Implement the task (code + tests)
4. Quality gate: `npm run build && npm run lint && npm run test`
5. If quality gate fails, fix errors and retry (max 3 attempts, then skip task)
6. Update roadmap: mark task `completed` with date
7. Update README evolution stats block
8. `git add -A && git commit -m "feat(scope): description" && git push`

## Constraints

- Implement ONLY the current task; do not scope-creep
- Do NOT add new tasks to roadmap during implement mode
- Do NOT modify `scripts/evolve.sh` or `.github/` configs
- Keep changes minimal and focused
- Follow existing patterns in the codebase
