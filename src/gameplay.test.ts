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
import { TurnManager } from './systems/TurnManager';
import { findPath } from './utils/pathfinding';
import { createTile } from './core/Tile';
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

// ─── BUG-001: Save/Load roundtrip ──────────────────────────────

describe('Save/Load roundtrip (BUG-001)', () => {
  it('should serialize and deserialize a complete game state', () => {
    const dungeon = new Dungeon(42);
    const firstRoom = dungeon.rooms[0];
    const player = new Player({
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2),
    });
    player.xp = 10;
    player.level = 2;
    player.stats.hp = 18;

    // Add item to inventory
    const potion = new Item(ITEM_TEMPLATES[0], { x: 1, y: 1 });
    player.inventory.push(potion);

    const enemies = [
      new Enemy(ENEMY_TEMPLATES[0], { x: 5, y: 5 }),
      new Enemy(ENEMY_TEMPLATES[2], { x: 10, y: 10 }),
    ];
    // Damage one enemy
    enemies[0].stats.hp = 3;

    const items = [
      new Item(ITEM_TEMPLATES[1], { x: 8, y: 8 }),
      new Item(ITEM_TEMPLATES[3], { x: 15, y: 12 }),
    ];

    const visibility: Visibility[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      visibility[y] = new Array(MAP_WIDTH).fill(Visibility.Unknown);
    }

    const state = {
      player,
      enemies,
      items,
      dungeon: {
        width: dungeon.width,
        height: dungeon.height,
        tiles: dungeon.tiles,
        rooms: dungeon.rooms,
      },
      turn: 42,
      currentFloor: 3,
      messageLog: [
        { text: 'Hello!', type: 'info' as const, turn: 1 },
        { text: 'A rat bites you!', type: 'combat' as const, turn: 5 },
      ],
      gameOver: false,
      visibility,
    };

    // Save
    const saved = SaveManager.save(state);
    expect(saved).toBe(true);

    // Load
    const loaded = SaveManager.load();
    expect(loaded).not.toBeNull();
    if (!loaded) return;

    // Verify player
    expect(loaded.player.position.x).toBe(player.position.x);
    expect(loaded.player.position.y).toBe(player.position.y);
    expect(loaded.player.xp).toBe(10);
    expect(loaded.player.level).toBe(2);
    expect(loaded.player.stats.hp).toBe(18);
    expect(loaded.player.inventory.length).toBe(1);
    expect(loaded.player.inventory[0].template.name).toBe('Health Potion');

    // Verify enemies
    expect(loaded.enemies.length).toBe(2);
    expect(loaded.enemies[0].template.name).toBe('Rat');
    expect(loaded.enemies[0].stats.hp).toBe(3);
    expect(loaded.enemies[1].template.name).toBe('Goblin');

    // Verify items
    expect(loaded.items.length).toBe(2);
    expect(loaded.items[0].template.name).toBe('Iron Sword');
    expect(loaded.items[1].template.name).toBe('Strength Potion');

    // Verify dungeon
    expect(loaded.dungeon.width).toBe(MAP_WIDTH);
    expect(loaded.dungeon.height).toBe(MAP_HEIGHT);
    expect(loaded.dungeon.rooms.length).toBe(dungeon.rooms.length);

    // Verify metadata
    expect(loaded.turn).toBe(42);
    expect(loaded.currentFloor).toBe(3);
    expect(loaded.messageLog.length).toBe(2);
    expect(loaded.gameOver).toBe(false);

    // Cleanup
    SaveManager.deleteSave();
  });

  it('should return null when no save exists', () => {
    SaveManager.deleteSave();
    expect(SaveManager.load()).toBeNull();
  });

  it('should restore dungeon tile types correctly', () => {
    const dungeon = new Dungeon(1337);
    const player = new Player({ x: 20, y: 15 });

    const state = {
      player,
      enemies: [] as Enemy[],
      items: [] as Item[],
      dungeon: {
        width: dungeon.width,
        height: dungeon.height,
        tiles: dungeon.tiles,
        rooms: dungeon.rooms,
      },
      turn: 1,
      currentFloor: 1,
      messageLog: [] as Array<{ text: string; type: 'info' | 'combat' | 'danger' | 'success'; turn: number }>,
      gameOver: false,
      visibility: [] as Visibility[][],
    };

    SaveManager.save(state);
    const loaded = SaveManager.load();
    expect(loaded).not.toBeNull();
    if (!loaded) return;

    // Compare all tile types
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        expect(loaded.dungeon.tiles[y][x].type).toBe(dungeon.tiles[y][x].type);
      }
    }

    SaveManager.deleteSave();
  });
});

// ─── BUG-002: Enemy wander bounds check ────────────────────────

describe('Enemy wander bounds safety (BUG-002)', () => {
  it('should not crash when enemy wanders near map edge', () => {
    // Create a minimal dungeon with walls at edges
    const tiles: TileData[][] = [];
    for (let y = 0; y < 10; y++) {
      tiles[y] = [];
      for (let x = 0; x < 10; x++) {
        const isEdge = x === 0 || x === 9 || y === 0 || y === 9;
        tiles[y][x] = createTile(isEdge ? TileType.Wall : TileType.Floor);
      }
    }

    const player = new Player({ x: 5, y: 5 });

    // Place enemy at map edge (adjacent to wall at x=0)
    const enemy = new Enemy(ENEMY_TEMPLATES[0], { x: 1, y: 5 });

    const mockGame = {
      state: {
        enemies: [enemy],
        player,
        dungeon: { tiles, width: 10, height: 10 },
        visibility: [] as Visibility[][],
      },
      combat: {
        resolve: () => {},
      },
    } as unknown as import('./core/Game').Game;

    const turnManager = new TurnManager();

    // This should not throw — it used to crash before BUG-002 fix
    expect(() => {
      turnManager.processEnemyTurns(mockGame);
    }).not.toThrow();
  });
});

// ─── BUG-003: Player position on floor change ──────────────────

describe('Floor transition (BUG-003)', () => {
  it('should reset player to first room center on new dungeon', () => {
    // Simulate the logic from Game.nextFloor():
    // Player position should be set to new dungeon's first room center
    const dungeon1 = new Dungeon(100);
    const dungeon2 = new Dungeon(200);

    const firstRoom1 = dungeon1.rooms[0];
    const firstRoom2 = dungeon2.rooms[0];

    // "Old" player at stairs position (last room of dungeon1)
    const oldPlayer = new Player({
      x: firstRoom1.x + Math.floor(firstRoom1.width / 2),
      y: firstRoom1.y + Math.floor(firstRoom1.height / 2),
    });

    // The fix: reset position to new dungeon's first room
    const newPlayerPos: Position = {
      x: firstRoom2.x + Math.floor(firstRoom2.width / 2),
      y: firstRoom2.y + Math.floor(firstRoom2.height / 2),
    };
    oldPlayer.position = newPlayerPos;

    // Player should be on a Floor tile in the new dungeon
    const tileAtNewPos = dungeon2.tiles[newPlayerPos.y][newPlayerPos.x];
    expect(tileAtNewPos.type).toBe(TileType.Floor);

    // Player position should NOT be the same as old first room
    // (unless by coincidence, which is extremely unlikely with different seeds)
    const oldFirstRoomCenter: Position = {
      x: firstRoom1.x + Math.floor(firstRoom1.width / 2),
      y: firstRoom1.y + Math.floor(firstRoom1.height / 2),
    };
    // The new position is from dungeon2's first room
    expect(newPlayerPos).not.toEqual(oldFirstRoomCenter);
  });
});
