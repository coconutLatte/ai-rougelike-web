import { GameState } from '../core/types';
import { SAVE_KEY } from '../utils/constants';

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

  private static deserialize(_data: string): GameState | null {
    // Deserialization is complex and will be implemented properly
    // when save/load is revisited. For now, the seed game recreates state.
    return null;
  }
}
