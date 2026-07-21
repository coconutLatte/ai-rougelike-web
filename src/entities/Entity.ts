import { Position, Stats } from '../core/types';
import type { Game } from '../core/Game';

export abstract class Entity {
  position: Position;
  stats: Stats;
  glyph: string;
  color: string;
  name: string;
  isAlive: boolean;

  constructor(name: string, glyph: string, color: string, position: Position, stats: Stats) {
    this.name = name;
    this.glyph = glyph;
    this.color = color;
    this.position = { ...position };
    this.stats = { ...stats };
    this.isAlive = true;
  }

  get hp(): number {
    return this.stats.hp;
  }

  set hp(value: number) {
    this.stats.hp = Math.max(0, Math.min(value, this.stats.maxHp));
  }

  get attack(): number {
    return this.stats.attack;
  }

  get defense(): number {
    return this.stats.defense;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isAlive = false;
      return true;
    }
    return false;
  }

  heal(amount: number): void {
    this.hp += amount;
  }

  abstract takeTurn(game: Game): void;
}
