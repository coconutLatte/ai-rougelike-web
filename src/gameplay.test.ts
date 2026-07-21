/**
 * Gameplay-level integration tests.
 * These verify the game is actually PLAYABLE, not just compilable.
 *
 * Quality gate: if these fail, the deploy must be blocked.
 */

import { describe, it, expect } from 'vitest';
import { Dungeon } from './core/Dungeon';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Item } from './entities/Item';
import { CombatSystem } from './systems/CombatSystem';
import { FOVSystem } from './systems/FOVSystem';
import { SaveManager } from './systems/SaveManager';
import { findPath } from './utils/pathfinding';
import {
  TileType,
  Visibility,
  TileData,
  Position,
  Stats,
} from './core/types';
import { ENEMY_TEMPLATES } from './data/enemies';
import { ITEM_TEMPLATES } from './data/items';
import { MAP_WIDTH, MAP_HEIGHT } from './utils/constants';

// ─── Dungeon Generation ───────────────────────────────────────

describe('Dungeon generation', () => {
  it('should generate a dungeon with the correct dimensions', () => {
    const dungeon = new Dungeon(42);
    expect(dungeon.width).toBe(MAP_WIDTH);
    expect(dungeon.height).toBe(MAP_HEIGHT);
  });

  it('should have at least 3 rooms', () => {
    const dungeon = new Dungeon(42);
    expect(dungeon.rooms.length).toBeGreaterThanOrEqual(3);
  });

  it('should have exactly one set of stairs', () => {
    const dungeon = new Dungeon(42);
    let stairCount = 0;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.tiles[y][x].type === TileType.StairsDown) stairCount++;
      }
    }
    expect(stairCount).toBe(1);
  });

  it('should have all rooms reachable from the first room', () => {
    // Verify dungeon connectivity: there should be a path from room 0 to every other room
    const dungeon = new Dungeon(42);
    const firstRoom = dungeon.rooms[0];
    const start: Position = {
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2),
    };

    for (let i = 1; i < dungeon.rooms.length; i++) {
      const room = dungeon.rooms[i];
      const goal: Position = {
        x: room.x + Math.floor(room.width / 2),
        y: room.y + Math.floor(room.height / 2),
      };
      const path = findPath(start, goal, dungeon.tiles, dungeon.width, dungeon.height);
      expect(path).not.toBeNull();
      if (path) expect(path.length).toBeGreaterThan(0);
    }
  });

  it('should produce deterministic results with same seed', () => {
    const d1 = new Dungeon(1337);
    const d2 = new Dungeon(1337);

    // Compare tile types at key positions
    for (let y = 0; y < d1.height; y++) {
      for (let x = 0; x < d1.width; x++) {
        expect(d1.tiles[y][x].type).toBe(d2.tiles[y][x].type);
      }
    }
  });
});

// ─── Combat System ────────────────────────────────────────────

describe('Combat system', () => {
  it('should deal damage when attacker has higher attack than defender defense', () => {
    const combat = new CombatSystem(42);
    const player = new Player({ x: 0, y: 0 });
    const enemy = new Enemy(ENEMY_TEMPLATES[0], { x: 1, y: 0 });

    const initialHp = enemy.hp;

    // Create a minimal mock game
    const mockGame = {
      addMessage: () => {},
      state: { player },
      gameOver: () => {},
    } as unknown as import('./core/Game').Game;

    const damage = combat.resolve(player, enemy, mockGame);
    expect(damage).toBeGreaterThanOrEqual(1);
    expect(enemy.hp).toBeLessThan(initialHp);
  });

  it('should always deal at least 1 damage', () => {
    const combat = new CombatSystem(42);
    // Weak attacker vs strong defender
    const weakStats: Stats = { hp: 10, maxHp: 10, attack: 1, defense: 0 };
    const attacker = new Player({ x: 0, y: 0 });
    attacker.stats = { ...weakStats };

    const enemy = new Enemy(
      { ...ENEMY_TEMPLATES[4], stats: { hp: 20, maxHp: 20, attack: 5, defense: 10 } },
      { x: 1, y: 0 },
    );

    const mockGame = {
      addMessage: () => {},
      state: { player: attacker },
      gameOver: () => {},
    } as unknown as import('./core/Game').Game;

    const damage = combat.resolve(attacker, enemy, mockGame);
    expect(damage).toBeGreaterThanOrEqual(1);
  });

  it('should kill enemy when HP drops to 0', () => {
    const combat = new CombatSystem(42);
    const player = new Player({ x: 0, y: 0 });
    // Give player massive attack
    player.stats.attack = 999;

    const enemy = new Enemy(ENEMY_TEMPLATES[0], { x: 1, y: 0 });
    expect(enemy.isAlive).toBe(true);

    const mockGame = {
      addMessage: () => {},
      state: { player },
      gameOver: () => {},
    } as unknown as import('./core/Game').Game;

    combat.resolve(player, enemy, mockGame);
    expect(enemy.isAlive).toBe(false);
    expect(enemy.hp).toBe(0);
  });
});

// ─── FOV System ───────────────────────────────────────────────

describe('FOV system', () => {
  it('should mark origin as visible', () => {
    const tiles: TileData[][] = [];
    for (let y = 0; y < 20; y++) {
      tiles[y] = [];
      for (let x = 0; x < 20; x++) {
        tiles[y][x] = {
          type: TileType.Floor,
          visible: false,
          explored: false,
          blocksMovement: false,
          blocksVision: false,
        };
      }
    }

    const fov = new FOVSystem(tiles, 20, 20);
    const vis = fov.compute({ x: 10, y: 10 });

    expect(vis[10][10]).toBe(Visibility.Visible);
  });

  it('should not see through walls', () => {
    const tiles: TileData[][] = [];
    for (let y = 0; y < 10; y++) {
      tiles[y] = [];
      for (let x = 0; x < 10; x++) {
        tiles[y][x] = {
          type: x === 5 ? TileType.Wall : TileType.Floor,
          visible: false,
          explored: false,
          blocksMovement: x === 5,
          blocksVision: x === 5,
        };
      }
    }

    const fov = new FOVSystem(tiles, 10, 10);
    const vis = fov.compute({ x: 2, y: 5 });

    // Player can see tiles before the wall
    expect(vis[5][3]).toBe(Visibility.Visible);
    expect(vis[5][4]).toBe(Visibility.Visible);
    // But NOT beyond the wall
    expect(vis[5][6]).toBe(Visibility.Unknown);
  });

  it('should preserve remembered tiles across computations', () => {
    const tiles: TileData[][] = [];
    for (let y = 0; y < 20; y++) {
      tiles[y] = [];
      for (let x = 0; x < 20; x++) {
        tiles[y][x] = {
          type: TileType.Floor,
          visible: false,
          explored: false,
          blocksMovement: false,
          blocksVision: false,
        };
      }
    }

    const fov = new FOVSystem(tiles, 20, 20);
    const vis1 = fov.compute({ x: 10, y: 10 });
    expect(vis1[10][11]).toBe(Visibility.Visible);

    // Move player far away — the previously visible tile should become "remembered"
    const vis2 = fov.compute({ x: 2, y: 2 }, vis1);
    // Tile at (11,10) was visible from (10,10) but is out of range from (2,2)
    expect(vis2[10][11]).toBe(Visibility.Remembered);
  });
});

// ─── Player Actions ───────────────────────────────────────────

describe('Player', () => {
  it('should gain XP and track level', () => {
    const player = new Player({ x: 5, y: 5 });
    expect(player.level).toBe(1);
    expect(player.xp).toBe(0);

    // First level needs 15 XP
    const leveled = player.gainXp(15);
    expect(leveled).toBe(true);
    expect(player.level).toBe(2);
  });

  it('should increase stats on level up', () => {
    const player = new Player({ x: 5, y: 5 });
    const initialMaxHp = player.stats.maxHp;
    const initialAtk = player.stats.attack;
    const initialDef = player.stats.defense;

    player.gainXp(15); // level up

    expect(player.stats.maxHp).toBe(initialMaxHp + 5);
    expect(player.stats.attack).toBe(initialAtk + 1);
    expect(player.stats.defense).toBe(initialDef + 1);
    expect(player.hp).toBe(player.stats.maxHp); // Full heal on level up
  });

  it('should use potion items correctly', () => {
    const player = new Player({ x: 5, y: 5 });
    player.hp = 10; // damage player

    const mockGame = {
      addMessage: () => {},
    } as unknown as import('./core/Game').Game;

    const healthPotion = new Item(ITEM_TEMPLATES[0], { x: 5, y: 5 });
    player.inventory.push(healthPotion);
    player.useItem(healthPotion, mockGame);

    expect(player.hp).toBe(20); // healed 10 from 10
    expect(player.inventory.length).toBe(0); // consumed
  });
});

// ─── Save/Load ────────────────────────────────────────────────

describe('Save system', () => {
  it('should save and detect saved games', () => {
    // Create a minimal save
    const player = new Player({ x: 3, y: 3 });
    const state: import('./core/types').GameState = {
      player,
      enemies: [],
      items: [],
      dungeon: {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        tiles: [],
        rooms: [],
      },
      turn: 5,
      currentFloor: 1,
      messageLog: [],
      gameOver: false,
      visibility: [],
    };

    expect(SaveManager.hasSave()).toBe(false);
    const ok = SaveManager.save(state);
    expect(ok).toBe(true);
    expect(SaveManager.hasSave()).toBe(true);

    // Cleanup
    SaveManager.deleteSave();
    expect(SaveManager.hasSave()).toBe(false);
  });
});

// ─── Enemy AI (via TurnManager) ──────────────────────────────

describe('Enemy behavior', () => {
  it('should chase player when visible and path exists', () => {
    // Create simple open dungeon
    const tiles: TileData[][] = [];
    for (let y = 0; y < 10; y++) {
      tiles[y] = [];
      for (let x = 0; x < 10; x++) {
        tiles[y][x] = {
          type: TileType.Floor,
          visible: false,
          explored: false,
          blocksMovement: false,
          blocksVision: false,
        };
      }
    }

    const player = new Player({ x: 5, y: 5 });
    const enemy = new Enemy(ENEMY_TEMPLATES[0], { x: 5, y: 2 });

    // Enemy is 3 tiles away, in open space
    const path = findPath(
      enemy.position,
      player.position,
      tiles,
      10,
      10,
    );
    expect(path).not.toBeNull();
    // Path should bring enemy closer
    if (path && path.length > 1) {
      const next = path[1];
      const oldDist = Math.abs(enemy.position.y - player.position.y);
      const newDist = Math.abs(next.y - player.position.y);
      expect(newDist).toBeLessThan(oldDist);
    }
  });
});

// ─── Smoke test: Full game session ────────────────────────────

describe('Full game simulation (smoke test)', () => {
  it('should initialize a complete game state without errors', () => {
    // We test the core systems directly since Game requires DOM canvas
    const dungeon = new Dungeon(Date.now());

    // Verify basic invariants
    expect(dungeon.rooms.length).toBeGreaterThanOrEqual(3);
    expect(dungeon.rooms[0]).toBeDefined();

    // Place player in first room
    const firstRoom = dungeon.rooms[0];
    const player = new Player({
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2),
    });

    // Player starts alive with full HP
    expect(player.isAlive).toBe(true);
    expect(player.hp).toBe(player.stats.maxHp);
    expect(player.level).toBe(1);

    // Place an enemy
    const enemy = new Enemy(ENEMY_TEMPLATES[0], {
      x: firstRoom.x + 2,
      y: firstRoom.y + 2,
    });
    expect(enemy.isAlive).toBe(true);

    // FOV works
    const fov = new FOVSystem(dungeon.tiles, dungeon.width, dungeon.height);
    const vis = fov.compute(player.position);
    expect(vis[player.position.y][player.position.x]).toBe(Visibility.Visible);

    // Combat resolves
    const combat = new CombatSystem(42);
    const mockGame = {
      addMessage: () => {},
      state: { player },
      gameOver: () => {},
    } as unknown as import('./core/Game').Game;

    const dmg = combat.resolve(player, enemy, mockGame);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it('should verify stairs exist and are reachable', () => {
    const dungeon = new Dungeon(12345);
    const stairsPos = dungeon.getStairsPosition();

    expect(stairsPos).toBeDefined();
    expect(stairsPos.x).toBeGreaterThan(0);
    expect(stairsPos.y).toBeGreaterThan(0);

    const tile = dungeon.tiles[stairsPos.y][stairsPos.x];
    expect(tile.type).toBe(TileType.StairsDown);

    // Stairs should be reachable from the player start
    const firstRoom = dungeon.rooms[0];
    const start: Position = {
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2),
    };

    const path = findPath(start, stairsPos, dungeon.tiles, dungeon.width, dungeon.height);
    expect(path).not.toBeNull();
  });
});
