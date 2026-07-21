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

## Bug Fixing Protocol

The project has a daily self-assessment (`scripts/assess.sh`) that evaluates the live GitHub Pages game as a QA tester and writes findings to `docs/bugs.md`.

### When implementing (evolve.sh implement mode):
1. **Bugs get priority**: check `docs/bugs.md` first — if there are open **critical** or **major** bugs, fix them before the roadmap task
2. When a bug is fixed: move it from "Active Bugs" to "Resolved Bugs" with `Status: fixed` and today's date
3. When a roadmap task would also fix a bug: reference the bug ID in the task notes

### Bug severity guidelines:
- **critical**: Game crashes, page doesn't load, unplayable state
- **major**: Core gameplay broken (combat doesn't work, can't move, FOV broken)
- **minor**: Annoying but playable (balance issues, HUD glitches, edge cases)
- **cosmetic**: Visual polish (colors, alignment, text issues)

## Evolution Protocol

1. Read `docs/bugs.md` — check for open critical/major bugs (fix these FIRST)
2. Read `docs/roadmap.md`, find highest-priority pending task
3. Read relevant source files to understand current state
4. Implement the task or fix the bug (code + tests)
5. If fixing a bug: update `docs/bugs.md` (move to Resolved)
6. Quality gate: `npm run build && npm run lint && npm run test`
7. If quality gate fails, fix errors and retry (max 3 attempts, then skip task)
8. Update roadmap: mark task `completed` with date
9. Update README evolution stats block
10. `git add -A && git commit -m "feat(scope): description" && git push`

## Constraints

- Implement ONLY the current task; do not scope-creep
- Do NOT add new tasks to roadmap during implement mode
- Do NOT modify `scripts/evolve.sh`, `scripts/assess.sh`, or `.github/` configs
- Keep changes minimal and focused
- Follow existing patterns in the codebase

## Automation Schedule

| Script | Frequency | Purpose |
|--------|-----------|---------|
| `scripts/evolve.sh` | Every 30 min | Implement roadmap tasks |
| `scripts/assess.sh` | Once daily | QA assessment of live game → docs/bugs.md |

### Crontab example:
```
*/30 * * * * bash /path/to/project/scripts/evolve.sh >> logs/evolve.log 2>&1
0 9 * * * bash /path/to/project/scripts/assess.sh >> logs/assess.log 2>&1
```
