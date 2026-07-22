import { GameState, Visibility, TileType } from '../core/types';
import { SAVE_KEY } from '../utils/constants';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Item } from '../entities/Item';
import { ENEMY_TEMPLATES } from '../data/enemies';
import { ITEM_TEMPLATES } from '../data/items';
import { createTile } from '../core/Tile';
import { MAP_WIDTH, MAP_HEIGHT } from '../utils/constants';

export class SaveManager {
  static save(state: GameState): boolean {
    try {
      const data = SaveManager.serialize(state);
      localStorage.setItem(SAVE_KEY, data);
      return true;
    } catch {
      return false;
    }
  }

  static load(): GameState | null {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return null;
      return SaveManager.deserialize(data);
    } catch {
      return null;
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  private static serialize(state: GameState): string {
    // We only serialize the essential data, not circular references
    const data = {
      player: {
        x: state.player.position.x,
        y: state.player.position.y,
        stats: { ...state.player.stats },
        xp: state.player.xp,
        level: state.player.level,
        inventory: state.player.inventory.map((item) => ({
          templateName: item.template.name,
          x: item.position.x,
          y: item.position.y,
        })),
      },
      enemies: state.enemies.map((e) => ({
        templateName: e.template.name,
        x: e.position.x,
        y: e.position.y,
        stats: { ...e.stats },
      })),
      items: state.items.map((item) => ({
        templateName: item.template.name,
        x: item.position.x,
        y: item.position.y,
      })),
      dungeon: {
        width: state.dungeon.width,
        height: state.dungeon.height,
        tiles: state.dungeon.tiles.map((row) =>
          row.map((t) => ({
            type: t.type,
            explored: t.explored,
          })),
        ),
        roomData: state.dungeon.rooms.map((r) => ({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        })),
      },
      turn: state.turn,
      currentFloor: state.currentFloor,
      messageLog: state.messageLog.slice(-50), // Keep last 50 messages
      seed: 0, // We'll need to store this
    };
    return JSON.stringify(data);
  }

  private static deserialize(data: string): GameState | null {
    try {
      const raw = JSON.parse(data);

      // Reconstruct dungeon tiles
      const tiles = raw.dungeon.tiles.map((row: Array<{ type: number; explored: boolean }>) =>
        row.map((t: { type: number; explored: boolean }) => {
          const tile = createTile(t.type as TileType);
          tile.explored = t.explored;
          return tile;
        }),
      );

      // Reconstruct rooms
      const rooms = raw.dungeon.roomData.map(
        (r: { x: number; y: number; width: number; height: number }) => ({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        }),
      );

      // Reconstruct player
      const player = new Player({ x: raw.player.x, y: raw.player.y });
      player.stats = { ...raw.player.stats };
      player.xp = raw.player.xp;
      player.level = raw.player.level;

      // Reconstruct player inventory
      player.inventory = [];
      for (const itemData of raw.player.inventory) {
        const template = ITEM_TEMPLATES.find((t) => t.name === itemData.templateName);
        if (template) {
          const item = new Item(template, { x: itemData.x, y: itemData.y });
          player.inventory.push(item);
        }
      }

      // Reconstruct enemies
      const enemies = raw.enemies.map(
        (e: { templateName: string; x: number; y: number; stats: import('../core/types').Stats }) => {
          const template = ENEMY_TEMPLATES.find((t) => t.name === e.templateName);
          if (!template) return null;
          const enemy = new Enemy(template, { x: e.x, y: e.y });
          enemy.stats = { ...e.stats };
          return enemy;
        },
      ).filter(Boolean);

      // Reconstruct items
      const items = raw.items.map(
        (i: { templateName: string; x: number; y: number }) => {
          const template = ITEM_TEMPLATES.find((t) => t.name === i.templateName);
          if (!template) return null;
          return new Item(template, { x: i.x, y: i.y });
        },
      ).filter(Boolean);

      // Build visibility grid (fresh — recomputed on next compute())
      const visibility: Visibility[][] = [];
      for (let y = 0; y < MAP_HEIGHT; y++) {
        visibility[y] = new Array(MAP_WIDTH).fill(Visibility.Unknown);
      }

      return {
        player,
        enemies,
        items,
        dungeon: {
          width: raw.dungeon.width,
          height: raw.dungeon.height,
          tiles,
          rooms,
        },
        turn: raw.turn,
        currentFloor: raw.currentFloor,
        messageLog: raw.messageLog ?? [],
        gameOver: false,
        visibility,
      };
    } catch {
      return null;
    }
  }
}
